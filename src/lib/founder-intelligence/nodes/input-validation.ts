// ──────────────────────────────────────────────────────────────────────────────
// Phase 0 — Input Validation + Playbook Select
// Type: Deterministic, zero LLM
// ──────────────────────────────────────────────────────────────────────────────

import { classifySector, classifyGeography, buildPlaybook } from "../utils/sector-classifier";
import type { PipelineNodeId } from "../contracts";

/**
 * Validates the raw idea input and selects a sector playbook.
 * This is the very first node in the graph — it gates everything else.
 */
export function runInputValidation(state: any) {
  const idea: string = state.input?.idea || "";

  // Guard: reject empty/gibberish input
  if (!idea || idea.trim().length < 10) {
    throw new Error("Idea must be at least 10 characters. Please describe your concept in more detail.");
  }

  const sector = classifySector(idea);
  const geography = classifyGeography(idea);
  const playbook = buildPlaybook(sector, geography, idea);

  return {
    pipeline: {
      playbook,
      completedNodes: ["input-validation"] as PipelineNodeId[],
    },
  };
}
