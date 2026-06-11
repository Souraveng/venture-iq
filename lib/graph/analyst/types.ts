// lib/graph/analyst/types.ts

export interface MarketAttractiveness {
  marketSizeScore: number; // 0-100
  marketGrowthScore: number; // 0-100
  demandScore: number; // 0-100
  expansionPotentialScore: number; // 0-100
  timingScore: number; // 0-100
  overallScore: number; // 0-100
  reasoning: string;
}

export interface Scalability {
  operationalScalability: string;
  financialScalability: string;
  technologyScalability: string;
  localScalabilityScore: number;
  nationalScalabilityScore: number;
  globalScalabilityScore: number;
}

export interface Defensibility {
  technologyAdvantage: string;
  dataMoat: string;
  networkEffects: string;
  distributionPower: string;
  brandEquity: string;
  partnerships: string;
  regulatoryAdvantages: string;
}

export interface MoatAnalysis {
  identifiedMoats: string[];
  moatStrengthScore: number; // 0-100
  sustainabilityScore: number; // 0-100
  replicabilityDifficulty: string;
}

export interface TimingAnalysis {
  score: number; // 0-100
  rationale: string;
  timingStage: "EARLY" | "OPTIMAL" | "MATURE" | "LATE";
}

export interface FundingPotential {
  angelSuitabilityScore: number; // 0-100
  seedSuitabilityScore: number;
  vcSuitabilityScore: number;
  grantSuitabilityScore: number;
  bootstrapSuitabilityScore: number;
  overallScore: number; // 0-100
  reasoning: string;
}

export interface ExitPotential {
  acquisitionOpportunities: string[];
  strategicBuyers: string[];
  ipoPotentialScore: number; // 0-100
  exitTimelineYears: number;
}

export interface VentureReadiness {
  customerValidationScore: number; // 0-100
  marketValidationScore: number;
  financialReadinessScore: number;
  executionReadinessScore: number;
  fundraisingReadinessScore: number;
  score: number; // 0-100
  reasoning: string;
}

export interface InvestmentRecommendation {
  decision: "STRONG YES" | "YES" | "MAYBE" | "NO" | "STRONG NO";
  confidence: number; // 0-100
  reasoning: string[];
  requiredMilestones: string[];
}

export interface VentureAnalystReport {
  marketAttractiveness: MarketAttractiveness;
  scalability: Scalability;
  defensibility: Defensibility;
  moatAnalysis: MoatAnalysis;
  timingAnalysis: TimingAnalysis;
  fundingPotential: FundingPotential;
  exitPotential: ExitPotential;
  ventureReadiness: VentureReadiness;
  redFlags: string[];
  investmentRecommendation: InvestmentRecommendation;
}
