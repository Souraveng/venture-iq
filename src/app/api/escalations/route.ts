import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEscalationHandoffNote } from "@/lib/founder-intelligence/nodes/escalation-node";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { startupId, escalatedBy, escalatedToRole, analystNote, teamId, shareWithAll = true, sharedWithEmails = [] } = body;

    if (!startupId || !escalatedBy || !escalatedToRole) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (startupId, escalatedBy, escalatedToRole)" },
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

    // 2. Fetch recent AI diligence findings (if any)
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

    // 3. Generate the Handoff Note using Gemini 3.1 Pro
    const aiHandoffNote = await generateEscalationHandoffNote({
      startup,
      analystNote,
      escalatedBy,
      diligenceSummary,
    });

    // 4. Save to Database
    const escalation = await prisma.escalation.create({
      data: {
        startupId,
        escalatedBy,
        escalatedToRole,
        analystNote,
        aiHandoffNote,
        status: "PENDING",
        teamId: teamId || null,
        shareWithAll,
        sharedWithEmails,
      },
    });

    // (Optional) Trigger an in-app notification to the IC role
    await prisma.notification.create({
      data: {
        userEmail: escalatedToRole, // If role is mapped to emails, otherwise generic "IC"
        type: "ESCALATION",
        title: `Deal Escalated: ${startup.name}`,
        message: `${escalatedBy} escalated ${startup.name} for your review.`,
        category: "request",
        metadata: { escalationId: escalation.id, startupId: startup.id },
      },
    });

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

    // Find all teams the user belongs to (if email is provided)
    let userTeamIds: string[] = [];
    if (email) {
      const userTeams = await prisma.teamMember.findMany({
        where: { userEmail: email },
        select: { teamId: true }
      });
      userTeamIds = userTeams.map(t => t.teamId);
    }

    // Build the query: Escalated to this role, OR created by this user, OR belongs to a team the user is in (with granular checks).
    const whereClause: any = { OR: [] };
    
    if (role) whereClause.OR.push({ escalatedToRole: role });
    if (email) whereClause.OR.push({ escalatedBy: email });
    
    // Sharing logic: User is in the team AND (shareWithAll is true OR user email is in sharedWithEmails)
    if (userTeamIds.length > 0 && email) {
      whereClause.OR.push({
        teamId: { in: userTeamIds },
        OR: [
          { shareWithAll: true },
          { sharedWithEmails: { has: email } }
        ]
      });
    }

    // Fallback if no filters are provided, just return all (or we could return empty)
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
          select: { name: true }
        }
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
