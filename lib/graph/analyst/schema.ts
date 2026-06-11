// lib/graph/analyst/schema.ts
import { z } from "zod";

export const MarketAttractivenessSchema = z.object({
  marketSizeScore: z.number().min(0).max(100),
  marketGrowthScore: z.number().min(0).max(100),
  demandScore: z.number().min(0).max(100),
  expansionPotentialScore: z.number().min(0).max(100),
  timingScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  reasoning: z.string().min(1),
});

export const ScalabilitySchema = z.object({
  operationalScalability: z.string().min(1),
  financialScalability: z.string().min(1),
  technologyScalability: z.string().min(1),
  localScalabilityScore: z.number().min(0).max(100),
  nationalScalabilityScore: z.number().min(0).max(100),
  globalScalabilityScore: z.number().min(0).max(100),
});

export const DefensibilitySchema = z.object({
  technologyAdvantage: z.string().min(1),
  dataMoat: z.string().min(1),
  networkEffects: z.string().min(1),
  distributionPower: z.string().min(1),
  brandEquity: z.string().min(1),
  partnerships: z.string().min(1),
  regulatoryAdvantages: z.string().min(1),
});

export const MoatAnalysisSchema = z.object({
  identifiedMoats: z.array(z.string()),
  moatStrengthScore: z.number().min(0).max(100),
  sustainabilityScore: z.number().min(0).max(100),
  replicabilityDifficulty: z.string().min(1),
});

export const TimingAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  rationale: z.string().min(1),
  timingStage: z.enum(["EARLY", "OPTIMAL", "MATURE", "LATE"]),
});

export const FundingPotentialSchema = z.object({
  angelSuitabilityScore: z.number().min(0).max(100),
  seedSuitabilityScore: z.number().min(0).max(100),
  vcSuitabilityScore: z.number().min(0).max(100),
  grantSuitabilityScore: z.number().min(0).max(100),
  bootstrapSuitabilityScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  reasoning: z.string().min(1),
});

export const ExitPotentialSchema = z.object({
  acquisitionOpportunities: z.array(z.string()),
  strategicBuyers: z.array(z.string()),
  ipoPotentialScore: z.number().min(0).max(100),
  exitTimelineYears: z.number().nonnegative(),
});

export const VentureReadinessSchema = z.object({
  customerValidationScore: z.number().min(0).max(100),
  marketValidationScore: z.number().min(0).max(100),
  financialReadinessScore: z.number().min(0).max(100),
  executionReadinessScore: z.number().min(0).max(100),
  fundraisingReadinessScore: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
  reasoning: z.string().min(1),
});

export const InvestmentRecommendationSchema = z.object({
  decision: z.enum(["STRONG YES", "YES", "MAYBE", "NO", "STRONG NO"]),
  confidence: z.number().min(0).max(100),
  reasoning: z.array(z.string()).min(1),
  requiredMilestones: z.array(z.string()).min(1),
});

export const VentureAnalystReportSchema = z.object({
  marketAttractiveness: MarketAttractivenessSchema,
  scalability: ScalabilitySchema,
  defensibility: DefensibilitySchema,
  moatAnalysis: MoatAnalysisSchema,
  timingAnalysis: TimingAnalysisSchema,
  fundingPotential: FundingPotentialSchema,
  exitPotential: ExitPotentialSchema,
  ventureReadiness: VentureReadinessSchema,
  redFlags: z.array(z.string()),
  investmentRecommendation: InvestmentRecommendationSchema,
});
