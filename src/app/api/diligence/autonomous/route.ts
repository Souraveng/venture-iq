import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diligenceGraph } from "@/lib/intelligence/graphs/diligence-graph";
import { getInvestorIdentity } from "@/lib/intelligence/investor-auth";

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const investorIdentity = await getInvestorIdentity(req);
    if (!investorIdentity) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const investor = await prisma.investor.findUnique({
      where: { email: investorIdentity.email }
    });

    if (!investor) {
      return NextResponse.json({ success: false, error: "Investor not found" }, { status: 404 });
    }

    if (!investor.autonomousEnabled) {
      return NextResponse.json({ success: true, message: "Autonomous recommendations disabled." });
    }

    if (investor.lastAutonomousRun) {
      const hoursSinceLastRun = (Date.now() - investor.lastAutonomousRun.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastRun < 24) {
        return NextResponse.json({ success: true, message: "Autonomous run already completed today." });
      }
    }

    let topStartups: any[] = [];
    try {
      const workerUrl = process.env.NODE_ENV === "production"
        ? "https://ventureiq-worker.barjatyasourav4210.workers.dev/match"
        : "http://localhost:8787/match";

      const workerRes = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thesis: investor.thesis,
          focusSectors: investor.focusSectors,
          preferredStages: investor.preferredStages
        })
      });

      const workerJson = (await workerRes.json()) as any;
      if (workerJson.success && workerJson.matches && workerJson.matches.length > 0) {
        const startupIds = workerJson.matches.slice(0, 3).map((m: any) => m.id);
        topStartups = await prisma.startup.findMany({
          where: { id: { in: startupIds } },
          include: { founderProfile: true }
        });
      }
    } catch (e) {
      console.warn("AI Matchmaker failed, falling back to db search", e);
    }

    if (topStartups.length === 0) {
      topStartups = await prisma.startup.findMany({
        where: { isPublished: true },
        take: 3,
        include: { founderProfile: true }
      });
    }

    if (topStartups.length === 0) {
      return NextResponse.json({ success: false, error: "No startups found" });
    }

    const existingInteractions = await prisma.dealInteraction.findMany({
      where: {
        investorId: investor.id,
        startupId: { in: topStartups.map(s => s.id) }
      }
    });
    
    const interactedIds = existingInteractions.map(i => i.startupId);
    let candidateStartups = topStartups.filter(s => !interactedIds.includes(s.id));

    if (candidateStartups.length === 0) {
       return NextResponse.json({ success: true, message: "No new high-conviction startups found today." });
    }

    const focusStr = (investor.focusSectors || []).join(", ");
    const stageStr = (investor.preferredStages || []).join(", ");
    const investorThesisStr = `Thesis: ${investor.thesis || ""}. Sectors: ${focusStr}. Stages: ${stageStr}`;
    
    const finalState = await diligenceGraph.invoke({
      startups: candidateStartups,
      investorThesis: investorThesisStr
    });

    const finalRankings = finalState.finalRankings || [];
    const topPick = finalRankings.find((r: any) => r.rank === 1);

    if (!topPick) {
      return NextResponse.json({ success: false, error: "Diligence pipeline failed to rank startups." });
    }

    const recommendedStartup = candidateStartups.find(s => s.id === topPick.startupId);

    if (recommendedStartup) {
      await prisma.dealInteraction.upsert({
        where: {
          investorId_startupId: { investorId: investor.id, startupId: recommendedStartup.id }
        },
        update: { state: "AUTONOMOUS_RECOMMENDATION_PENDING" },
        create: {
          investorId: investor.id,
          startupId: recommendedStartup.id,
          state: "AUTONOMOUS_RECOMMENDATION_PENDING"
        }
      });

      await prisma.notification.create({
        data: {
          userEmail: investor.email,
          type: "AUTONOMOUS_RECOMMENDATION",
          title: `✨ AI Top Pick: ${recommendedStartup.name}`,
          message: topPick.reason || `We found a strong match for your thesis!`,
          category: "recommendation",
          metadata: {
            startupId: recommendedStartup.id,
            reason: topPick.reason,
            strengths: topPick.keyStrengths
          }
        }
      });

      await prisma.investor.update({
        where: { id: investor.id },
        data: { lastAutonomousRun: new Date() }
      });

      return NextResponse.json({ success: true, data: { startupId: recommendedStartup.id, reason: topPick.reason } });
    }

    return NextResponse.json({ success: false, error: "Recommendation resolution failed." });

  } catch (error: any) {
    console.error("Autonomous diligence error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const investorIdentity = await getInvestorIdentity(req);
    if (!investorIdentity) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const investor = await prisma.investor.findUnique({
      where: { email: investorIdentity.email }
    });

    if (!investor) return NextResponse.json({ success: false, error: "Investor not found" }, { status: 404 });

    const pendingInteraction = await prisma.dealInteraction.findFirst({
      where: {
        investorId: investor.id,
        state: "AUTONOMOUS_RECOMMENDATION_PENDING"
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!pendingInteraction) {
      return NextResponse.json({ success: true, data: null });
    }

    const startup = await prisma.startup.findUnique({
      where: { id: pendingInteraction.startupId }
    });

    return NextResponse.json({ success: true, data: startup });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
