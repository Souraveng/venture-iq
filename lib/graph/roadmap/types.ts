// lib/graph/roadmap/types.ts

export interface Milestone {
  id: string;
  goal: string;
  successCriteria: string;
  timeline: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  dependencies: string[];
}

export interface ValidationTest {
  type: "customer_interview" | "pricing_test" | "pilot_program" | "competitor_analysis" | "landing_page";
  task: string;
  successMetric: string;
  failureCriteria: string;
}

export interface HiringRole {
  role: string;
  priority: number;
  department: "Engineering" | "Sales" | "Marketing" | "Operations" | "Finance" | "Product";
  timeline: string;
  justification: string;
}

export interface GoToMarketPlan {
  customerAcquisitionStrategy: string;
  channels: string[];
  partnerships: string[];
  marketing: string[];
  sales: string[];
  distribution: string[];
}

export interface FundraisingRoadmap {
  bootstrapStage: string[];
  grantStage: string[];
  angelStage: string[];
  seedStage: string[];
  requirements: {
    bootstrap: string[];
    grant: string[];
    angel: string[];
    seed: string[];
  };
}

export interface PriorityMatrix {
  highImpactLowEffort: string[];
  highImpactHighEffort: string[];
  lowImpactLowEffort: string[];
  lowImpactHighEffort: string[];
}

export interface FounderRoadmapReport {
  "30DayPlan": string[];
  "90DayPlan": string[];
  "1YearPlan": string[];
  validationRoadmap: ValidationTest[];
  goToMarketPlan: GoToMarketPlan;
  fundraisingRoadmap: FundraisingRoadmap;
  hiringRoadmap: HiringRole[];
  milestones: Milestone[];
  priorityMatrix: PriorityMatrix;
  keySuccessFactors: string[];
}
