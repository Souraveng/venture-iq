// ──────────────────────────────────────────────────────────────────────────────
// Shortlisted Deals Pipeline — Type Contracts
// Batch processing pipeline for deals from the Explore Tab
// ──────────────────────────────────────────────────────────────────────────────

export type PipelineNodeId =
  | "batch-input-validation"
  | "cache-evaluator"
  | "active-evaluation"
  | "aggregator-node"
  | "batch-decision-scorecard"
  | "batch-deal-synthesis";

export interface NodeError {
  nodeId: PipelineNodeId | string;
  error: string;
  model?: string;
  retryCount: number;
  timestamp: number;
}

// ── Pipeline Input ──────────────────────────────────────────────────────────

export interface DealCardData {
  id: string;
  startupName: string;
  tagline: string;
  description: string;
  sector: string;
  stage: string;
  fundingRaised: string;
  targetRaise: string;
  founders: { name: string; background: string }[];
  tractionMetrics: string;
  businessModel: string;
  websiteUrl?: string;
}

export type BatchPipelineInput = DealCardData[];

// ── Shared Output Schemas ───────────────────────────────────────────────────

export interface VerificationTaxonomy {
  status: "SUPPORTED" | "NEEDS_REVIEW" | "CONFLICTING_EVIDENCE";
  confidence: "high" | "medium" | "low";
  citations: string[];
}

export interface GroundedFact {
  claim: string;
  verification: VerificationTaxonomy;
}

// ── Parallel Evaluation Outputs ─────────────────────────────────────────────

export interface DealEvaluation {
  dealId: string;
  marketAnalysis?: {
    marketSizeScore: number; // 0-100
    competitorLandscapeScore: number; // 0-100
    summary: string;
    keyCompetitors: string[];
  };
  teamTraction?: {
    teamScore: number; // 0-100
    tractionScore: number; // 0-100
    summary: string;
  };
  businessModelViability?: {
    viabilityScore: number; // 0-100
    summary: string;
  };
  groundedFacts?: GroundedFact[];
  cacheHit?: boolean;
}

// ── Synthesis & Ranking ─────────────────────────────────────────────────────

export interface RankedDeal {
  dealId: string;
  startupName: string;
  overallScore: number;
  rank: number;
  justification: string;
  strengthSummary: string;
  riskSummary: string;
}

export interface BatchSynthesisOutput {
  rankedDeals: RankedDeal[];
  batchSummary: string;
}

// ── LangGraph State Annotation ──────────────────────────────────────────────

import { Annotation } from "@langchain/langgraph";

export const BatchPipelineState = Annotation.Root({
  input: Annotation<BatchPipelineInput>(),
  pipeline: Annotation<{
    evaluations: Record<string, DealEvaluation>;
    synthesis?: BatchSynthesisOutput;
    completedNodes?: string[];
    errors?: NodeError[];
    failedNodes?: string[];
  }>({
    reducer: (curr, next) => {
      // Merge evaluations map
      const mergedEvaluations = { ...(curr?.evaluations || {}) };
      if (next?.evaluations) {
        for (const [dealId, evalData] of Object.entries(next.evaluations)) {
          mergedEvaluations[dealId] = {
            ...(mergedEvaluations[dealId] || {}),
            ...evalData,
            // Deep merge nested objects
            marketAnalysis: evalData.marketAnalysis || mergedEvaluations[dealId]?.marketAnalysis,
            teamTraction: evalData.teamTraction || mergedEvaluations[dealId]?.teamTraction,
            businessModelViability: evalData.businessModelViability || mergedEvaluations[dealId]?.businessModelViability,
            groundedFacts: evalData.groundedFacts || mergedEvaluations[dealId]?.groundedFacts,
          };
        }
      }

      return {
        evaluations: mergedEvaluations,
        synthesis: next?.synthesis || curr?.synthesis,
        completedNodes: Array.from(new Set([
          ...(curr?.completedNodes || []),
          ...(next?.completedNodes || []),
        ])),
        errors: [
          ...(curr?.errors || []),
          ...(next?.errors || []),
        ],
        failedNodes: Array.from(new Set([
          ...(curr?.failedNodes || []),
          ...(next?.failedNodes || []),
        ])),
      };
    },
    default: () => ({ evaluations: {}, completedNodes: [], errors: [], failedNodes: [] }),
  }),
});
