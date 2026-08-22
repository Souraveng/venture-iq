import { BatchPipelineState, DealEvaluation } from "../contracts";
import { vertexAiCallJSON, vertexAiCallGroundingJSON } from "../../founder-intelligence/model-router";
import { scrubPII } from "@/lib/pii";
import fs from "fs";
import path from "path";

function loadPrompt(filename: string): string {
  const filePath = path.join(process.cwd(), "src", "lib", "shortlisted-deals", "prompts", filename);
  return fs.readFileSync(filePath, "utf-8");
}

// Helper to filter out cache hits
function getActiveDeals(state: typeof BatchPipelineState.State) {
  const evaluations = state.pipeline?.evaluations || {};
  return state.input.filter(deal => !evaluations[deal.id]?.cacheHit);
}

export async function runDealGroundingSearch(state: typeof BatchPipelineState.State) {
  const activeDeals = getActiveDeals(state);
  const evaluations: Record<string, DealEvaluation> = {};

  for (const deal of activeDeals) {
    let prompt = loadPrompt("deal_grounding_search.md");
    prompt = prompt
      .replace("{{STARTUP_NAME}}", deal.startupName)
      .replace("{{DESCRIPTION}}", deal.description || "")
      .replace("{{FUNDING_RAISED}}", deal.fundingRaised || "")
      .replace("{{TRACTION_METRICS}}", deal.tractionMetrics || "");

    const { scrubbedText } = scrubPII(prompt);

    const response = await vertexAiCallGroundingJSON<any>({
      prompt: scrubbedText,
      model: "researcher",
      guidedJson: {
        type: "object",
        properties: {
          groundedFacts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                claim: { type: "string" },
                verification: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["SUPPORTED", "NEEDS_REVIEW", "CONFLICTING_EVIDENCE"] },
                    confidence: { type: "string", enum: ["high", "medium", "low"] },
                    citations: { type: "array", items: { type: "string" } }
                  },
                  required: ["status", "confidence", "citations"]
                }
              },
              required: ["claim", "verification"]
            }
          }
        },
        required: ["groundedFacts"]
      }
    });

    evaluations[deal.id] = {
      dealId: deal.id,
      groundedFacts: response.groundedFacts
    };
  }

  return { pipeline: { evaluations } };
}

export async function runMarketAnalysis(state: typeof BatchPipelineState.State) {
  const activeDeals = getActiveDeals(state);
  const evaluations: Record<string, DealEvaluation> = {};

  for (const deal of activeDeals) {
    let prompt = loadPrompt("market_analysis.md");
    prompt = prompt
      .replace("{{STARTUP_NAME}}", deal.startupName)
      .replace("{{SECTOR}}", deal.sector || "");

    const { scrubbedText } = scrubPII(prompt);

    const response = await vertexAiCallJSON<any>({
      model: "orchestrator",
      messages: [{ role: "user", content: scrubbedText }],
      guidedJson: {
        type: "object",
        properties: {
          marketSizeScore: { type: "number" },
          competitorLandscapeScore: { type: "number" },
          summary: { type: "string" },
          keyCompetitors: { type: "array", items: { type: "string" } }
        },
        required: ["marketSizeScore", "competitorLandscapeScore", "summary", "keyCompetitors"]
      }
    });

    evaluations[deal.id] = { dealId: deal.id, marketAnalysis: response };
  }

  return { pipeline: { evaluations } };
}

export async function runTeamTraction(state: typeof BatchPipelineState.State) {
  const activeDeals = getActiveDeals(state);
  const evaluations: Record<string, DealEvaluation> = {};

  for (const deal of activeDeals) {
    let prompt = loadPrompt("team_traction.md");
    prompt = prompt
      .replace("{{STARTUP_NAME}}", deal.startupName)
      .replace("{{FOUNDERS_JSON}}", JSON.stringify(deal.founders || []))
      .replace("{{TRACTION_METRICS}}", deal.tractionMetrics || "");

    const { scrubbedText } = scrubPII(prompt);

    const response = await vertexAiCallJSON<any>({
      model: "orchestrator",
      messages: [{ role: "user", content: scrubbedText }],
      guidedJson: {
        type: "object",
        properties: {
          teamScore: { type: "number" },
          tractionScore: { type: "number" },
          summary: { type: "string" }
        },
        required: ["teamScore", "tractionScore", "summary"]
      }
    });

    evaluations[deal.id] = { dealId: deal.id, teamTraction: response };
  }

  return { pipeline: { evaluations } };
}

export async function runBusinessModelViability(state: typeof BatchPipelineState.State) {
  const activeDeals = getActiveDeals(state);
  const evaluations: Record<string, DealEvaluation> = {};

  for (const deal of activeDeals) {
    let prompt = loadPrompt("business_model_viability.md");
    prompt = prompt
      .replace("{{STARTUP_NAME}}", deal.startupName)
      .replace("{{BUSINESS_MODEL}}", deal.businessModel || "");

    const { scrubbedText } = scrubPII(prompt);

    const response = await vertexAiCallJSON<any>({
      model: "orchestrator",
      messages: [{ role: "user", content: scrubbedText }],
      guidedJson: {
        type: "object",
        properties: {
          viabilityScore: { type: "number" },
          summary: { type: "string" }
        },
        required: ["viabilityScore", "summary"]
      }
    });

    evaluations[deal.id] = { dealId: deal.id, businessModelViability: response };
  }

  return { pipeline: { evaluations } };
}
