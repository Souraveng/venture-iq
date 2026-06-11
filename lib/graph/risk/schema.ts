// lib/graph/risk/schema.ts
import { z } from "zod";

const RiskSeverityLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const RiskDetailsSchema = z.object({
  probability: z.number().min(0).max(100),
  impact: z.number().min(0).max(100),
  severity: RiskSeverityLevelSchema,
  riskScore: z.number().min(0).max(100),
  reasoning: z.string().min(1, "Reasoning is required"),
  indicators: z.array(z.string()),
  mitigation: z.string().min(1, "Mitigation action description is required"),
});

export const OverallRiskIndexSchema = z.object({
  score: z.number().min(0).max(100),
  severity: RiskSeverityLevelSchema,
  reasoning: z.array(z.string()),
});

export const MitigationStrategySchema = z.object({
  riskDimension: z.string().min(1, "Risk dimension label is required"),
  description: z.string().min(1, "Description is required"),
  preventiveActions: z.array(z.string()).min(1, "At least one preventive action is required"),
  contingencyPlans: z.array(z.string()).min(1, "At least one contingency plan is required"),
});

export const RiskIntelligenceReportSchema = z.object({
  marketRisk: RiskDetailsSchema,
  competitionRisk: RiskDetailsSchema,
  financialRisk: RiskDetailsSchema,
  regulatoryRisk: RiskDetailsSchema,
  technologyRisk: RiskDetailsSchema,
  operationalRisk: RiskDetailsSchema,
  executionRisk: RiskDetailsSchema,
  fundingRisk: RiskDetailsSchema,
  overallRiskIndex: OverallRiskIndexSchema,
  mitigationStrategies: z.array(MitigationStrategySchema),
});
