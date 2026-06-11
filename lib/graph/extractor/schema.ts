// lib/graph/extractor/schema.ts
import { z } from "zod";

export const FactCategoryEnum = z.enum([
  "market",
  "financial",
  "competition",
  "customer",
  "regulation",
  "technology",
]);

export const ConfidenceLevelEnum = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const FactSchema = z.object({
  id: z.string().describe("Unique identifier for this fact (e.g., 'fact-1')"),
  category: FactCategoryEnum.describe("Category classification of the fact"),
  statement: z.string().describe("Clear, objective factual statement extracted from the text"),
  value: z.string().optional().describe("Optional normalized numeric value extracted (e.g. '15', '100000000', '2030')"),
  unit: z.string().optional().describe("Optional unit associated with the value (e.g. '%', 'INR', 'USD', 'units')"),
  sourceId: z.string().describe("Evidence ID this fact was extracted from"),
  confidence: ConfidenceLevelEnum.describe("Confidence rating based on source quality and clarity"),
});

export const EntityTypeEnum = z.enum([
  "COMPANY",
  "INVESTOR",
  "REGULATION",
  "COUNTRY",
  "CITY",
  "PRODUCT",
  "TECHNOLOGY",
]);

export const EntitySchema = z.object({
  id: z.string().describe("Unique identifier normalized from entity name (e.g. 'ent-ola-electric')"),
  name: z.string().describe("Name of the entity as stated in text (e.g. 'Ola Electric', 'World Bank')"),
  type: EntityTypeEnum.describe("The entity classification type"),
  sourceId: z.string().describe("Evidence ID where this entity was found"),
});

export const RelationshipSchema = z.object({
  sourceEntityId: z.string().describe("Identifier of the source entity (matching an Entity id)"),
  relationType: z.string().describe("Nature of relationship (e.g., 'CompetesWith', 'InvestedIn', 'OperatesIn', 'GovernedBy')"),
  targetEntityId: z.string().describe("Identifier of the target entity (matching an Entity id)"),
  confidence: z.number().min(0).max(1).describe("Confidence score (0.0 to 1.0) of relationship existence"),
});

export const ClaimSchema = z.object({
  claim: z.string().describe("Important claim statement (e.g. 'Indian EV market expected to reach $150B by 2030')"),
  type: z.string().describe("Claim type classification (e.g., 'Market Forecast', 'Performance Claim', 'Competitor Comparison')"),
  sourceId: z.string().describe("Evidence ID where this claim was found"),
});

export const StructuredKnowledgeSchema = z.object({
  facts: z.array(FactSchema).describe("Categorized facts extracted from the documents"),
  entities: z.array(EntitySchema).describe("Entities extracted (companies, locations, regulations, technologies)"),
  relationships: z.array(RelationshipSchema).describe("Extracted relationships between entities"),
  claims: z.array(ClaimSchema).describe("Important claims and market forecasts"),
});
