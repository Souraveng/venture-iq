// lib/graph/planner/types.ts

export type ResearchDepth = "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH";

export interface ResearchDimensions {
  market: boolean;
  competition: boolean;
  customers: boolean;
  regulations: boolean;
  finance: boolean;
  funding: boolean;
  technology: boolean;
  operations: boolean;
}

export interface SearchQueries {
  market: string[];
  competition: string[];
  customers: string[];
  regulations: string[];
  finance: string[];
  funding: string[];
  technology: string[];
  operations: string[];
}

export interface SourcePriority {
  source_type: string;
  priority: number;
  reason: string;
}

export interface ResearchPlannerOutput {
  research_objective: string;
  research_depth: ResearchDepth;
  research_dimensions: ResearchDimensions;
  search_queries: SearchQueries;
  source_priorities: SourcePriority[];
  risk_focus_areas: string[];
  critical_unknowns: string[];
}
