// lib/graph/validator/schema.ts
import { z } from "zod";

export const ConfidenceLevelEnum = z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW"]);

export const ValidatedFactSchema = z.object({
  id: z.string().describe("The ID of the fact being validated"),
  statement: z.string().describe("The canonical statement of the fact"),
  consensusValue: z.string().optional().describe("Consensus or averaged value (e.g. '142B', '15%') if multiple sources provided numbers, else empty"),
  confidence: ConfidenceLevelEnum.describe("Confidence rating based on source credibility, freshness, support counts, and agreement"),
  credibilityScore: z.number().min(0).max(100).describe("Source credibility score (0-100)"),
  agreementScore: z.number().min(0).max(100).describe("Agreement score (0-100) reflecting cross-source verification"),
  supportingSources: z.array(z.string()).describe("List of Evidence IDs supporting this fact"),
  conflictingSources: z.array(z.string()).describe("List of Evidence IDs presenting conflicting information for this fact"),
});

export const ConflictSchema = z.object({
  conflict: z.boolean().describe("Set to true if a major contradiction or conflict is detected between different sources"),
  severity: z.enum(["HIGH", "MEDIUM", "LOW"]).describe("Severity of conflict (HIGH: huge numerical difference, MEDIUM: moderate difference, LOW: small detail conflict)"),
  description: z.string().describe("Detailed description of the conflict (e.g. 'Source A states EV market is $150B while Source B states $25B')"),
  sources: z.array(z.string()).describe("Evidence IDs involved in this conflict"),
  category: z.string().describe("Category of fact under conflict (e.g. market, financial)"),
});

export const ReliabilityScoresSchema = z.object({
  overallReliability: z.number().min(0).max(100).describe("Overall credibility rating for the collected research base"),
  marketReliability: z.number().min(0).max(100).describe("Reliability of market metrics"),
  competitionReliability: z.number().min(0).max(100).describe("Reliability of competitor statements"),
  financialReliability: z.number().min(0).max(100).describe("Reliability of financial values"),
  regulationReliability: z.number().min(0).max(100).describe("Reliability of regulatory and compliance data"),
});

export const ValidationOutputSchema = z.object({
  validatedFacts: z.array(ValidatedFactSchema).describe("Facts evaluated and annotated with reliability scores"),
  conflicts: z.array(ConflictSchema).describe("List of contradictions detected across the evidence"),
  reliability: ReliabilityScoresSchema.describe("Dimensional reliability report"),
});
