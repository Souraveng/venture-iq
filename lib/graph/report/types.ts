// lib/graph/report/types.ts

export interface ExecutiveSummaryReport {
  title: string;
  sections: {
    opportunity: string[];
    market: string[];
    competition: string[];
    risk: string[];
    financials: string[];
    verdict: string[];
  };
}

export interface BusinessPlanReport {
  title: string;
  sections: {
    problem: string[];
    solution: string[];
    market: string[];
    businessModel: string[];
    competition: string[];
    financials: string[];
    roadmap: string[];
    risk: string[];
    funding: string[];
  };
}

export interface InvestorDueDiligenceReport {
  title: string;
  sections: {
    marketAnalysis: string[];
    tamSamSom: string[];
    competition: string[];
    moat: string[];
    financialViability: string[];
    investmentRecommendation: string[];
    redFlags: string[];
  };
}

export interface FounderRoadmapReportDoc {
  title: string;
  sections: {
    plan30Day: string[];
    plan90Day: string[];
    plan1Year: string[];
    milestones: string[];
    kpis: string[];
    riskMitigation: string[];
  };
}

export interface PitchDeckSlide {
  slideNumber: number;
  title: string;
  headline: string;
  points?: string[];
  stats?: { label: string; value: string }[];
  models?: { type: string; price: string; note: string }[];
  members?: { name: string; bg: string; color: string }[];
}

export interface OpportunityAnalysisReport {
  title: string;
  overallScore: number;
  breakdown: {
    marketOpportunityScore: number;
    competitionScore: number;
    financialViabilityScore: number;
    executionFeasibilityScore: number;
    fundingPotentialScore: number;
    riskResilienceScore: number;
  };
  keyFindings: string[];
}

export interface OnePageBrief {
  title: string;
  summary: string;
  keyMetrics: { label: string; value: string }[];
  recommendedActions: string[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface RiskMatrixPoint {
  x: number; // 0-100 probability
  y: number; // 0-100 impact
  label: string;
  severity: string;
}

export interface CompetitorMatrixRow {
  name: string;
  criteria: string[];
  score: number;
}

export interface TimelinePhaseTask {
  task: string;
  startMonth: number;
  endMonth: number;
  phase: string;
}

export interface ChartCollection {
  marketGrowth: ChartDataPoint[];
  revenueForecast: ChartDataPoint[];
  costBreakdown: ChartDataPoint[];
  riskMatrix: RiskMatrixPoint[];
  competitorMatrix: CompetitorMatrixRow[];
  roadmapTimeline: TimelinePhaseTask[];
}

export interface VentureReportsContainer {
  executiveSummary: ExecutiveSummaryReport;
  businessPlan: BusinessPlanReport;
  investorReport: InvestorDueDiligenceReport;
  founderRoadmap: FounderRoadmapReportDoc;
  pitchDeck: PitchDeckSlide[];
  opportunityAnalysis: OpportunityAnalysisReport;
  onePageBrief: OnePageBrief;
  charts: ChartCollection;
}
