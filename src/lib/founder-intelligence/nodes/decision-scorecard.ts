// ──────────────────────────────────────────────────────────────────────────────
// Phase 5a — Decision Scorecard
// Type: ⬜ Algorithmic, zero LLM — fully auditable weighted formula
// ──────────────────────────────────────────────────────────────────────────────

import type { DecisionScorecard, PipelineNodeId } from "../contracts";

// Configurable weights — investors can tune these without re-prompting
const WEIGHTS = {
  market: 0.35,
  risk: 0.30,
  financial: 0.35,
};

function computeGrade(score: number): string {
  if (score >= 93) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  return "D";
}

export function runDecisionScorecard(state: any) {
  const marketScore = state.pipeline?.marketAnalysis?.marketScore ?? 70;
  const riskScore = state.pipeline?.riskAnalysis?.riskScore ?? 65;
  const financialScore = state.pipeline?.financialAnalysis?.financialScore ?? 70;

  const overallScore = Math.round(
    marketScore * WEIGHTS.market +
    riskScore * WEIGHTS.risk +
    financialScore * WEIGHTS.financial
  );

  const grade = computeGrade(overallScore);

  const explanation = [
    `Market ${marketScore} × ${WEIGHTS.market}`,
    `Risk ${riskScore} × ${WEIGHTS.risk}`,
    `Financial ${financialScore} × ${WEIGHTS.financial}`,
    `= ${overallScore} → Grade ${grade}`,
  ].join(" + ");

  const scorecard: DecisionScorecard = {
    overallScore,
    grade,
    breakdown: {
      marketScore,
      marketWeight: WEIGHTS.market,
      riskScore,
      riskWeight: WEIGHTS.risk,
      financialScore,
      financialWeight: WEIGHTS.financial,
    },
    explanation,
  };

  return {
    pipeline: {
      scorecard,
      completedNodes: ["decision-scorecard"] as PipelineNodeId[],
    },
  };
}
