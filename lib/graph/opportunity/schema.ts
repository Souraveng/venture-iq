// lib/graph/opportunity/schema.ts
import { z } from "zod";

export const IntentEnum = z.enum([
  "DISCOVER_OPPORTUNITIES",
  "VALIDATE_IDEA",
  "GROW_BUSINESS",
  "INVESTOR_DUE_DILIGENCE",
]);

export const ConfidenceLevelEnum = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const LocationSchema = z.object({
  country: z.string().describe("Country name or 'unknown'"),
  state: z.string().describe("State name or 'unknown'"),
  district: z.string().describe("District name or 'unknown'"),
  city: z.string().describe("City name or 'unknown'"),
  village: z.string().describe("Village name or 'unknown'"),
  region: z.string().describe("Region description or 'unknown'"),
  location_status: z.enum(["AVAILABLE", "MISSING"]).describe("AVAILABLE if any location component is specified, else MISSING"),
});

export const FinancialContextSchema = z.object({
  budget: z.string().describe("Budget specified by the user or 'unknown'"),
  available_capital: z.string().describe("Available capital specified by the user or 'unknown'"),
  revenue: z.string().describe("Existing business revenue specified by the user or 'unknown'"),
  profit: z.string().describe("Existing business profit specified by the user or 'unknown'"),
  funding_stage: z.string().describe("Current funding stage (e.g. bootstrapping, seed, Series A) or 'unknown'"),
});

export const ExistingBusinessSchema = z.object({
  description: z.string().describe("Description of the user's existing business, if they operate one, else 'none'"),
  industry: z.string().describe("Industry sector of the existing business or 'none'"),
  years_active: z.string().describe("Duration the business has been operational or 'none'"),
});

export const StartupIdeaSchema = z.object({
  description: z.string().describe("Description of the startup or business idea the user wants to launch, else 'none'"),
  target_audience: z.string().describe("Target customers for the startup idea or 'unknown'"),
  value_proposition: z.string().describe("Core value proposition or 'unknown'"),
});

export const ConfidenceScoresSchema = z.object({
  intent: ConfidenceLevelEnum.describe("Confidence level for intent classification (HIGH: directly stated, MEDIUM: strongly implied, LOW: weakly inferred)"),
  goal: ConfidenceLevelEnum.describe("Confidence level for goals"),
  resources: ConfidenceLevelEnum.describe("Confidence level for resources"),
  skills: ConfidenceLevelEnum.describe("Confidence level for skills"),
  constraints: ConfidenceLevelEnum.describe("Confidence level for constraints"),
  location: ConfidenceLevelEnum.describe("Confidence level for location details"),
  financial_context: ConfidenceLevelEnum.describe("Confidence level for financial context"),
  timeline: ConfidenceLevelEnum.describe("Confidence level for timeline"),
  existing_business: ConfidenceLevelEnum.describe("Confidence level for existing business details"),
  startup_idea: ConfidenceLevelEnum.describe("Confidence level for startup idea details"),
});

export const OpportunityContextSchema = z.object({
  intent: IntentEnum.describe(
    "Primary intent of the user:\n" +
      "- DISCOVER_OPPORTUNITIES: User lists resources/skills/constraints but has no clear idea.\n" +
      "- VALIDATE_IDEA: User already has a startup or business idea.\n" +
      "- GROW_BUSINESS: User already operates a business.\n" +
      "- INVESTOR_DUE_DILIGENCE: User wants to evaluate a venture."
  ),
  goal: z.string().describe("Primary goal of the user (e.g., 'Increase income', 'Build startup', 'Expand business')"),
  secondary_goals: z.array(z.string()).describe("All supporting objectives or secondary goals"),
  resources: z.array(z.string()).describe("Physical (land, machinery), Financial (savings, budget), Human (team, partners), and Digital (website, audience) resources, stored separately"),
  skills: z.array(z.string()).describe("Technical skills, business skills, industry knowledge, domain expertise, or professional experience"),
  constraints: z.array(z.string()).describe("Limitations or bottlenecks (e.g. limited budget, no team, regulatory restrictions)"),
  location: LocationSchema.describe("Geographic location details"),
  financial_context: FinancialContextSchema.describe("Financial analysis context"),
  timeline: z.string().describe("Timeline context (e.g. 'immediate', '6 months', '1 year', 'long term', 'unspecified')"),
  existing_business: ExistingBusinessSchema.describe("Existing business details if applicable"),
  startup_idea: StartupIdeaSchema.describe("Startup idea details if applicable"),
  critical_missing_information: z.array(z.string()).describe("Truly critical missing information required for downstream agents to make decisions"),
  confidence: ConfidenceScoresSchema.describe("Confidence mapping for all extracted parameters"),
});
