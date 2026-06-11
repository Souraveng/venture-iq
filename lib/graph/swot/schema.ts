// lib/graph/swot/schema.ts
import { z } from "zod";

const SwotConfidenceLevelSchema = z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW"]);
const SwotImpactTierSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const SwotItemSchema = z.object({
  statement: z.string().min(1, "SWOT statement is required"),
  evidence: z.array(z.string()).min(1, "At least one supporting evidence citation is required"),
  confidence: SwotConfidenceLevelSchema,
  impactScore: z.number().min(0).max(100),
  impactTier: SwotImpactTierSchema,
});

export const StrategicSummarySchema = z.object({
  topStrengths: z.array(z.string()),
  topWeaknesses: z.array(z.string()),
  topOpportunities: z.array(z.string()),
  topThreats: z.array(z.string()),
});

export const SwotIntelligenceReportSchema = z.object({
  strengths: z.array(SwotItemSchema),
  weaknesses: z.array(SwotItemSchema),
  opportunities: z.array(SwotItemSchema),
  threats: z.array(SwotItemSchema),
  strategicSummary: StrategicSummarySchema,
});
