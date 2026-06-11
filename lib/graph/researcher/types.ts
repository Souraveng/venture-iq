// lib/graph/researcher/types.ts

export interface SearchResult {
  query: string;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  publishedDate: string;
}

export interface SourceMetadata {
  title: string;
  source: string;
  domain: string;
  author: string;
  publishDate: string;
  country: string;
  industry: string;
  documentType: string; // Government | Academic | Industry Report | Company Filing | Investor Report | News | Professional Blog | Unknown
}

export interface QualityScores {
  authority: number;          // 0-100
  relevance: number;          // 0-100
  freshness: number;          // 0-100
  domainReputation: number;   // 0-100
  overallScore: number;       // 0-100
}

export interface Evidence {
  id: string;
  query: string;
  title: string;
  url: string;
  sourceType: string;
  publishDate: string;
  content: string;
  authorityScore: number;
  freshnessScore: number;
  relevanceScore: number;
  overallScore: number;
  metadata?: SourceMetadata;
  normalizedContent?: string;
}

export interface EvidenceExtraction {
  metadata: SourceMetadata;
  scores: QualityScores;
  reasoning: string;
}
