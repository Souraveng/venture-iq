// ──────────────────────────────────────────────────────────────────────────────
// Phase 4c — Financial Engine
// Type: 🟢 Code math (deterministic) + 🟣 Nemotron Super 49B (narrative only)
// The LLM writes prose about numbers it did NOT compute
// ──────────────────────────────────────────────────────────────────────────────

import { vertexAiCallJSON } from "../model-router";
import { loadPrompt } from "../utils/prompt-loader";
import { computeFinancials, scoreFinancials } from "../utils/financial-calculator";
import type { ValidatedFact, FinancialAnalysis, PipelineNodeId } from "../contracts";

export async function runFinancialEngine(state: any) {
  const idea = state.input?.idea || "";
  const validatedFacts: ValidatedFact[] = state.pipeline?.validatedFacts || [];
  const playbook = state.pipeline?.playbook;

  // Step 1: DETERMINISTIC MATH — zero LLM involvement
  const bounds = playbook?.tamBenchmarks || { minB: 5, maxB: 1000 };
  const calculations = computeFinancials(validatedFacts, bounds);
  const financialScore = scoreFinancials(calculations);

  // Step 2: LLM NARRATIVE — Vertex AI interprets numbers it did NOT generate
  const result = await vertexAiCallJSON<{ narrative: string }>({
    model: "financial",
    messages: [
      { role: "system", content: loadPrompt("financial-narrative") },
      { role: "user", content: `Startup: ${idea}\n\nPre-computed metrics:\n- TAM: $${calculations.tamValueB}B\n- SAM: $${calculations.samValueB}B\n- SOM: $${calculations.somValueM}M\n- CAC: $${calculations.cacUsd}\n- LTV: $${calculations.ltvUsd}\n- LTV/CAC: ${calculations.ltvCacRatio}x\n- Gross Margin: ${calculations.grossMarginPct}%\n- Monthly Burn: $${calculations.monthlyBurnUsd}\n- Runway: ${calculations.runwayMonths} months\n- Financial Health Score: ${financialScore}/100` },
    ],
    guidedJson: {
      type: "object",
      properties: { narrative: { type: "string" } },
      required: ["narrative"],
    },
    maxTokens: 512,
  });

  return {
    pipeline: {
      financialAnalysis: { financialScore, calculations, narrative: result.narrative },
      completedNodes: ["financial-engine"] as PipelineNodeId[],
    },
  };
}
