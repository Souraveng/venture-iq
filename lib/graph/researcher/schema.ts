// lib/graph/researcher/schema.ts
import { z } from "zod";

export const SourceTypeEnum = z.enum([
  "Government",
  "Academic",
  "Industry Report",
  "Company Filing",
  "Investor Report",
  "News",
  "Professional Blog",
  "Unknown",
]);

export const SourceMetadataSchema = z.object({
  title: z.string().describe("Cleaned title of the page/document"),
  source: z.string().describe("Publishing author or organization (e.g. 'World Bank', 'RBI')"),
  domain: z.string().describe("Domain name of the source (e.g. 'worldbank.org')"),
  author: z.string().describe("Author of the document, if specified, else 'unknown'"),
  publishDate: z.string().describe("Estimated publication date (YYYY-MM-DD) or 'unknown'"),
  country: z.string().describe("Associated country/geography or 'unknown'"),
  industry: z.string().describe("Associated industry sector or 'unknown'"),
  documentType: SourceTypeEnum.describe("Source classification"),
});

export const QualityScoresSchema = z.object({
  authority: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Authority score: 90+ for official gov/academic, 80+ for verified industry reports, 70+ for premium news, 40+ for blogs"
    ),
  relevance: z
    .number()
    .min(0)
    .max(100)
    .describe("Relevance score (0-100) comparing content details to the target query"),
  freshness: z
    .number()
    .min(0)
    .max(100)
    .describe("Freshness score (0-100): 2025-2026 = 90+, 2023-2024 = 70+, 2020-2022 = 50+, older = 30-"),
  domainReputation: z
    .number()
    .min(0)
    .max(100)
    .describe("Domain reputation (0-100) based on domain trust, TLD (.gov, .edu = 95)"),
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Calculated overall quality score (0-100) combining all factors"),
});

export const EvidenceExtractionSchema = z.object({
  metadata: SourceMetadataSchema,
  scores: QualityScoresSchema,
  reasoning: z.string().describe("Step-by-step rationale for the classification and scores assigned"),
});
