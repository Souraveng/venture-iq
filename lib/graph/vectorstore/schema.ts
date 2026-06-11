// lib/graph/vectorstore/schema.ts
import { z } from "zod";

export const VectorMetadataSchema = z.object({
  industry: z.string().min(1, "Industry must be specified"),
  country: z.string().min(1, "Country must be specified"),
  sourceType: z.string().min(1, "Source type must be specified"),
  credibilityScore: z.number().min(0).max(100),
  confidence: z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW"]),
  publishDate: z.string().min(1, "Publish date must be specified"),
  category: z.string().min(1, "Category must be specified"),
  intent: z.string().optional(),
}).catchall(z.any()); // Accept extra properties for ChromaDB compatibility

export const VectorDocumentSchema = z.object({
  id: z.string().min(1, "Document ID is required"),
  content: z.string().min(1, "Document content cannot be empty"),
  metadata: VectorMetadataSchema,
});

export const RetrievalQueryInputSchema = z.object({
  question: z.string().min(1, "Retrieval query/question is required"),
  context: z.string().optional(),
  intent: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

export const RetrievedKnowledgeSchema = z.object({
  documentId: z.string(),
  content: z.string(),
  similarityScore: z.number().min(0).max(100),
  credibilityScore: z.number().min(0).max(100),
  freshnessScore: z.number().min(0).max(100),
  finalScore: z.number().min(0).max(100),
  metadata: VectorMetadataSchema,
});
