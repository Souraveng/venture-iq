// ──────────────────────────────────────────────────────────────────────────────
// Founder Intelligence Pipeline — Type Contracts
// 10-node LangGraph: 7 LLM calls + 3 deterministic/algorithmic components
// ──────────────────────────────────────────────────────────────────────────────

/** Every node in the pipeline graph */
export type PipelineNodeId =
  | "input-validation"
  | "opportunity-planning"
  | "cache-evaluator"
  | "research-extraction"
  | "vector-store"
  | "rule-validation"
  | "market-competitor"
  | "risk-swot"
  | "financial-engine"
  | "decision-scorecard"
  | "venture-synthesis"
  | "roadmap-report";

// ── Error Recovery Types ────────────────────────────────────────────────────

/** Captures per-node failure details for partial completion and debugging */
export interface NodeError {
  nodeId: PipelineNodeId;
  error: string;
  model?: string;
  retryCount: number;
  fallbackUsed?: string;   // the fallback model ID if one was tried
  timestamp: number;        // Date.now() when the error occurred
}

// ── Pipeline Input ──────────────────────────────────────────────────────────

export interface PipelineInput {
  idea: string;
  userEmail?: string;
}

// ── Phase 0: Input Validation + Playbook ────────────────────────────────────

export interface PlaybookConfig {
  sector: string;           // e.g. "fintech", "healthtech", "edtech"
  geography: string;        // e.g. "India", "Global", "SEA"
  searchQueryTemplates: string[];
  tamBenchmarks: { minB: number; maxB: number }; // in billions USD
  regulatoryKeywords: string[];
}

// ── Phase 1: Opportunity & Planning Agent ───────────────────────────────────

export interface OpportunityPlan {
  problemStatement: string;
  targetCustomer: string;
  valueProposition: string;
  sector: string;
  monetizationModel: string;
  researchQueries: string[];  // exact strings Phase 2 will search
}

// ── Phase 2: Research & Extraction ──────────────────────────────────────────

export interface ExtractedFact {
  claim: string;
  value?: number;
  unit?: string;
  sourceUrl: string;
  confidence: "high" | "medium" | "low";
}

// ── Phase 3: Rule-Based Validation ──────────────────────────────────────────

export interface ValidatedFact extends ExtractedFact {
  validationStatus: "confirmed" | "flagged" | "rejected";
  flagReason?: string;
}

// ── Phase 4a: Market/Competitor Agent ───────────────────────────────────────

export interface CompetitorProfile {
  name: string;
  strength: string;
  weakness: string;
}

export interface MarketCompetitorAnalysis {
  marketScore: number; // 0-100
  marketSummary: string;
  tamEstimate: string;
  samEstimate: string;
  competitors: CompetitorProfile[];
}

// ── Phase 4b: Risk & SWOT Agent ────────────────────────────────────────────

export interface RiskEntry {
  category: string;   // "regulatory", "technical", "market_timing", "supply_chain"
  severity: "high" | "medium" | "low";
  description: string;
}

export interface RiskSwotAnalysis {
  riskScore: number; // 0-100 (higher = LESS risky, i.e. healthier)
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  risks: RiskEntry[];
}

// ── Phase 4c: Financial Engine ─────────────────────────────────────────────

export interface FinancialCalculations {
  tamValueB: number;      // TAM in billions
  samValueB: number;      // SAM in billions
  somValueM: number;      // SOM in millions
  cacUsd: number;         // Customer Acquisition Cost
  ltvUsd: number;         // Lifetime Value
  ltvCacRatio: number;
  monthlyBurnUsd: number;
  runwayMonths: number;
  grossMarginPct: number;
}

export interface FinancialAnalysis {
  financialScore: number; // 0-100
  calculations: FinancialCalculations;
  narrative: string;      // LLM-written interpretation of the numbers
}

// ── Phase 5a: Decision Scorecard ───────────────────────────────────────────

export interface ScoreBreakdown {
  marketScore: number;
  marketWeight: number;
  riskScore: number;
  riskWeight: number;
  financialScore: number;
  financialWeight: number;
}

export interface DecisionScorecard {
  overallScore: number;
  grade: string;
  breakdown: ScoreBreakdown;
  explanation: string;    // fully auditable: "82 × 0.35 + 75 × 0.30 + 88 × 0.35 = 82.1"
}

// ── Phase 5b: Venture Analyst Synthesis ────────────────────────────────────

export interface VentureSynthesis {
  executiveSummary: string;
  keyInsights: string[];
  investmentThesis: string;
}

// ── Phase 5c: Roadmap & Report Generator ───────────────────────────────────

export interface RoadmapMilestone {
  month: string;
  milestone: string;
}

export interface DashboardTab {
  engine: string;
  title: string;
  summary: string;
  dataPoints: string[];
}

export interface RoadmapReport {
  roadmapMilestones: RoadmapMilestone[];
  elevatorPitch: string;
  dashboardTabs: Record<string, DashboardTab>;
}

// ── Full Pipeline Result (what gets stored in the DB) ──────────────────────

export interface PipelineResult {
  // Scores
  marketViability: number;
  technicalFeasibility: number;
  financialPlanning: string;
  overallGrade: string;

  // Structured outputs from each phase
  playbook: PlaybookConfig;
  opportunity: OpportunityPlan;
  
  // Cache & Research State
  cachedFacts: ExtractedFact[];
  missingQueries: string[];
  cacheSufficient: boolean;
  
  extractedFacts: ExtractedFact[];
  validatedFacts: ValidatedFact[];
  marketAnalysis: MarketCompetitorAnalysis;
  riskAnalysis: RiskSwotAnalysis;
  financialAnalysis: FinancialAnalysis;
  scorecard: DecisionScorecard;
  synthesis: VentureSynthesis;
  report: RoadmapReport;

  // Dashboard-ready reports (backwards-compatible with existing UI)
  reports: DashboardTab[];
  completedNodes: PipelineNodeId[];
}
