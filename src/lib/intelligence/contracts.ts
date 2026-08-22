export const DILIGENCE_RUNTIME_VERSION = "0.1.0";

export const DILIGENCE_GOALS = {
  INVESTMENT_DILIGENCE: "INVESTMENT_DILIGENCE",
} as const;

export type DiligenceGoal = (typeof DILIGENCE_GOALS)[keyof typeof DILIGENCE_GOALS];

export type DiligenceWorkerId =
  | "data-completeness"
  | "evidence-collection"
  | "financial-intelligence"
  | "risk-intelligence"
  | "investment-intelligence"
  | "investment-mcda"
  | "recommendation"
  | "verification";

export interface DiligenceWorkerPlan {
  id: DiligenceWorkerId;
  name: string;
  purpose: string;
  dependsOn: DiligenceWorkerId[];
  phase: "foundation" | "analysis" | "verification";
}

export interface StartupDiligenceSnapshot {
  id: string;
  name: string;
  tagline: string;
  category: string;
  stage: string;
  founder: string;
  location: string;
  targetAmount: string;
  raisedAmount: string;
  valuation: string;
  traction: string;
  monthlyBurn: string | null;
  monthlyRevenue: string | null;
  growthRate: string | null;
  payingCustomers: string | null;
  businessPlanUrl: string | null;
  financialModelUrl: string | null;
  pitchDeckUrl: string;
}

export interface DiligenceInputSnapshot {
  startup: StartupDiligenceSnapshot;
  missingFields: string[];
  availableDocumentCount: number;
  preparedAt: string;
  scenarioOverrides?: Partial<StartupDiligenceSnapshot>;
}

export type AnalysisFindingStatus =
  | "SUPPORTED"
  | "INSUFFICIENT_EVIDENCE"
  | "NEEDS_REVIEW"
  | "CONFLICTING_EVIDENCE";

export interface EngineFindingCitation {
  url: string;
  credibility: "HIGH" | "MEDIUM" | "LOW";
}

export interface EngineFinding {
  engine: string;
  title: string;
  content: string;
  status: AnalysisFindingStatus;
  confidence: number | null;
  citations?: EngineFindingCitation[];
}

export interface EngineScorecard {
  framework: string;
  totalScore: number;
  weights: Record<string, number>;
  components: Record<string, number>;
  explanation: string;
}

export interface EngineRecommendation {
  type: "INVEST" | "MONITOR" | "PASS" | "REQUEST_INFORMATION" | "NEXT_STEP";
  title: string;
  rationale: string;
  priority: number;
  confidence: number | null;
}

export interface EngineAnalysisResult {
  findings: EngineFinding[];
  scorecards: EngineScorecard[];
  recommendations: EngineRecommendation[];
  completedWorkerIds: DiligenceWorkerId[];
}

export const diligenceWorkerPlan: DiligenceWorkerPlan[] = [
  {
    id: "data-completeness",
    name: "Data Completeness",
    purpose: "Identifies missing diligence inputs before any score is calculated.",
    dependsOn: [],
    phase: "foundation",
  },
  {
    id: "evidence-collection",
    name: "Evidence Collection",
    purpose: "Builds the verified knowledge package from startup data and approved sources.",
    dependsOn: ["data-completeness"],
    phase: "foundation",
  },
  {
    id: "financial-intelligence",
    name: "Financial Intelligence",
    purpose: "Calculates runway and unit-economics inputs before interpretation.",
    dependsOn: ["data-completeness"],
    phase: "analysis",
  },
  {
    id: "risk-intelligence",
    name: "Risk Intelligence",
    purpose: "Produces a structured probability, impact, and mitigation matrix.",
    dependsOn: ["evidence-collection"],
    phase: "analysis",
  },
  {
    id: "investment-mcda",
    name: "Investment MCDA",
    purpose: "Combines supported evidence into an explainable investment score.",
    dependsOn: ["financial-intelligence", "risk-intelligence", "investment-intelligence"],
    phase: "analysis",
  },
  {
    id: "investment-intelligence",
    name: "Investment Intelligence",
    purpose: "Evaluates investor thesis alignment, market readiness, and founder concerns.",
    dependsOn: ["risk-intelligence"],
    phase: "analysis",
  },
  {
    id: "recommendation",
    name: "Recommendation Engine",
    purpose: "Synthesizes all findings into actionable next steps.",
    dependsOn: ["investment-mcda"],
    phase: "analysis",
  },
  {
    id: "verification",
    name: "Verification Gate",
    purpose: "Blocks unsupported claims and records confidence before publication.",
    dependsOn: ["recommendation"],
    phase: "verification",
  },
];
