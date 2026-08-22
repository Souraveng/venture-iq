import { BatchPipelineState, DealEvaluation } from "../contracts";
import { prisma } from "@/lib/prisma";

export async function runCacheEvaluator(state: typeof BatchPipelineState.State) {
  const batch = state.input;
  const evaluations: Record<string, DealEvaluation> = {};

  for (const deal of batch) {
    try {
      const startupRecord = await prisma.startup.findUnique({
        where: { id: deal.id }
      });

      // If the DB already has computed scores and AI summary, treat it as a cache hit
      if (startupRecord && startupRecord.aiSummary && startupRecord.marketScore !== null) {
        evaluations[deal.id] = {
          dealId: deal.id,
          cacheHit: true,
          marketAnalysis: {
            marketSizeScore: startupRecord.marketScore || 50,
            competitorLandscapeScore: startupRecord.moatScore || 50,
            summary: startupRecord.aiSummary || "",
            keyCompetitors: []
          },
          teamTraction: {
            teamScore: startupRecord.executionScore || 50,
            tractionScore: startupRecord.investorReadinessScore || 50,
            summary: startupRecord.aiSummary || ""
          },
          businessModelViability: {
            viabilityScore: startupRecord.riskScore ? (100 - startupRecord.riskScore) : 50,
            summary: "Cached via prior analysis."
          },
          groundedFacts: []
        };
      } else {
        evaluations[deal.id] = {
          dealId: deal.id,
          cacheHit: false, // forces active evaluation
        };
      }
    } catch (e) {
      evaluations[deal.id] = {
        dealId: deal.id,
        cacheHit: false,
      };
    }
  }

  return {
    pipeline: { evaluations }
  };
}
