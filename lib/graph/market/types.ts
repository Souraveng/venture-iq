// lib/graph/market/types.ts

export type MarketConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW";

export interface MarketOverview {
  industryDescription: string;
  currentState: string;
  industryMaturity: string;
  growthStage: string;
  marketDynamics: string;
}

export interface TamDetails {
  definition: string;
  value: string;
  formula: string;
  calculation: string;
  assumptions: string[];
  sources: string[];
  confidence: MarketConfidenceLevel;
}

export interface SamDetails {
  targetMarket: string;
  value: string;
  geographicScope: string;
  industryScope: string;
  assumptions: string[];
  sources: string[];
  confidence: MarketConfidenceLevel;
}

export interface SomDetails {
  realisticMarketCapture: string;
  firstThreeYearsValue: string;
  firstFiveYearsValue: string;
  assumptions: string[];
  sources: string[];
  confidence: MarketConfidenceLevel;
}

export type CustomerSegmentType =
  | "Primary"
  | "Secondary"
  | "Early Adopter"
  | "Enterprise"
  | "Government"
  | "SME"
  | "Consumer";

export interface CustomerSegment {
  segmentName: string;
  type: CustomerSegmentType;
  description: string;
  painPoints: string[];
  sizeEstimate?: string;
}

export type MarketTrendType =
  | "Current"
  | "Emerging"
  | "Future"
  | "Technology"
  | "Behavioral";

export interface MarketTrend {
  trend: string;
  type: MarketTrendType;
  description: string;
  evidenceSource: string;
}

export type GrowthDriverType =
  | "Demand Driver"
  | "Growth Catalyst" | "Emerging Opportunity" | "Market Momentum";

export interface GrowthDriver {
  driver: string;
  type: GrowthDriverType;
  description: string;
  evidenceSource: string;
}

export type AttractivenessFactorName =
  | "Market Size"
  | "Growth Rate"
  | "Accessibility"
  | "Competition"
  | "Demand"
  | "Timing";

export interface AttractivenessFactor {
  factorName: AttractivenessFactorName;
  score: number;  // 0 - 100
  weight: number; // 0.0 - 1.0 (Sum of all weights must equal 1.0)
  reasoning: string;
}

export interface MarketAttractivenessReport {
  score: number; // 0 - 100
  factors: AttractivenessFactor[];
  reasoning: string[];
}

export interface ConfidenceReport {
  overallConfidence: MarketConfidenceLevel;
  sourceQualityScore: number;     // 0 - 100
  evidenceQuantityScore: number;  // 0 - 100
  agreementScore: number;         // 0 - 100
  reasoning: string;
}

export interface MarketIntelligenceReport {
  marketOverview: MarketOverview;
  tam: TamDetails;
  sam: SamDetails;
  som: SomDetails;
  customerSegments: CustomerSegment[];
  marketTrends: MarketTrend[];
  growthDrivers: GrowthDriver[];
  marketAttractiveness: MarketAttractivenessReport;
  confidence: ConfidenceReport;
  rawResearch?: string | any; // To maintain compatibility with rawResearch UI
}
