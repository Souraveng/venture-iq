import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserVentureRole } from "@/lib/permissions";

/**
 * POST /api/ventures/handoff-notes/generate
 * AI-generates a handoff note by aggregating venture state data.
 * Body: { startupId, assignedTo? }
 * Requires OWNER or EDITOR role.
 */
export async function POST(req: NextRequest) {
  try {
    const userEmail = req.headers.get("x-user-email");
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { startupId, assignedTo } = body as {
      startupId: string;
      assignedTo?: string;
    };

    if (!startupId) {
      return NextResponse.json(
        { error: "startupId is required" },
        { status: 400 }
      );
    }

    // Check permission
    const callerRole = await getUserVentureRole(userEmail, startupId);
    if (!callerRole || callerRole === "VIEWER") {
      return NextResponse.json(
        { error: "You do not have permission to generate handoff notes" },
        { status: 403 }
      );
    }

    // ── Aggregate venture state ──

    // 1. Startup profile
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      select: {
        name: true,
        tagline: true,
        category: true,
        stage: true,
        valuation: true,
        targetAmount: true,
        raisedAmount: true,
        roundType: true,
        roundStatus: true,
        targetCloseDate: true,
        valuationCap: true,
        equityOffered: true,
        minTicket: true,
        mrr: true,
        arr: true,
        burnRate: true,
        runway: true,
        cashInBank: true,
        verified: true,
        investorReadinessScore: true,
        aiSummary: true,
      },
    });

    if (!startup) {
      return NextResponse.json(
        { error: "Startup not found" },
        { status: 404 }
      );
    }

    // 2. Recent validations
    const validations = await prisma.validation.findMany({
      where: { userEmail },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        idea: true,
        overallGrade: true,
        marketViability: true,
        technicalFeasibility: true,
        createdAt: true,
      },
    });

    // 3. Upcoming meetings
    const meetings = await prisma.meeting.findMany({
      where: { startupName: startup.name },
      take: 5,
      select: {
        investorName: true,
        firm: true,
        date: true,
        time: true,
        status: true,
        agenda: true,
      },
    });

    // 4. Active negotiations
    const negotiations = await prisma.negotiation.findMany({
      where: { startupName: startup.name },
      take: 5,
      select: {
        investorFirm: true,
        roundStage: true,
        proposedValuation: true,
        checkAmount: true,
        termSheetStatus: true,
        lastUpdated: true,
      },
    });

    // 5. Collaborators
    // @ts-ignore - Prisma client out of sync
    const collaborators = await prisma.ventureCollaborator.findMany({
      where: { startupId, status: "ACTIVE" },
      select: { userEmail: true, role: true },
    });

    // ── Build the handoff context ──

    const currentState = [
      `Venture: ${startup.name} — "${startup.tagline}"`,
      `Stage: ${startup.stage} | Category: ${startup.category}`,
      startup.roundStatus
        ? `Round Status: ${startup.roundStatus}`
        : null,
      startup.raisedAmount && startup.targetAmount
        ? `Fundraising: ${startup.raisedAmount} raised of ${startup.targetAmount} target`
        : null,
      startup.valuation ? `Valuation: ${startup.valuation}` : null,
      startup.valuationCap
        ? `Valuation Cap: ${startup.valuationCap}`
        : null,
      startup.mrr ? `MRR: ${startup.mrr}` : null,
      startup.arr ? `ARR: ${startup.arr}` : null,
      startup.burnRate ? `Burn Rate: ${startup.burnRate}` : null,
      startup.runway ? `Runway: ${startup.runway}` : null,
      startup.cashInBank
        ? `Cash in Bank: ${startup.cashInBank}`
        : null,
      startup.investorReadinessScore
        ? `Investor Readiness Score: ${startup.investorReadinessScore}/100`
        : null,
      startup.verified
        ? "✅ Verified on Venture IQ"
        : "⚠️ Not yet verified",
      `\nTeam: ${collaborators.length + 1} members (including you)`,
    ]
      .filter(Boolean)
      .join("\n");

    const pendingActions = [
      // Meetings
      ...meetings
        .filter((m) => m.status === "Confirmed" || m.status === "Pending")
        .map(
          (m) =>
            `• Meeting with ${m.investorName} (${m.firm}) on ${m.date} at ${m.time} — ${m.status}`
        ),
      // Negotiations
      ...negotiations
        .filter((n) => n.termSheetStatus !== "Completed")
        .map(
          (n) =>
            `• ${n.investorFirm}: ${n.termSheetStatus} — ${n.checkAmount} at ${n.proposedValuation} valuation`
        ),
      // General
      !startup.verified ? "• Complete startup verification" : null,
      startup.targetCloseDate
        ? `• Target close date: ${startup.targetCloseDate}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const keyDecisions = [
      startup.roundType
        ? `• Investment instrument: ${startup.roundType}`
        : null,
      startup.valuationCap
        ? `• Valuation cap set at: ${startup.valuationCap}`
        : null,
      startup.equityOffered
        ? `• Equity offered: ${startup.equityOffered}`
        : null,
      startup.minTicket
        ? `• Minimum ticket size: ${startup.minTicket}`
        : null,
      validations.length > 0
        ? `• Latest validation grade: ${validations[0].overallGrade} (Market: ${validations[0].marketViability}%, Tech: ${validations[0].technicalFeasibility}%)`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const title = `Handoff Note — ${startup.name} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    // Create the handoff note
    // @ts-ignore - Prisma client out of sync
    const note = await prisma.handoffNote.create({
      data: {
        startupId,
        createdBy: userEmail,
        assignedTo: assignedTo || null,
        title,
        context: currentState || "No venture data available.",
        pendingActions: pendingActions || "No pending actions identified.",
        keyDecisions: keyDecisions || "No key decisions recorded.",
        status: "OPEN",
      },
    });

    // Notify assignee if specified
    if (assignedTo) {
      try {
        await prisma.notification.create({
          data: {
            userEmail: assignedTo,
            type: "HANDOFF_NOTE",
            title: "AI-generated handoff note assigned to you",
            message: `${userEmail} generated and assigned a handoff note for ${startup.name}`,
            category: "collaboration",
            metadata: {
              startupId,
              handoffNoteId: note.id,
              createdBy: userEmail,
            },
          },
        });
      } catch (notifErr) {
        console.error("Failed to create handoff notification:", notifErr);
      }
    }

    return NextResponse.json({ success: true, note });
  } catch (err: any) {
    console.error("Error generating handoff note:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
