// lib/graph/decision/types.ts

export interface OpportunityScoreBreakdown {
  marketOpportunityScore: number;     // 30%
  competitionScore: number;           // 15%
  financialViabilityScore: number;    // 20%
  executionFeasibilityScore: number;  // 15%
  fundingPotentialScore: number;      // 10%
  riskResilienceScore: number;        // 10%
}

export interface OpportunityScore {
  score: number; // 0-100 weighted average
  breakdown: OpportunityScoreBreakdown;
}

export interface InvestorReadiness {
  score: number;
  reasoning: string[];
}

export interface ExecutionReadiness {
  score: number;
  reasoning: string[];
}

export type VentureReadinessStage = "IDEA" | "VALIDATED" | "MVP_READY" | "MARKET_READY" | "FUNDING_READY" | "SCALE_READY";

export interface VentureReadiness {
  stage: VentureReadinessStage;
  score: number;
}

export interface ConfidenceReport {
  score: number;
  reasoning: string[];
}

export type VerdictDecision = "STRONG OPPORTUNITY" | "PROCEED" | "PROCEED WITH CAUTION" | "HIGH RISK" | "NOT RECOMMENDED";

export interface VerdictReport {
  decision: VerdictDecision;
  reasoning: string[];
}

export interface VentureDecisionReport {
  opportunityScore: OpportunityScore;
  investorReadiness: InvestorReadiness;
  executionReadiness: ExecutionReadiness;
  ventureReadiness: VentureReadiness;
  confidence: ConfidenceReport;
  verdict: VerdictReport;
  topOpportunities: string[];
  topRisks: string[];
  recommendedActions: string[];
  executiveSummary: string;
}
