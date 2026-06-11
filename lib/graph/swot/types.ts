// lib/graph/swot/types.ts

export type SwotConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW";
export type SwotImpactTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SwotItem {
  statement: string;
  evidence: string[]; // List of source/evidence IDs or specific validated facts backing this claim
  confidence: SwotConfidenceLevel;
  impactScore: number; // 0 - 100
  impactTier: SwotImpactTier;
}

export interface StrategicSummary {
  topStrengths: string[];
  topWeaknesses: string[];
  topOpportunities: string[];
  topThreats: string[];
}

export interface SwotIntelligenceReport {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  strategicSummary: StrategicSummary;
}
