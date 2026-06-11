// lib/graph/extractor/types.ts

export type FactCategory =
  | "market"
  | "financial"
  | "competition"
  | "customer"
  | "regulation"
  | "technology";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface Fact {
  id: string;
  category: FactCategory;
  statement: string;
  value?: string;
  unit?: string;
  sourceId: string;
  confidence: ConfidenceLevel;
}

export type EntityType =
  | "COMPANY"
  | "INVESTOR"
  | "REGULATION"
  | "COUNTRY"
  | "CITY"
  | "PRODUCT"
  | "TECHNOLOGY";

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  sourceId: string;
}

export interface Relationship {
  sourceEntityId: string;
  relationType: string;
  targetEntityId: string;
  confidence: number; // 0 to 1 score
}

export interface Claim {
  claim: string;
  type: string; // e.g. "Market Forecast", "Performance Claim"
  sourceId: string;
}

export interface StructuredKnowledge {
  facts: Fact[];
  entities: Entity[];
  relationships: Relationship[];
  claims: Claim[];
}
