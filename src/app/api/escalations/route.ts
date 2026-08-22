import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEscalationHandoffNote } from "@/lib/founder-intelligence/nodes/escalation-node";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const {
      startupId,
      escalatedBy,
      escalatedToRole = "Investment Committee",
      analystNote,
      manualNote,
      title,
      teamId,
      shareWithAll = true,
      sharedWithEmails = [],
      assignedToEmail,
      pendingActions,
      keyDecisions,
    } = body;

    if (!startupId || !escalatedBy) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (startupId, escalatedBy)" },
        { status: 400 }
      );
    }

    // 1. Fetch Startup Details
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
    });

    if (!startup) {
      return NextResponse.json({ success: false, error: "Startup not found" }, { status: 404 });
    }

    let finalHandoffNote = manualNote;

    // If no manual note provided, synthesize using AI agent
    if (!finalHandoffNote) {
      // Fetch recent AI diligence findings (if any)
      const recentRun = await prisma.analysisRun.findFirst({
        where: { startupId, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        include: { findings: true },
      });

      let diligenceSummary = "";
      if (recentRun && recentRun.findings.length > 0) {
        diligenceSummary = recentRun.findings
          .map((f: any) => `- **${f.title}**: ${f.content.substring(0, 200)}...`)
          .join("\n");
      }

      // Generate the Handoff Note using Gemini
      finalHandoffNote = await generateEscalationHandoffNote({
        startup,
        analystNote,
        escalatedBy,
        diligenceSummary,
      });
    }

    // 4. Save Escalation to Database
    const escalation = await prisma.escalation.create({
      data: {
        startupId,
        escalatedBy,
        escalatedToRole,
        analystNote: analystNote || null,
        aiHandoffNote: finalHandoffNote,
        status: "PENDING",
        teamId: teamId || null,
        shareWithAll: !!shareWithAll,
        sharedWithEmails: Array.isArray(sharedWithEmails) ? sharedWithEmails : [],
      },
    });

    // Also persist in HandoffNote table for team tracking
    try {
      await prisma.handoffNote.create({
        data: {
          startupId,
          createdBy: escalatedBy,
          assignedTo: assignedToEmail || (sharedWithEmails.length === 1 ? sharedWithEmails[0] : null),
          title: title || `IC Handoff: ${startup.name}`,
          context: finalHandoffNote,
          pendingActions: pendingActions || null,
          keyDecisions: keyDecisions || null,
          status: "OPEN",
        }
      });
    } catch (hnErr) {
      console.warn("Could not save to HandoffNote table:", hnErr);
    }

    // 5. Notify all relevant team members and shared emails
    const notifyEmails = new Set<string>();

    // If a team is attached, notify all OWNER and EDITOR members of that team
    if (teamId) {
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId, role: { in: ["OWNER", "EDITOR"] } },
        select: { userEmail: true },
      });
      teamMembers.forEach((m) => notifyEmails.add(m.userEmail));
    }

    // Notify explicitly shared emails
    if (sharedWithEmails && sharedWithEmails.length > 0) {
      sharedWithEmails.forEach((email: string) => notifyEmails.add(email));
    }

    // If shareWithAll and no specific emails, at least notify the escalatedToRole as a generic target
    if (notifyEmails.size === 0) {
      notifyEmails.add(escalatedToRole);
    }

    // Remove the person who escalated (they already know)
    notifyEmails.delete(escalatedBy);

    // Create notifications for each team member
    await Promise.all(
      Array.from(notifyEmails).map((email) =>
        prisma.notification.create({
          data: {
            userEmail: email,
            type: "ESCALATION",
            title: `Deal Escalated: ${startup.name}`,
            message: `${escalatedBy} escalated ${startup.name} for your review.`,
            category: "request",
            metadata: { escalationId: escalation.id, startupId: startup.id },
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: escalation,
    });
  } catch (error: any) {
    console.error("[POST /api/escalations] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to escalate deal" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const email = searchParams.get("email");
    const startupId = searchParams.get("startupId");
    const founderEmail = searchParams.get("founderEmail");

    let startupIds: string[] = [];
    if (startupId) {
      startupIds.push(startupId);
    }

    if (founderEmail) {
      const normalizedFounder = founderEmail.trim().toLowerCase();
      const founderStartups = await prisma.startup.findMany({
        where: {
          OR: [
            { founderProfile: { email: { equals: normalizedFounder, mode: "insensitive" } } },
            {
              collaborators: {
                some: {
                  userEmail: { equals: normalizedFounder, mode: "insensitive" },
                  status: "ACTIVE",
                },
              },
            },
          ],
        },
        select: { id: true },
      });
      founderStartups.forEach((s) => {
        if (!startupIds.includes(s.id)) startupIds.push(s.id);
      });
    }

    // Find all teams the user belongs to (if email is provided)
    let userTeamIds: string[] = [];
    if (email) {
      const userTeams = await prisma.teamMember.findMany({
        where: { userEmail: email },
        select: { teamId: true },
      });
      userTeamIds = userTeams.map((t) => t.teamId);
    }

    const whereClause: any = { OR: [] };

    if (startupIds.length > 0) {
      whereClause.OR.push({ startupId: { in: startupIds } });
    }

    if (role) whereClause.OR.push({ escalatedToRole: role });
    if (email) whereClause.OR.push({ escalatedBy: email });

    // Sharing logic: User is in the team AND (shareWithAll is true OR user email is in sharedWithEmails)
    if (userTeamIds.length > 0 && email) {
      whereClause.OR.push({
        teamId: { in: userTeamIds },
        OR: [{ shareWithAll: true }, { sharedWithEmails: { has: email } }],
      });
    }

    if (whereClause.OR.length === 0) {
      delete whereClause.OR;
    }

    const escalations = await prisma.escalation.findMany({
      where: whereClause,
      include: {
        startup: {
          select: { id: true, name: true, category: true, stage: true },
        },
        team: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: escalations });
  } catch (error: any) {
    console.error("[GET /api/escalations] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch escalations" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { id, aiHandoffNote, userEmail } = body;

    if (!id || !aiHandoffNote) {
      return NextResponse.json({ error: "Missing id or aiHandoffNote" }, { status: 400 });
    }

    // Check permissions
    const escalation = await prisma.escalation.findUnique({
      where: { id },
      include: { team: true }
    });

    if (!escalation) {
      return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
    }

    if (escalation.teamId && userEmail) {
      // Check if user is OWNER or EDITOR
      const member = await prisma.teamMember.findUnique({
        where: {
          teamId_userEmail: {
            teamId: escalation.teamId,
            userEmail
          }
        }
      });

      if (!member || (member.role !== "OWNER" && member.role !== "EDITOR")) {
        return NextResponse.json({ error: "Forbidden: You don't have edit permissions for this team's escalation." }, { status: 403 });
      }
    } else if (escalation.escalatedBy !== userEmail) {
      // If it doesn't belong to a team, only the creator can edit it
      return NextResponse.json({ error: "Forbidden: You can only edit your own escalations." }, { status: 403 });
    }

    const updated = await prisma.escalation.update({
      where: { id },
      data: { aiHandoffNote }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[PUT /api/escalations] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
