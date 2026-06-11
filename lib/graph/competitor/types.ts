// lib/graph/competitor/types.ts

export type CompetitorConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW";

export interface CompetitorProfile {
  name: string;
  description: string;
  type: "Direct" | "Indirect" | "Substitute" | "Emerging";
  products: string[];
  targetCustomers: string[];
  geography: string;
  pricing: string;
  funding: string;
  marketPosition: "Market Leader" | "Market Challenger" | "Niche Player" | "Visionary" | "Emerging Player";
  strengths: string[];
  weaknesses: string[];
  threatLevel: number; // 0 - 100
}

export interface FeatureMatrix {
  features: string[]; // List of features compared (e.g. ["Mobile App", "AI Analytics", ...])
  comparisons: {
    companyName: string; // "Us" or Competitor Names
    featureSupport: boolean[]; // True/false array matching the length and order of the 'features' array
  }[];
}

export interface PricingAnalysis {
  pricingModels: {
    modelType: "Subscription" | "One-Time" | "Freemium" | "Enterprise" | "Usage-Based";
    description: string;
  }[];
  segments: {
    tier: "Premium" | "Mid-Market" | "Budget";
    range: string;
    details: string;
  }[];
}

export interface PositioningAnalysis {
  positioningMap: {
    companyName: string;
    xPosition: number; // 0 - 100 (e.g., Low Price to High Price)
    yPosition: number; // 0 - 100 (e.g., Basic Tech to High Tech)
    labelX: string;    // Label for X-axis (e.g., "Pricing")
    labelY: string;    // Label for Y-axis (e.g., "Technology Complexity")
  }[];
  strategicPosition: string; // Narrative of where our startup fits
}

export interface MarketGap {
  gapType: "Underserved Segment" | "Geographic Gap" | "Technology Gap" | "Feature Gap" | "Pricing Gap" | "Distribution Gap";
  description: string;
  opportunitySignal: string;
}

export interface MoatOpportunity {
  moatType: "Network Effects" | "Brand" | "Data" | "Distribution" | "Technology" | "Regulatory Advantage" | "Community" | "Partnerships";
  description: string;
  feasibility: "HIGH" | "MEDIUM" | "LOW";
}

export interface DifferentiationOpportunity {
  strategy: string;
  type: "Target Niche" | "Unique Pricing" | "Technology Advantage" | "Geographic Specialization" | "Product Feature";
  description: string;
  implementationEase: "HIGH" | "MEDIUM" | "LOW";
}

export interface CompetitiveIntensityFactor {
  factorName: "Number of Competitors" | "Market Saturation" | "Switching Costs" | "Barrier to Entry" | "Market Concentration";
  score: number; // 0 - 100
  weight: number; // 0.0 - 1.0 (Sum of weights must equal 1.0)
  reasoning: string;
}

export interface CompetitiveIntensityReport {
  score: number; // 0 - 100
  factors: CompetitiveIntensityFactor[];
  reasoning: string[];
}

export interface CompetitorConfidenceReport {
  overallConfidence: CompetitorConfidenceLevel;
  supportingSources: string[]; // Evidence/Fact IDs
  evidenceCount: number;
  reasoning: string;
}

export interface CompetitorIntelligenceReport {
  directCompetitors: string[];
  indirectCompetitors: string[];
  competitorProfiles: CompetitorProfile[];
  featureMatrix: FeatureMatrix;
  pricingAnalysis: PricingAnalysis;
  positioningAnalysis: PositioningAnalysis;
  marketGaps: MarketGap[];
  moatOpportunities: MoatOpportunity[];
  differentiationOpportunities: DifferentiationOpportunity[];
  competitiveIntensity: CompetitiveIntensityReport;
  confidence: CompetitorConfidenceReport;
}
