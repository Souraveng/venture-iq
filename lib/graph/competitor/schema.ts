// lib/graph/competitor/schema.ts
import { z } from "zod";

const CompetitorConfidenceLevelSchema = z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW"]);

export const CompetitorProfileSchema = z.object({
  name: z.string().min(1, "Competitor company name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["Direct", "Indirect", "Substitute", "Emerging"]),
  products: z.array(z.string()),
  targetCustomers: z.array(z.string()),
  geography: z.string().min(1, "Geography must be specified"),
  pricing: z.string().min(1, "Pricing description is required"),
  funding: z.string().min(1, "Funding description is required"),
  marketPosition: z.enum(["Market Leader", "Market Challenger", "Niche Player", "Visionary", "Emerging Player"]),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  threatLevel: z.number().min(0).max(100),
});

export const FeatureMatrixSchema = z.object({
  features: z.array(z.string()).min(1, "At least one feature comparison is required"),
  comparisons: z.array(z.object({
    companyName: z.string().min(1, "Company name is required"),
    featureSupport: z.array(z.boolean()),
  })),
});

export const PricingAnalysisSchema = z.object({
  pricingModels: z.array(z.object({
    modelType: z.enum(["Subscription", "One-Time", "Freemium", "Enterprise", "Usage-Based"]),
    description: z.string(),
  })),
  segments: z.array(z.object({
    tier: z.enum(["Premium", "Mid-Market", "Budget"]),
    range: z.string(),
    details: z.string(),
  })),
});

export const PositioningAnalysisSchema = z.object({
  positioningMap: z.array(z.object({
    companyName: z.string(),
    xPosition: z.number().min(0).max(100),
    yPosition: z.number().min(0).max(100),
    labelX: z.string(),
    labelY: z.string(),
  })),
  strategicPosition: z.string().min(1, "Strategic positioning narrative is required"),
});

export const MarketGapSchema = z.object({
  gapType: z.enum(["Underserved Segment", "Geographic Gap", "Technology Gap", "Feature Gap", "Pricing Gap", "Distribution Gap"]),
  description: z.string().min(1, "Gap description is required"),
  opportunitySignal: z.string().min(1, "Opportunity signal is required"),
});

export const MoatOpportunitySchema = z.object({
  moatType: z.enum(["Network Effects", "Brand", "Data", "Distribution", "Technology", "Regulatory Advantage", "Community", "Partnerships"]),
  description: z.string().min(1, "Moat description is required"),
  feasibility: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export const DifferentiationOpportunitySchema = z.object({
  strategy: z.string().min(1, "Strategy name is required"),
  type: z.enum(["Target Niche", "Unique Pricing", "Technology Advantage", "Geographic Specialization", "Product Feature"]),
  description: z.string().min(1, "Strategy description is required"),
  implementationEase: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export const CompetitiveIntensityFactorSchema = z.object({
  factorName: z.enum([
    "Number of Competitors",
    "Market Saturation",
    "Switching Costs",
    "Barrier to Entry",
    "Market Concentration"
  ]),
  score: z.number().min(0).max(100),
  weight: z.number().min(0.0).max(1.0),
  reasoning: z.string().min(1, "Reasoning is required"),
});

export const CompetitiveIntensityReportSchema = z.object({
  score: z.number().min(0).max(100),
  factors: z.array(CompetitiveIntensityFactorSchema),
  reasoning: z.array(z.string()),
});

export const CompetitorConfidenceReportSchema = z.object({
  overallConfidence: CompetitorConfidenceLevelSchema,
  supportingSources: z.array(z.string()),
  evidenceCount: z.number(),
  reasoning: z.string().min(1, "Confidence reasoning is required"),
});

export const CompetitorIntelligenceReportSchema = z.object({
  directCompetitors: z.array(z.string()),
  indirectCompetitors: z.array(z.string()),
  competitorProfiles: z.array(CompetitorProfileSchema),
  featureMatrix: FeatureMatrixSchema,
  pricingAnalysis: PricingAnalysisSchema,
  positioningAnalysis: PositioningAnalysisSchema,
  marketGaps: z.array(MarketGapSchema),
  moatOpportunities: z.array(MoatOpportunitySchema),
  differentiationOpportunities: z.array(DifferentiationOpportunitySchema),
  competitiveIntensity: CompetitiveIntensityReportSchema,
  confidence: CompetitorConfidenceReportSchema,
});
