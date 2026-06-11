// lib/graph/market/schema.ts
import { z } from "zod";

const MarketConfidenceLevelSchema = z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW"]);

export const MarketOverviewSchema = z.object({
  industryDescription: z.string().min(1, "Industry description is required"),
  currentState: z.string().min(1, "Current state description is required"),
  industryMaturity: z.string().min(1, "Industry maturity must be specified"),
  growthStage: z.string().min(1, "Growth stage must be specified"),
  marketDynamics: z.string().min(1, "Market dynamics must be specified"),
});

export const TamDetailsSchema = z.object({
  definition: z.string().min(1, "TAM definition is required"),
  value: z.string().min(1, "TAM value is required"),
  formula: z.string().min(1, "TAM calculation formula is required"),
  calculation: z.string().min(1, "TAM calculation methodology is required"),
  assumptions: z.array(z.string()),
  sources: z.array(z.string()),
  confidence: MarketConfidenceLevelSchema,
});

export const SamDetailsSchema = z.object({
  targetMarket: z.string().min(1, "SAM target market definition is required"),
  value: z.string().min(1, "SAM value is required"),
  geographicScope: z.string().min(1, "SAM geographic scope is required"),
  industryScope: z.string().min(1, "SAM industry scope is required"),
  assumptions: z.array(z.string()),
  sources: z.array(z.string()),
  confidence: MarketConfidenceLevelSchema,
});

export const SomDetailsSchema = z.object({
  realisticMarketCapture: z.string().min(1, "SOM realistic capture definition is required"),
  firstThreeYearsValue: z.string().min(1, "SOM first 3 years value is required"),
  firstFiveYearsValue: z.string().min(1, "SOM first 5 years value is required"),
  assumptions: z.array(z.string()),
  sources: z.array(z.string()),
  confidence: MarketConfidenceLevelSchema,
});

export const CustomerSegmentSchema = z.object({
  segmentName: z.string().min(1, "Segment name is required"),
  type: z.enum([
    "Primary",
    "Secondary",
    "Early Adopter",
    "Enterprise",
    "Government",
    "SME",
    "Consumer"
  ]),
  description: z.string().min(1, "Segment description is required"),
  painPoints: z.array(z.string()),
  sizeEstimate: z.string().optional(),
});

export const MarketTrendSchema = z.object({
  trend: z.string().min(1, "Trend name is required"),
  type: z.enum(["Current", "Emerging", "Future", "Technology", "Behavioral"]),
  description: z.string().min(1, "Trend description is required"),
  evidenceSource: z.string().min(1, "Evidence source citation is required"),
});

export const GrowthDriverSchema = z.object({
  driver: z.string().min(1, "Driver name is required"),
  type: z.enum(["Demand Driver", "Growth Catalyst", "Emerging Opportunity", "Market Momentum"]),
  description: z.string().min(1, "Driver description is required"),
  evidenceSource: z.string().min(1, "Evidence source citation is required"),
});

export const AttractivenessFactorSchema = z.object({
  factorName: z.enum([
    "Market Size",
    "Growth Rate",
    "Accessibility",
    "Competition",
    "Demand",
    "Timing"
  ]),
  score: z.number().min(0).max(100),
  weight: z.number().min(0.0).max(1.0),
  reasoning: z.string().min(1, "Factor reasoning is required"),
});

export const MarketAttractivenessReportSchema = z.object({
  score: z.number().min(0).max(100),
  factors: z.array(AttractivenessFactorSchema),
  reasoning: z.array(z.string()),
});

export const ConfidenceReportSchema = z.object({
  overallConfidence: MarketConfidenceLevelSchema,
  sourceQualityScore: z.number().min(0).max(100),
  evidenceQuantityScore: z.number().min(0).max(100),
  agreementScore: z.number().min(0).max(100),
  reasoning: z.string().min(1, "Confidence reasoning is required"),
});

// The final Zod schema for validation
export const MarketIntelligenceReportSchema = z.object({
  marketOverview: MarketOverviewSchema,
  tam: TamDetailsSchema,
  sam: SamDetailsSchema,
  som: SomDetailsSchema,
  customerSegments: z.array(CustomerSegmentSchema),
  marketTrends: z.array(MarketTrendSchema),
  growthDrivers: z.array(GrowthDriverSchema),
  marketAttractiveness: MarketAttractivenessReportSchema,
  confidence: ConfidenceReportSchema,
});
