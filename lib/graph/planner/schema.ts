// lib/graph/planner/schema.ts
import { z } from "zod";

export const ResearchDepthEnum = z.enum(["LOW", "MEDIUM", "HIGH", "VERY HIGH"]);

export const ResearchDimensionsSchema = z.object({
  market: z.boolean().describe("True if market analysis, trends, size, or growth is required"),
  competition: z.boolean().describe("True if direct/indirect competitor mapping is required"),
  customers: z.boolean().describe("True if customer pain points, adoption barriers, or personas are required"),
  regulations: z.boolean().describe("True if compliance, licensing, or legal restrictions are required"),
  finance: z.boolean().describe("True if capital requirements, startup costs, or unit economics are required"),
  funding: z.boolean().describe("True if venture capital activity, grants, or subsidies are required"),
  technology: z.boolean().describe("True if technical complexity, requirements, or infrastructure are required"),
  operations: z.boolean().describe("True if logistics, supply chain, vendors, or distribution is required"),
});

export const SearchQueriesSchema = z.object({
  market: z.array(z.string()).describe("Specific, targeted queries for market sizing/trends. Leave empty if market is false"),
  competition: z.array(z.string()).describe("Specific, targeted queries for competitor mapping. Leave empty if competition is false"),
  customers: z.array(z.string()).describe("Specific, targeted queries for customer behavior/personas. Leave empty if customers is false"),
  regulations: z.array(z.string()).describe("Specific, targeted queries for licenses/compliance. Leave empty if regulations is false"),
  finance: z.array(z.string()).describe("Specific, targeted queries for capital/startup costs. Leave empty if finance is false"),
  funding: z.array(z.string()).describe("Specific, targeted queries for grants/investors. Leave empty if funding is false"),
  technology: z.array(z.string()).describe("Specific, targeted queries for technical complexity. Leave empty if technology is false"),
  operations: z.array(z.string()).describe("Specific, targeted queries for logistics/supply chain. Leave empty if operations is false"),
});

export const SourcePrioritySchema = z.object({
  source_type: z.string().describe("Source type name (e.g. 'Government Reports', 'Academic Research', 'Industry Reports')"),
  priority: z.number().int().min(1).max(7).describe("Rank priority order (1 is highest, 7 is lowest)"),
  reason: z.string().describe("Detailed reasoning why this source type is prioritized for this specific query"),
});

export const ResearchPlannerOutputSchema = z.object({
  research_objective: z.string().describe("A concise primary research objective statement"),
  research_depth: ResearchDepthEnum.describe("Depth classification (LOW, MEDIUM, HIGH, VERY HIGH)"),
  research_dimensions: ResearchDimensionsSchema.describe("Indicators of required research dimensions"),
  search_queries: SearchQueriesSchema.describe("A collection of targeted search query lists for each active dimension"),
  source_priorities: z.array(SourcePrioritySchema).describe("Ranked preferences of source types"),
  risk_focus_areas: z.array(z.string()).describe("Core risk domains requiring detailed attention"),
  critical_unknowns: z.array(z.string()).describe("Crucial unknowns needing answers before making assumptions"),
});
