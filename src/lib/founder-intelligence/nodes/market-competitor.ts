// ──────────────────────────────────────────────────────────────────────────────
// Phase 4a — Market/Competitor Agent
// Model: 🟣 GLM-5.2 (long context, agentic synthesis)
// ──────────────────────────────────────────────────────────────────────────────

import { vertexAiCallJSON } from "../model-router";
import { loadPrompt } from "../utils/prompt-loader";
import type { ValidatedFact, MarketCompetitorAnalysis, PipelineNodeId } from "../contracts";

const GUIDED_SCHEMA = {
  type: "object",
  properties: {
    marketScore: { type: "number", minimum: 0, maximum: 100 },
    marketSummary: { type: "string" },
    tamEstimate: { type: "string" },
    samEstimate: { type: "string" },
    competitors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          strength: { type: "string" },
          weakness: { type: "string" },
        },
        required: ["name", "strength", "weakness"],
      },
      minItems: 2,
      maxItems: 5,
    },
  },
  required: ["marketScore", "marketSummary", "tamEstimate", "samEstimate", "competitors"],
};

export async function runMarketCompetitor(state: any) {
  const idea = state.input?.idea || "";
  const opportunity = state.pipeline?.opportunity;
  const validatedFacts: ValidatedFact[] = state.pipeline?.validatedFacts || [];
  const playbook = state.pipeline?.playbook;

  const usableFacts = validatedFacts
    .filter(f => f.validationStatus !== "rejected")
    .map(f => `- ${f.claim}${f.value ? ` (${f.value} ${f.unit || ""})` : ""} [${f.confidence}]`)
    .join("\n");

  const analysis = await vertexAiCallJSON<MarketCompetitorAnalysis>({
    model: "market_analyst",
    messages: [
      { role: "system", content: loadPrompt("market-competitor", { sector: playbook?.sector || "startups" }) },
      { role: "user", content: `Idea: ${idea}\nValue Proposition: ${opportunity?.valueProposition || ""}\nSector: ${playbook?.sector || "general"}, Geography: ${playbook?.geography || "global"}\n\nValidated Research Data:\n${usableFacts || "No research data available — use general knowledge conservatively."}` },
    ],
    guidedJson: GUIDED_SCHEMA,
  });

  return {
    pipeline: {
      marketAnalysis: analysis,
      completedNodes: ["market-competitor"] as PipelineNodeId[],
    },
  };
}
