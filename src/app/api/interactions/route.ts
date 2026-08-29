import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get("startupId");

    if (!startupId) {
      return NextResponse.json(
        { success: false, error: "startupId is required." },
        { status: 400 }
      );
    }

    const interactions = await prisma.dealInteraction.findMany({
      where: { startupId },
      orderBy: { updatedAt: "desc" },
    });

    const investorIds = interactions.map(i => i.investorId);
    const investors = await prisma.investor.findMany({
      where: { id: { in: investorIds } },
    });
    
    const investorMap = new Map(investors.map(inv => [inv.id, inv.firm || inv.name]));

    const activity = interactions.map(interaction => {
      const actor = investorMap.get(interaction.investorId) || "Unknown Investor";
      let desc = "interacted with your profile";
      let time = interaction.updatedAt.toISOString();
      
      switch(interaction.state) {
        case "EXPLORED": desc = "viewed your Deal Room"; break;
        case "SHORTLISTED": desc = "shortlisted your startup"; break;
        case "INTRO_REQUESTED": desc = "requested an Intro Call"; break;
        case "PASSED": desc = "passed on the opportunity"; break;
        case "MUTUAL_MATCH": desc = "matched with your startup"; break;
      }
      
      return { actor, desc, time };
    });

    // Query actual analytics events from database
    const events = await prisma.startupAnalyticsEvent.findMany({
      where: { startupId },
    });

    const profileViews = events.filter(e => e.eventType === "PROFILE_VIEW").length;
    const pitchVideoViews = events.filter(e => e.eventType === "VIDEO_VIEW").length;
    const campaignReach = events.filter(e => e.eventType === "FEED_IMPRESSION").length;

    // Get all unique investors who have either viewed, interacted, or was shown feed
    const uniqueInvestorIds = new Set<string>();
    events.forEach(e => {
      if (e.investorId) uniqueInvestorIds.add(e.investorId);
    });
    interactions.forEach(i => {
      uniqueInvestorIds.add(i.investorId);
    });
    const uniqueInvestorsCount = uniqueInvestorIds.size;

    // Offer Conversion: actual intro requests / unique investors
    const introRequestsCount = interactions.filter(i => i.state === "INTRO_REQUESTED").length;
    const offerConversion = uniqueInvestorsCount > 0 
      ? ((introRequestsCount / uniqueInvestorsCount) * 100).toFixed(1) 
      : "0.0";

    // Dynamic average response based on unique investors
    const avgResponse = uniqueInvestorsCount > 0 
      ? Math.max(1.0, parseFloat((2.4 - Math.min(1.4, uniqueInvestorsCount * 0.1)).toFixed(1))).toString() 
      : "2.4";

    const metrics = {
      profileViews,
      pitchVideoViews,
      uniqueInvestors: uniqueInvestorsCount,
      offerConversion,
      avgResponse,
      campaignReach,
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        activity
      },
    });
  } catch (error) {
    console.error("DealInteraction fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch interactions." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { startupId, action, feedback, investorEmail, teamId } = body;

    if (!startupId || !action || !investorEmail) {
      return NextResponse.json(
        { success: false, error: "startupId, action and investorEmail are required." },
        { status: 400 }
      );
    }

    let targetInvestorId: string;

    if (teamId && teamId !== "null" && teamId !== "undefined") {
      // Validate team membership
      const member = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userEmail: { equals: investorEmail, mode: "insensitive" },
          status: "ACTIVE"
        }
      });
      if (!member) {
        return NextResponse.json({ success: false, error: "Not an active member of this team." }, { status: 403 });
      }
      targetInvestorId = teamId;
    } else {
      const dbInvestor = await prisma.investor.findUnique({ where: { email: investorEmail } });
      const dbUser = !dbInvestor ? await prisma.user.findUnique({ where: { email: investorEmail } }) : null;
      if (!dbInvestor && !dbUser) {
        return NextResponse.json(
          { success: false, error: "Investor account not found." },
          { status: 404 }
        );
      }
      targetInvestorId = dbInvestor ? dbInvestor.id : (dbUser?.id || investorEmail);
    }

    // Map the string action from frontend to InteractionState enum
    let state: any;
    switch (action) {
      case "explore":
        state = "EXPLORED";
        break;
      case "shortlist":
        state = "SHORTLISTED";
        break;
      case "request_intro":
        state = "INTRO_REQUESTED";
        break;
      case "pass":
        state = "PASSED";
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action." },
          { status: 400 }
        );
    }

    // Upsert the interaction
    const interaction = await prisma.dealInteraction.upsert({
      where: {
        investorId_startupId: {
          investorId: targetInvestorId,
          startupId: startupId,
        },
      },
      update: {
        state: state,
        feedback: feedback || null,
      },
      create: {
        investorId: targetInvestorId,
        startupId: startupId,
        state: state,
        feedback: feedback || null,
      },
    });

    if (action === "pass" && body.isAutonomous) {
      // Learn from rejection by appending the passed reason to the thesis
      const passReason = feedback || "Not aligned with current autonomous preferences";
      const startup = await prisma.startup.findUnique({ where: { id: startupId } });
      const investorRec = await prisma.investor.findFirst({ where: { email: { equals: investorEmail, mode: "insensitive" } } });
      if (startup && investorRec) {
        const learningNote = ` [Passed on ${startup.category} startup: ${passReason}]`;
        await prisma.investor.update({
          where: { id: investorRec.id },
          data: {
            thesis: (investorRec.thesis || "") + learningNote
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: interaction,
    });
  } catch (error) {
    console.error("DealInteraction save error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save interaction." },
      { status: 500 }
    );
  }
}
