// lib/graph/decision/schema.ts
import { z } from "zod";

export const OpportunityScoreBreakdownSchema = z.object({
  marketOpportunityScore: z.number().min(0).max(100),
  competitionScore: z.number().min(0).max(100),
  financialViabilityScore: z.number().min(0).max(100),
  executionFeasibilityScore: z.number().min(0).max(100),
  fundingPotentialScore: z.number().min(0).max(100),
  riskResilienceScore: z.number().min(0).max(100),
});

export const OpportunityScoreSchema = z.object({
  score: z.number().min(0).max(100),
  breakdown: OpportunityScoreBreakdownSchema,
});

export const InvestorReadinessSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.array(z.string()).min(1),
});

export const ExecutionReadinessSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.array(z.string()).min(1),
});

export const VentureReadinessSchema = z.object({
  stage: z.enum(["IDEA", "VALIDATED", "MVP_READY", "MARKET_READY", "FUNDING_READY", "SCALE_READY"]),
  score: z.number().min(0).max(100),
});

export const ConfidenceReportSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.array(z.string()).min(1),
});

export const VerdictReportSchema = z.object({
  decision: z.enum(["STRONG OPPORTUNITY", "PROCEED", "PROCEED WITH CAUTION", "HIGH RISK", "NOT RECOMMENDED"]),
  reasoning: z.array(z.string()).min(1),
});

export const VentureDecisionReportSchema = z.object({
  opportunityScore: OpportunityScoreSchema,
  investorReadiness: InvestorReadinessSchema,
  executionReadiness: ExecutionReadinessSchema,
  ventureReadiness: VentureReadinessSchema,
  confidence: ConfidenceReportSchema,
  verdict: VerdictReportSchema,
  topOpportunities: z.array(z.string()).min(1).max(5),
  topRisks: z.array(z.string()).min(1).max(5),
  recommendedActions: z.array(z.string()).min(1),
  executiveSummary: z.string().min(50).max(5000),
});
