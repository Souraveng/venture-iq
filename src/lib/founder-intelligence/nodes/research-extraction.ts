// ──────────────────────────────────────────────────────────────────────────────
// Phase 2a — Research & Extraction Worker (Google Search Grounding)
// Model: 🟢 Gemini 2.5 Flash
// ──────────────────────────────────────────────────────────────────────────────

import { vertexAiCallGroundingJSON } from "../model-router";
import { loadPrompt } from "../utils/prompt-loader";
import type { ExtractedFact, PipelineNodeId } from "../contracts";

const FACT_SCHEMA = {
  type: "object",
  properties: {
    facts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          value: { type: "number" },
          unit: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["claim", "confidence"],
      },
    },
  },
  required: ["facts"],
};

export async function runResearchExtraction(state: any) {
  const opportunity = state.pipeline?.opportunity;
  const missingQueries: string[] = state.pipeline?.missingQueries || opportunity?.researchQueries || [];
  const allFacts: ExtractedFact[] = [];

  // Call Gemini with search grounding for each research query
  for (const query of missingQueries.slice(0, 3)) {
    try {
      const extraction = await vertexAiCallGroundingJSON<{ facts: Array<{ claim: string; value?: number; unit?: string; confidence: "high" | "medium" | "low" }> }>({
        model: "researcher",
        prompt: `Extract quantitative and factual claims to answer this research query: "${query}"`,
        systemInstruction: loadPrompt("research-extraction"),
        guidedJson: FACT_SCHEMA,
      });

      for (const fact of extraction.facts) {
        allFacts.push({
          ...fact,
          sourceUrl: query, // Since it uses Google search grounding, the query acts as the source context identifier
        });
      }
    } catch (err) {
      console.error(`[ResearchExtraction] Failed to run search grounding for query "${query}":`, err);
    }
  }

  return {
    pipeline: {
      extractedFacts: allFacts,
      completedNodes: ["research-extraction"] as PipelineNodeId[],
    },
  };
}
