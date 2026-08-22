// ──────────────────────────────────────────────────────────────────────────────
// Phase 4b — Risk & SWOT Agent
// Model: 🟣 DeepSeek-R1 (chain-of-thought reasoning)
// ──────────────────────────────────────────────────────────────────────────────

import { vertexAiCallJSON } from "../model-router";
import { loadPrompt } from "../utils/prompt-loader";
import type { ValidatedFact, RiskSwotAnalysis, PipelineNodeId } from "../contracts";

const GUIDED_SCHEMA = {
  type: "object",
  properties: {
    riskScore: { type: "number", minimum: 0, maximum: 100 },
    swot: {
      type: "object",
      properties: {
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        opportunities: { type: "array", items: { type: "string" } },
        threats: { type: "array", items: { type: "string" } },
      },
      required: ["strengths", "weaknesses", "opportunities", "threats"],
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          severity: { type: "string", enum: ["high", "medium", "low"] },
          description: { type: "string" },
        },
        required: ["category", "severity", "description"],
      },
    },
  },
  required: ["riskScore", "swot", "risks"],
};

export async function runRiskSwot(state: any) {
  const idea = state.input?.idea || "";
  const opportunity = state.pipeline?.opportunity;
  const validatedFacts: ValidatedFact[] = state.pipeline?.validatedFacts || [];
  const playbook = state.pipeline?.playbook;

  const usableFacts = validatedFacts
    .filter(f => f.validationStatus !== "rejected")
    .map(f => `- ${f.claim} [${f.confidence}]`)
    .join("\n");

  const regulatoryContext = playbook?.regulatoryKeywords?.length
    ? `\nKey regulatory keywords for this sector: ${playbook.regulatoryKeywords.join(", ")}`
    : "";

  const analysis = await vertexAiCallJSON<RiskSwotAnalysis>({
    model: "risk_analyst",
    messages: [
      { role: "system", content: loadPrompt("risk-swot") },
      { role: "user", content: `Idea: ${idea}\nSector: ${playbook?.sector || "general"}, Geography: ${playbook?.geography || "global"}\nValue Prop: ${opportunity?.valueProposition || ""}${regulatoryContext}\n\nValidated Research:\n${usableFacts || "No research data — assess based on general sector knowledge."}` },
    ],
    guidedJson: GUIDED_SCHEMA,
    temperature: 0.2,
  });

  return {
    pipeline: {
      riskAnalysis: analysis,
      completedNodes: ["risk-swot"] as PipelineNodeId[],
    },
  };
}
