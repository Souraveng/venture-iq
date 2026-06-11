// lib/graph/risk/engines.ts
import { RiskDetails, RiskSeverityLevel, OverallRiskIndex, RiskIntelligenceReport } from "./types";

export class RiskScoringEngine {
  /**
   * Maps a calculated risk score (0-100) to its corresponding severity level.
   */
  public static mapScoreToSeverity(score: number): RiskSeverityLevel {
    const s = Math.max(0, Math.min(100, score));
    if (s >= 76) return "CRITICAL";
    if (s >= 51) return "HIGH";
    if (s >= 26) return "MEDIUM";
    return "LOW";
  }

  /**
   * Calculates the risk score using probability and impact, and returns validated risk details.
   */
  public static validateRisk(details: RiskDetails): RiskDetails {
    const probability = Math.max(0, Math.min(100, details.probability));
    const impact = Math.max(0, Math.min(100, details.impact));
    
    // Formula: Risk Score = (Probability * Impact) / 100
    const riskScore = Math.round((probability * impact) / 100);
    const severity = this.mapScoreToSeverity(riskScore);

    return {
      ...details,
      probability,
      impact,
      riskScore,
      severity
    };
  }
}

export class OverallRiskIndexScorer {
  /**
   * Computes the overall risk index from the 8 dimensions.
   */
  public static compute(report: Omit<RiskIntelligenceReport, "overallRiskIndex">): OverallRiskIndex {
    const dimensions: RiskDetails[] = [
      report.marketRisk,
      report.competitionRisk,
      report.financialRisk,
      report.regulatoryRisk,
      report.technologyRisk,
      report.operationalRisk,
      report.executionRisk,
      report.fundingRisk
    ];

    const totalScore = dimensions.reduce((sum, d) => sum + d.riskScore, 0);
    const score = Math.round(totalScore / dimensions.length);
    const severity = RiskScoringEngine.mapScoreToSeverity(score);

    // Identify critical and high risk areas for summary reasoning
    const reasoning: string[] = [];
    const labels = [
      { name: "Market Risk", details: report.marketRisk },
      { name: "Competition Risk", details: report.competitionRisk },
      { name: "Financial Risk", details: report.financialRisk },
      { name: "Regulatory Risk", details: report.regulatoryRisk },
      { name: "Technology Risk", details: report.technologyRisk },
      { name: "Operational Risk", details: report.operationalRisk },
      { name: "Execution Risk", details: report.executionRisk },
      { name: "Funding Risk", details: report.fundingRisk }
    ];

    labels.forEach((l) => {
      if (l.details.severity === "CRITICAL" || l.details.severity === "HIGH") {
        reasoning.push(`${l.name} is ${l.details.severity} (Score: ${l.details.riskScore}) - ${l.details.reasoning}`);
      }
    });

    if (reasoning.length === 0) {
      reasoning.push("All evaluated venture risk dimensions are in Low or Medium severity ranges.");
    }

    return {
      score,
      severity,
      reasoning
    };
  }
}
