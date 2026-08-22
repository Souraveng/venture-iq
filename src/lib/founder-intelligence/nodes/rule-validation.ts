// ──────────────────────────────────────────────────────────────────────────────
// Phase 3 — Rule-Based Validation
// Type: 🟢 Deterministic (LLM only on genuine conflicts)
// Cross-source consensus, outlier detection, numeric plausibility
// ──────────────────────────────────────────────────────────────────────────────

import { validateFacts } from "../utils/plausibility-rules";
import type { ExtractedFact, PipelineNodeId } from "../contracts";

export function runRuleValidation(state: any) {
  const playbook = state.pipeline?.playbook;
  const extractedFacts: ExtractedFact[] = state.pipeline?.extractedFacts || [];
  const cachedFacts: ExtractedFact[] = state.pipeline?.cachedFacts || [];

  // Merge extracted + cached facts, deduplicating
  const allFacts = [...extractedFacts];
  const existingClaims = new Set(allFacts.map(f => f.claim.toLowerCase()));
  for (const cached of cachedFacts) {
    if (!existingClaims.has(cached.claim.toLowerCase())) {
      allFacts.push(cached);
    }
  }

  // Apply deterministic validation rules
  const sectorBounds = playbook?.tamBenchmarks
    ? { tamMinB: playbook.tamBenchmarks.minB, tamMaxB: playbook.tamBenchmarks.maxB }
    : undefined;

  const validatedFacts = validateFacts(allFacts, sectorBounds);

  const confirmed = validatedFacts.filter(f => f.validationStatus === "confirmed").length;
  const flagged = validatedFacts.filter(f => f.validationStatus === "flagged").length;
  const rejected = validatedFacts.filter(f => f.validationStatus === "rejected").length;

  console.log(
    `[RuleValidation] ${allFacts.length} facts → ${confirmed} confirmed, ${flagged} flagged, ${rejected} rejected`
  );

  return {
    pipeline: {
      validatedFacts,
      completedNodes: ["rule-validation"] as PipelineNodeId[],
    },
  };
}
