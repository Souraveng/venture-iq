// lib/graph/risk/types.ts

export type RiskSeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskDetails {
  probability: number; // 0 - 100
  impact: number;      // 0 - 100
  severity: RiskSeverityLevel;
  riskScore: number;   // 0 - 100
  reasoning: string;
  indicators: string[]; // Early warning signs for this risk
  mitigation: string;   // Immediate primary mitigation action
}

export interface OverallRiskIndex {
  score: number;      // 0 - 100 (weighted or average of all dimensions)
  severity: RiskSeverityLevel;
  reasoning: string[];
}

export interface MitigationStrategy {
  riskDimension: string; // e.g. "Market Risk", "Financial Risk"
  description: string;
  preventiveActions: string[];
  contingencyPlans: string[];
}

export interface RiskIntelligenceReport {
  marketRisk: RiskDetails;
  competitionRisk: RiskDetails;
  financialRisk: RiskDetails;
  regulatoryRisk: RiskDetails;
  technologyRisk: RiskDetails;
  operationalRisk: RiskDetails;
  executionRisk: RiskDetails;
  fundingRisk: RiskDetails;
  overallRiskIndex: OverallRiskIndex;
  mitigationStrategies: MitigationStrategy[];
}
