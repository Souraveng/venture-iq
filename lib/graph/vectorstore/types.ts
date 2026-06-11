// lib/graph/vectorstore/types.ts

export type CollectionName =
  | "market_intelligence"
  | "competition_intelligence"
  | "customer_intelligence"
  | "financial_intelligence"
  | "regulatory_intelligence"
  | "technology_intelligence"
  | "venture_analysis";

export interface VectorMetadata {
  industry: string;
  country: string;
  sourceType: string;
  credibilityScore: number;
  confidence: string;
  publishDate: string;
  category: string;
  intent?: string;
  [key: string]: any; // To allow arbitrary key-values that ChromaDB metadatas might return
}

export interface VectorDocument {
  id: string;
  content: string;
  metadata: VectorMetadata;
}

export interface RetrievedKnowledge {
  documentId: string;
  content: string;
  similarityScore: number;  // 0 - 100
  credibilityScore: number; // 0 - 100
  freshnessScore: number;   // 0 - 100
  finalScore: number;       // 0 - 100
  metadata: VectorMetadata;
}

export interface RetrievalQueryInput {
  question: string;
  context?: string;
  intent?: string;
  filters?: Partial<VectorMetadata>;
}

export interface CacheEntry {
  key: string;
  results: RetrievedKnowledge[];
  timestamp: number;
}
