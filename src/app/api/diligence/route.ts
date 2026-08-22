import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diligenceGraph } from "@/lib/intelligence/graphs/diligence-graph";
import { buildShortlistedDealsOrchestrator } from "@/lib/shortlisted-deals/orchestrator";
import { PipelineLogger } from "@/lib/founder-intelligence/pipeline-logger";
import { PipelineEmitter } from "@/lib/founder-intelligence/pipeline-emitter";
import type { DealCardData } from "@/lib/shortlisted-deals/contracts";

export async function POST(req: Request) {
  try {
    const { startupIds, investorEmail, batch } = (await req.json()) as any;

    if (!startupIds || !Array.isArray(startupIds) || startupIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "A valid list of startup identifiers is required." },
        { status: 400 }
      );
    }

    // Fetch the investor to get their thesis
    let investorThesis = "Invest in high-growth, defensible tech startups.";
    if (investorEmail) {
      const investor = await prisma.investor.findUnique({
        where: { email: investorEmail }
      });
      if (investor && investor.thesis) {
        investorThesis = investor.thesis;
      }
    }

    // Fetch full profiles for the requested startups
    const startups = await prisma.startup.findMany({
      where: { id: { in: startupIds } },
      include: { founderProfile: true }
    });

    if (startups.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid startups found for the provided identifiers." },
        { status: 404 }
      );
    }

    // ── Batch Mode: use the shortlisted-deals parallel orchestrator ──
    if (batch === true) {
      console.log("[API] Invoking Batch Pipeline for", startups.length, "deals...");

      const dealCards: DealCardData[] = startups.map((s: any) => ({
        id: s.id,
        startupName: s.name || "Unknown",
        tagline: s.tagline || "",
        description: s.desc || s.aboutText || "",
        sector: s.sector || s.industry || "",
        stage: s.stage || "",
        fundingRaised: s.fundingRaised || s.raised || "",
        targetRaise: s.targetRaise || s.askAmount || "",
        founders: s.founderProfile
          ? [{ name: s.founderProfile.name || "", background: s.founderProfile.bio || "" }]
          : [],
        tractionMetrics: s.traction || s.metrics || "",
        businessModel: s.businessModel || s.revenueModel || "",
        websiteUrl: s.website || undefined,
      }));

      const logger = new PipelineLogger("shortlisted-deals-batch");
      const emitter = new PipelineEmitter(() => {});
      const orchestrator = buildShortlistedDealsOrchestrator(emitter, logger);

      const finalState = await orchestrator.invoke({
        input: dealCards,
        pipeline: { evaluations: {}, completedNodes: [], errors: [], failedNodes: [] },
      });

      const synthesis = finalState.pipeline?.synthesis;
      if (!synthesis || !synthesis.rankedDeals) {
        return NextResponse.json({
          success: false,
          error: "The analysis pipeline completed but produced no ranked results."
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: synthesis.rankedDeals,
        batchSummary: synthesis.batchSummary,
        pipelineMeta: {
          completedNodes: finalState.pipeline?.completedNodes || [],
          failedNodes: finalState.pipeline?.failedNodes || [],
          errorCount: (finalState.pipeline?.errors || []).length,
        }
      });
    }

    // ── Standard Mode: use Pipeline A (sequential diligence graph) ──
    console.log("[API] Invoking Pipeline A for", startups.length, "startups...");
    
    const finalState = await diligenceGraph.invoke({
      startups,
      investorThesis
    });

    const enrichedRankings = finalState.finalRankings.map((rank: any) => {
      const dbStartup = startups.find((s) => s.id === rank.startupId);
      return {
        ...rank,
        startupName: dbStartup ? dbStartup.name : rank.startupId
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedRankings
    });
    
  } catch (error: any) {
    console.error("[API] Diligence pipeline error:", error);
    return NextResponse.json(
      { success: false, error: "The analysis pipeline encountered an unexpected error. Please try again." },
      { status: 500 }
    );
  }
}
