// lib/graph/opportunity/types.ts

export type IntentType =
  | "DISCOVER_OPPORTUNITIES"
  | "VALIDATE_IDEA"
  | "GROW_BUSINESS"
  | "INVESTOR_DUE_DILIGENCE";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface LocationContext {
  country: string;
  state: string;
  district: string;
  city: string;
  village: string;
  region: string;
  location_status: "AVAILABLE" | "MISSING";
}

export interface FinancialContext {
  budget: string;
  available_capital: string;
  revenue: string;
  profit: string;
  funding_stage: string;
}

export interface ExistingBusinessContext {
  description: string;
  industry: string;
  years_active: string;
}

export interface StartupIdeaContext {
  description: string;
  target_audience: string;
  value_proposition: string;
}

export interface ConfidenceScores {
  intent: ConfidenceLevel;
  goal: ConfidenceLevel;
  resources: ConfidenceLevel;
  skills: ConfidenceLevel;
  constraints: ConfidenceLevel;
  location: ConfidenceLevel;
  financial_context: ConfidenceLevel;
  timeline: ConfidenceLevel;
  existing_business: ConfidenceLevel;
  startup_idea: ConfidenceLevel;
}

export interface VentureContext {
  intent: IntentType;
  goal: string;
  secondary_goals: string[];
  resources: string[];
  skills: string[];
  constraints: string[];
  location: LocationContext;
  financial_context: FinancialContext;
  timeline: string;
  existing_business: ExistingBusinessContext;
  startup_idea: StartupIdeaContext;
  critical_missing_information: string[];
  confidence: ConfidenceScores;
  reasoning: string;
}
