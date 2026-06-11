// lib/graph/financial/types.ts

export interface CostTier {
  min: number;
  expected: number;
  aggressive: number;
}

export interface StartupCosts {
  infrastructure: CostTier;
  technology: CostTier;
  equipment: CostTier;
  licensing: CostTier;
  operations: CostTier;
  marketing: CostTier;
  team: CostTier;
  legal: CostTier;
  scenarios: {
    min: { total: number };
    expected: { total: number };
    aggressive: { total: number };
  };
}

export interface RevenueForecast {
  revenueProjections: {
    year1: number;
    year2: number;
    year3: number;
    year5: number;
  };
  mrrProjections: {
    year1: number;
    year2: number;
    year3: number;
    year5: number;
  };
  assumptions: string[];
  growthDrivers: string[];
  customerAcquisition: string[];
  pricing: string[];
  confidenceScore: number; // 0-100
}

export interface UnitEconomics {
  cac: number;
  ltv: number;
  ltvToCacRatio: number;
  grossMargin: number; // percentage (e.g. 78 for 78%)
  contributionMargin: number; // percentage
  paybackPeriod: number; // in months
  revenuePerCustomer: number;
}

export interface BreakEvenAnalysis {
  breakEvenRevenue: number;
  breakEvenCustomers: number;
  breakEvenTimelineMonths: number;
  methodology: string;
}

export interface RoiAnalysis {
  expectedRoi: number; // percentage
  conservativeRoi: number;
  optimisticRoi: number;
  riskAdjustedRoi: number;
}

export interface FundingRequirements {
  capitalNeeded: number;
  bootstrapFeasibility: boolean;
  bootstrapReasoning: string;
  grantOpportunities: string[];
  investorSuitability: string;
  fundingTimeline: string;
  allocation: {
    productEng: number; // percentage
    salesMarketing: number;
    operations: number;
    legalGna: number;
  };
}

export interface CashFlowItem {
  period: string; // e.g. "M1", "M3", "M6", "M9", "M12", "M18", "M24", "M36"
  revenue: number;
  expenses: number;
  cashflow: number;
}

export interface CashFlowForecast {
  forecast: CashFlowItem[];
  cashShortages: string[];
  fundingGaps: string[];
  liquidityRisks: string[];
}

export interface ProfitabilityAnalysis {
  grossProfit: number;
  operatingProfit: number;
  netProfitPotential: number;
  grossMargin: number; // percentage
  operatingMargin: number; // percentage
  profitabilityTimelineMonths: number;
}

export interface ScenarioDetail {
  revenue: number;
  costs: number;
  profit: number;
  roi: number; // percentage
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface Scenarios {
  bestCase: ScenarioDetail;
  expectedCase: ScenarioDetail;
  worstCase: ScenarioDetail;
}

export interface FinancialViability {
  score: number; // 0-100
  reasoning: string[];
}

export interface FinancialIntelligenceReport {
  startupCosts: StartupCosts;
  revenueForecast: RevenueForecast;
  unitEconomics: UnitEconomics;
  breakEvenAnalysis: BreakEvenAnalysis;
  roiAnalysis: RoiAnalysis;
  fundingRequirements: FundingRequirements;
  cashFlowForecast: CashFlowForecast;
  profitabilityAnalysis: ProfitabilityAnalysis;
  financialViability: FinancialViability;
  scenarios: Scenarios;
}
