// lib/graph/validator/types.ts

export type ConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW";

export interface ValidatedFact {
  id: string;
  statement: string;
  consensusValue?: string;
  confidence: ConfidenceLevel;
  credibilityScore: number;      // 0-100
  agreementScore: number;        // 0-100
  supportingSources: string[];    // Evidence IDs
  conflictingSources: string[];   // Evidence IDs
}

export interface Conflict {
  conflict: boolean;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  sources: string[];             // Evidence IDs
  category: string;
}

export interface ReliabilityScores {
  overallReliability: number;     // 0-100
  marketReliability: number;      // 0-100
  competitionReliability: number; // 0-100
  financialReliability: number;   // 0-100
  regulationReliability: number;  // 0-100
}

export interface ValidationOutput {
  validatedFacts: ValidatedFact[];
  conflicts: Conflict[];
  reliability: ReliabilityScores;
}
