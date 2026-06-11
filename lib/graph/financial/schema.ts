// lib/graph/financial/schema.ts
import { z } from "zod";

const CostTierSchema = z.object({
  min: z.number().nonnegative(),
  expected: z.number().nonnegative(),
  aggressive: z.number().nonnegative(),
});

export const StartupCostsSchema = z.object({
  infrastructure: CostTierSchema,
  technology: CostTierSchema,
  equipment: CostTierSchema,
  licensing: CostTierSchema,
  operations: CostTierSchema,
  marketing: CostTierSchema,
  team: CostTierSchema,
  legal: CostTierSchema,
  scenarios: z.object({
    min: z.object({ total: z.number().nonnegative() }),
    expected: z.object({ total: z.number().nonnegative() }),
    aggressive: z.object({ total: z.number().nonnegative() }),
  }),
});

export const RevenueForecastSchema = z.object({
  revenueProjections: z.object({
    year1: z.number().nonnegative(),
    year2: z.number().nonnegative(),
    year3: z.number().nonnegative(),
    year5: z.number().nonnegative(),
  }),
  mrrProjections: z.object({
    year1: z.number().nonnegative(),
    year2: z.number().nonnegative(),
    year3: z.number().nonnegative(),
    year5: z.number().nonnegative(),
  }),
  assumptions: z.array(z.string()),
  growthDrivers: z.array(z.string()),
  customerAcquisition: z.array(z.string()),
  pricing: z.array(z.string()),
  confidenceScore: z.number().min(0).max(100),
});

export const UnitEconomicsSchema = z.object({
  cac: z.number().nonnegative(),
  ltv: z.number().nonnegative(),
  ltvToCacRatio: z.number().nonnegative(),
  grossMargin: z.number().min(0).max(100),
  contributionMargin: z.number().min(0).max(100),
  paybackPeriod: z.number().nonnegative(),
  revenuePerCustomer: z.number().nonnegative(),
});

export const BreakEvenAnalysisSchema = z.object({
  breakEvenRevenue: z.number().nonnegative(),
  breakEvenCustomers: z.number().nonnegative(),
  breakEvenTimelineMonths: z.number().nonnegative(),
  methodology: z.string().min(1),
});

export const RoiAnalysisSchema = z.object({
  expectedRoi: z.number(),
  conservativeRoi: z.number(),
  optimisticRoi: z.number(),
  riskAdjustedRoi: z.number(),
});

export const FundingRequirementsSchema = z.object({
  capitalNeeded: z.number().nonnegative(),
  bootstrapFeasibility: z.boolean(),
  bootstrapReasoning: z.string().min(1),
  grantOpportunities: z.array(z.string()),
  investorSuitability: z.string().min(1),
  fundingTimeline: z.string().min(1),
  allocation: z.object({
    productEng: z.number().min(0).max(100),
    salesMarketing: z.number().min(0).max(100),
    operations: z.number().min(0).max(100),
    legalGna: z.number().min(0).max(100),
  }),
});

export const CashFlowItemSchema = z.object({
  period: z.string().min(1),
  revenue: z.number().nonnegative(),
  expenses: z.number().nonnegative(),
  cashflow: z.number(),
});

export const CashFlowForecastSchema = z.object({
  forecast: z.array(CashFlowItemSchema),
  cashShortages: z.array(z.string()),
  fundingGaps: z.array(z.string()),
  liquidityRisks: z.array(z.string()),
});

export const ProfitabilityAnalysisSchema = z.object({
  grossProfit: z.number().nonnegative(),
  operatingProfit: z.number(),
  netProfitPotential: z.number(),
  grossMargin: z.number().min(0).max(100),
  operatingMargin: z.number().min(0).max(100),
  profitabilityTimelineMonths: z.number().nonnegative(),
});

const ScenarioDetailSchema = z.object({
  revenue: z.number().nonnegative(),
  costs: z.number().nonnegative(),
  profit: z.number(),
  roi: z.number(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export const ScenariosSchema = z.object({
  bestCase: ScenarioDetailSchema,
  expectedCase: ScenarioDetailSchema,
  worstCase: ScenarioDetailSchema,
});

export const FinancialViabilitySchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.array(z.string()),
});

export const FinancialIntelligenceReportSchema = z.object({
  startupCosts: StartupCostsSchema,
  revenueForecast: RevenueForecastSchema,
  unitEconomics: UnitEconomicsSchema,
  breakEvenAnalysis: BreakEvenAnalysisSchema,
  roiAnalysis: RoiAnalysisSchema,
  fundingRequirements: FundingRequirementsSchema,
  cashFlowForecast: CashFlowForecastSchema,
  profitabilityAnalysis: ProfitabilityAnalysisSchema,
  financialViability: FinancialViabilitySchema,
  scenarios: ScenariosSchema,
});
