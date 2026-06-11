// lib/graph/financial/examples.ts
import { FinancialIntelligenceReport } from "./types";

export const MOCK_FINANCIAL_REPORT: FinancialIntelligenceReport = {
  startupCosts: {
    infrastructure: { min: 8000, expected: 12000, aggressive: 20000 },
    technology: { min: 10000, expected: 15000, aggressive: 30000 },
    equipment: { min: 5000, expected: 8000, aggressive: 15000 },
    licensing: { min: 3000, expected: 5000, aggressive: 10000 },
    operations: { min: 6000, expected: 10000, aggressive: 18000 },
    marketing: { min: 4000, expected: 8000, aggressive: 15000 },
    team: { min: 20000, expected: 35000, aggressive: 60000 },
    legal: { min: 2000, expected: 4000, aggressive: 8000 },
    scenarios: {
      min: { total: 60000 },
      expected: { total: 107000 },
      aggressive: { total: 176000 }
    }
  },
  revenueForecast: {
    revenueProjections: {
      year1: 142000,
      year2: 680000,
      year3: 1420000,
      year5: 4200000
    },
    mrrProjections: {
      year1: 11800,
      year2: 56700,
      year3: 118000,
      year5: 350000
    },
    assumptions: [
      "Charge point operators pay $1,200 annual subscription per fleet connection.",
      "Customer growth rate averages 15% month-on-month in Year 1.",
      "Hardware integrations are handled by CPO partners, keeping startup COGS lean."
    ],
    growthDrivers: [
      "Pune fleet electrification mandate scaling logistics demand.",
      "FAME-III subsidy driving regional charging station installations."
    ],
    customerAcquisition: [
      "Direct B2B sales targeting regional delivery fleet hubs.",
      "Partnerships with local charge point manufacturers."
    ],
    pricing: [
      "SaaS tier: $100 per charger per month billing.",
      "Transaction tier: 2% platform fee on all customer charging payments."
    ],
    confidenceScore: 82
  },
  unitEconomics: {
    cac: 320,
    ltv: 6400,
    ltvToCacRatio: 20,
    grossMargin: 78,
    contributionMargin: 75,
    paybackPeriod: 3.2,
    revenuePerCustomer: 1200
  },
  breakEvenAnalysis: {
    breakEvenRevenue: 12000,
    breakEvenCustomers: 10,
    breakEvenTimelineMonths: 11,
    methodology: "Break-even computed as fixed monthly operating expenses ($9,000) divided by contribution margin per customer ($900)."
  },
  roiAnalysis: {
    expectedRoi: 238,
    conservativeRoi: 143,
    optimisticRoi: 357,
    riskAdjustedRoi: 178
  },
  fundingRequirements: {
    capitalNeeded: 150000,
    bootstrapFeasibility: true,
    bootstrapReasoning: "Bootstrapping is feasible if pure-software analytics integrations are prioritized before hardware installations.",
    grantOpportunities: ["Maharashtra Startup Council Seed Grant", "SINE IIT Bombay Incubation Support"],
    investorSuitability: "Early-stage micro VCs or angels focusing on climate-tech, SaaS, and regional mobility integrations.",
    fundingTimeline: "Raise seed capital within 6 months of initial customer pilot traction.",
    allocation: {
      productEng: 40,
      salesMarketing: 25,
      operations: 20,
      legalGna: 15
    }
  },
  cashFlowForecast: {
    forecast: [
      { period: "M1", revenue: 0, expenses: 45000, cashflow: -45000 },
      { period: "M3", revenue: 8000, expenses: 52000, cashflow: -44000 },
      { period: "M6", revenue: 28000, expenses: 65000, cashflow: -37000 },
      { period: "M9", revenue: 68000, expenses: 78000, cashflow: -10000 },
      { period: "M12", revenue: 142000, expenses: 92000, cashflow: 50000 },
      { period: "M18", revenue: 340000, expenses: 125000, cashflow: 215000 },
      { period: "M24", revenue: 680000, expenses: 175000, cashflow: 505000 },
      { period: "M36", revenue: 1420000, expenses: 280000, cashflow: 1140000 }
    ],
    cashShortages: ["Months 3 to 6 will experience maximum cash drawdowns before subscription renewals kick in."],
    fundingGaps: ["Potential gap between initial bootstrapping limit and seed round closing."],
    liquidityRisks: ["Working capital constraint if client payment cycles exceed 45 days."]
  },
  profitabilityAnalysis: {
    grossProfit: 1107600,
    operatingProfit: 860000,
    netProfitPotential: 357000,
    grossMargin: 78,
    operatingMargin: 60,
    profitabilityTimelineMonths: 11
  },
  scenarios: {
    bestCase: {
      revenue: 1988000,
      costs: 96300,
      profit: 1891700,
      roi: 267,
      riskLevel: "LOW"
    },
    expectedCase: {
      revenue: 1420000,
      costs: 107000,
      profit: 1313000,
      roi: 178,
      riskLevel: "MEDIUM"
    },
    worstCase: {
      revenue: 852000,
      costs: 128400,
      profit: 723600,
      roi: 53,
      riskLevel: "HIGH"
    }
  },
  financialViability: {
    score: 85,
    reasoning: [
      "Strong unit economics with LTV:CAC of 20x.",
      "Excellent CAC payback timeline of 3.2 months.",
      "Fast path to break-even within 11 months."
    ]
  }
};
