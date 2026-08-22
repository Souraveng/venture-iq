// ──────────────────────────────────────────────────────────────────────────────
// Phase 1 — Opportunity & Planning Agent
// Model: 🟣 Nemotron Super 49B (1 call)
// ──────────────────────────────────────────────────────────────────────────────

import { vertexAiCallJSON } from "../model-router";
import { loadPrompt } from "../utils/prompt-loader";
import type { OpportunityPlan, PipelineNodeId } from "../contracts";

const GUIDED_SCHEMA = {
  type: "object",
  properties: {
    problemStatement: { type: "string" },
    targetCustomer: { type: "string" },
    valueProposition: { type: "string" },
    sector: { type: "string" },
    monetizationModel: { type: "string" },
    researchQueries: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
  },
  required: ["problemStatement", "targetCustomer", "valueProposition", "sector", "monetizationModel", "researchQueries"],
};

export async function runOpportunityPlanning(state: any) {
  const idea: string = state.input?.idea || "";
  const playbook = state.pipeline?.playbook;

  const plan = await vertexAiCallJSON<OpportunityPlan>({
    model: "orchestrator",
    messages: [
      { role: "system", content: loadPrompt("opportunity-planning") },
      { role: "user", content: `Startup Idea: ${idea}\nDetected Sector: ${playbook?.sector || "unknown"}\nDetected Geography: ${playbook?.geography || "global"}` },
    ],
    guidedJson: GUIDED_SCHEMA,
  });

  return {
    pipeline: {
      opportunity: plan,
      completedNodes: ["opportunity-planning"] as PipelineNodeId[],
    },
  };
}
