// lib/graph/report/schema.ts
import { z } from "zod";

export const ExecutiveSummaryReportSchema = z.object({
  title: z.string().min(1),
  sections: z.object({
    opportunity: z.array(z.string()).min(1),
    market: z.array(z.string()).min(1),
    competition: z.array(z.string()).min(1),
    risk: z.array(z.string()).min(1),
    financials: z.array(z.string()).min(1),
    verdict: z.array(z.string()).min(1),
  }),
});

export const BusinessPlanReportSchema = z.object({
  title: z.string().min(1),
  sections: z.object({
    problem: z.array(z.string()).min(1),
    solution: z.array(z.string()).min(1),
    market: z.array(z.string()).min(1),
    businessModel: z.array(z.string()).min(1),
    competition: z.array(z.string()).min(1),
    financials: z.array(z.string()).min(1),
    roadmap: z.array(z.string()).min(1),
    risk: z.array(z.string()).min(1),
    funding: z.array(z.string()).min(1),
  }),
});

export const InvestorDueDiligenceReportSchema = z.object({
  title: z.string().min(1),
  sections: z.object({
    marketAnalysis: z.array(z.string()).min(1),
    tamSamSom: z.array(z.string()).min(1),
    competition: z.array(z.string()).min(1),
    moat: z.array(z.string()).min(1),
    financialViability: z.array(z.string()).min(1),
    investmentRecommendation: z.array(z.string()).min(1),
    redFlags: z.array(z.string()).min(1),
  }),
});

export const FounderRoadmapReportDocSchema = z.object({
  title: z.string().min(1),
  sections: z.object({
    plan30Day: z.array(z.string()).min(1),
    plan90Day: z.array(z.string()).min(1),
    plan1Year: z.array(z.string()).min(1),
    milestones: z.array(z.string()).min(1),
    kpis: z.array(z.string()).min(1),
    riskMitigation: z.array(z.string()).min(1),
  }),
});

export const PitchDeckSlideSchema = z.object({
  slideNumber: z.number(),
  title: z.string().min(1),
  headline: z.string().min(1),
  points: z.array(z.string()).optional(),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  models: z.array(z.object({ type: z.string(), price: z.string(), note: z.string() })).optional(),
  members: z.array(z.object({ name: z.string(), bg: z.string(), color: z.string() })).optional(),
});

export const OpportunityAnalysisReportSchema = z.object({
  title: z.string().min(1),
  overallScore: z.number().min(0).max(100),
  breakdown: z.object({
    marketOpportunityScore: z.number().min(0).max(100),
    competitionScore: z.number().min(0).max(100),
    financialViabilityScore: z.number().min(0).max(100),
    executionFeasibilityScore: z.number().min(0).max(100),
    fundingPotentialScore: z.number().min(0).max(100),
    riskResilienceScore: z.number().min(0).max(100),
  }),
  keyFindings: z.array(z.string()).min(1),
});

export const OnePageBriefSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  keyMetrics: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
  recommendedActions: z.array(z.string()).min(1),
});

export const ChartDataPointSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  secondaryValue: z.number().optional(),
});

export const RiskMatrixPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  label: z.string().min(1),
  severity: z.string().min(1),
});

export const CompetitorMatrixRowSchema = z.object({
  name: z.string().min(1),
  criteria: z.array(z.string()).min(1),
  score: z.number(),
});

export const TimelinePhaseTaskSchema = z.object({
  task: z.string().min(1),
  startMonth: z.number(),
  endMonth: z.number(),
  phase: z.string().min(1),
});

export const ChartCollectionSchema = z.object({
  marketGrowth: z.array(ChartDataPointSchema),
  revenueForecast: z.array(ChartDataPointSchema),
  costBreakdown: z.array(ChartDataPointSchema),
  riskMatrix: z.array(RiskMatrixPointSchema),
  competitorMatrix: z.array(CompetitorMatrixRowSchema),
  roadmapTimeline: z.array(TimelinePhaseTaskSchema),
});

export const VentureReportsContainerSchema = z.object({
  executiveSummary: ExecutiveSummaryReportSchema,
  businessPlan: BusinessPlanReportSchema,
  investorReport: InvestorDueDiligenceReportSchema,
  founderRoadmap: FounderRoadmapReportDocSchema,
  pitchDeck: z.array(PitchDeckSlideSchema).min(12).max(12),
  opportunityAnalysis: OpportunityAnalysisReportSchema,
  onePageBrief: OnePageBriefSchema,
  charts: ChartCollectionSchema,
});
