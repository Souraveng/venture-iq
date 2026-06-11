// lib/graph/analyst/engines.ts
import { VentureAnalystReport, VentureReadiness } from "./types";

export class ReadinessEngine {
  /**
   * Programmatically computes the overall venture readiness score as the average of its 5 dimensions.
   */
  public static compute(readiness: VentureReadiness): VentureReadiness {
    const scores = [
      readiness.customerValidationScore,
      readiness.marketValidationScore,
      readiness.financialReadinessScore,
      readiness.executionReadinessScore,
      readiness.fundraisingReadinessScore
    ];

    const score = Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length);

    return {
      ...readiness,
      score
    };
  }
}

export class InvestmentScoringEngine {
  /**
   * Reviews the investment recommendation decision and overrides conflicts programmatically.
   * - Downgrades "STRONG YES" decisions if there are critical risks or multiple red flags.
   */
  public static validateDecision(
    report: Omit<VentureAnalystReport, "ventureReadiness"> & { ventureReadiness: any },
    riskSeverity: string
  ): typeof report.investmentRecommendation {
    let decision = report.investmentRecommendation.decision;
    let confidence = Math.max(0, Math.min(100, report.investmentRecommendation.confidence));
    const reasoning = [...report.investmentRecommendation.reasoning];

    const redFlagCount = report.redFlags.length;

    // Rule 1: A Critical Risk profile overrides a STRONG YES
    if (riskSeverity === "CRITICAL" && (decision === "STRONG YES" || decision === "YES")) {
      decision = "MAYBE";
      reasoning.unshift(`Programmatic Override: Decision downgraded to MAYBE due to CRITICAL level risks identified in the Risk Assessment node.`);
    }

    // Rule 2: Multiple red flags (>= 4) cap investment confidence and downgrade optimistic ratings
    if (redFlagCount >= 4) {
      confidence = Math.min(65, confidence);
      if (decision === "STRONG YES") {
        decision = "YES";
      }
      reasoning.unshift(`Programmatic Override: Investment confidence capped at 65% due to the detection of ${redFlagCount} critical red flags.`);
    }

    return {
      ...report.investmentRecommendation,
      decision,
      confidence,
      reasoning
    };
  }
}
