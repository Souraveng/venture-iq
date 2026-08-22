// ──────────────────────────────────────────────────────────────────────────────
// Phase 5b — Venture Analyst Synthesis
// Model: 🟣 GLM-5.2 (long context — holds everything upstream at once)
// ──────────────────────────────────────────────────────────────────────────────

import { vertexAiCallJSON } from "../model-router";
import { loadPrompt } from "../utils/prompt-loader";
import type { VentureSynthesis, PipelineNodeId } from "../contracts";

const GUIDED_SCHEMA = {
  type: "object",
  properties: {
    executiveSummary: { type: "string" },
    keyInsights: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
    investmentThesis: { type: "string" },
  },
  required: ["executiveSummary", "keyInsights", "investmentThesis"],
};

export async function runVentureSynthesis(state: any) {
  const idea = state.input?.idea || "";
  const pipeline = state.pipeline || {};

  const contextParts: string[] = [
    `Startup Idea: ${idea}`,
    `Sector: ${pipeline.playbook?.sector || "general"}, Geography: ${pipeline.playbook?.geography || "global"}`,
    "",
    `## Opportunity`,
    `Problem: ${pipeline.opportunity?.problemStatement || "N/A"}`,
    `Customer: ${pipeline.opportunity?.targetCustomer || "N/A"}`,
    `Value Prop: ${pipeline.opportunity?.valueProposition || "N/A"}`,
    `Monetization: ${pipeline.opportunity?.monetizationModel || "N/A"}`,
    "",
    `## Market Analysis (Score: ${pipeline.marketAnalysis?.marketScore || "N/A"}/100)`,
    pipeline.marketAnalysis?.marketSummary || "N/A",
    `TAM: ${pipeline.marketAnalysis?.tamEstimate || "N/A"}`,
    `Competitors: ${pipeline.marketAnalysis?.competitors?.map((c: any) => c.name).join(", ") || "N/A"}`,
    "",
    `## Risk & SWOT (Score: ${pipeline.riskAnalysis?.riskScore || "N/A"}/100)`,
    `Strengths: ${pipeline.riskAnalysis?.swot?.strengths?.join("; ") || "N/A"}`,
    `Weaknesses: ${pipeline.riskAnalysis?.swot?.weaknesses?.join("; ") || "N/A"}`,
    `Key Risks: ${pipeline.riskAnalysis?.risks?.map((r: any) => `${r.category}(${r.severity})`).join(", ") || "N/A"}`,
    "",
    `## Financials (Score: ${pipeline.financialAnalysis?.financialScore || "N/A"}/100)`,
    pipeline.financialAnalysis?.narrative || "N/A",
    `LTV/CAC: ${pipeline.financialAnalysis?.calculations?.ltvCacRatio || "N/A"}x`,
    `Runway: ${pipeline.financialAnalysis?.calculations?.runwayMonths || "N/A"} months`,
    "",
    `## Decision Scorecard`,
    `Overall: ${pipeline.scorecard?.overallScore || "N/A"}/100, Grade: ${pipeline.scorecard?.grade || "N/A"}`,
    `Formula: ${pipeline.scorecard?.explanation || "N/A"}`,
  ];

  const synthesis = await vertexAiCallJSON<VentureSynthesis>({
    model: "synthesis",
    messages: [
      { role: "system", content: loadPrompt("venture-synthesis") },
      { role: "user", content: contextParts.join("\n") },
    ],
    guidedJson: GUIDED_SCHEMA,
    maxTokens: 1024,
  });

  return {
    pipeline: {
      synthesis,
      completedNodes: ["venture-synthesis"] as PipelineNodeId[],
    },
  };
}
