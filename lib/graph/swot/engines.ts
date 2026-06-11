// lib/graph/swot/engines.ts
import { SwotItem, SwotImpactTier, SwotConfidenceLevel, SwotIntelligenceReport } from "./types";
import { ValidatedFact } from "../validator/types";

export class ImpactScoringEngine {
  /**
   * Maps an impact score (0-100) to its corresponding categorical tier.
   */
  public static mapScoreToTier(score: number): SwotImpactTier {
    const s = Math.max(0, Math.min(100, score));
    if (s >= 76) return "CRITICAL";
    if (s >= 51) return "HIGH";
    if (s >= 26) return "MEDIUM";
    return "LOW";
  }

  /**
   * Enforces and validates impact score/tier consistency on a SWOT item.
   */
  public static validateItem(item: SwotItem): SwotItem {
    const score = Math.max(0, Math.min(100, item.impactScore));
    return {
      ...item,
      impactScore: score,
      impactTier: this.mapScoreToTier(score)
    };
  }
}

export class PrioritizationSorter {
  /**
   * Sorts a list of SWOT items descending by impact score.
   */
  public static sort(items: SwotItem[]): SwotItem[] {
    return [...items].sort((a, b) => b.impactScore - a.impactScore);
  }

  /**
   * Ranks and formats the overall SWOT report, regenerating the strategicSummary.
   */
  public static processReport(report: SwotIntelligenceReport): SwotIntelligenceReport {
    const strengths = this.sort(report.strengths.map(i => ImpactScoringEngine.validateItem(i)));
    const weaknesses = this.sort(report.weaknesses.map(i => ImpactScoringEngine.validateItem(i)));
    const opportunities = this.sort(report.opportunities.map(i => ImpactScoringEngine.validateItem(i)));
    const threats = this.sort(report.threats.map(i => ImpactScoringEngine.validateItem(i)));

    // Take top 2 items from each category for the strategic summary
    const topStrengths = strengths.slice(0, 2).map(s => s.statement);
    const topWeaknesses = weaknesses.slice(0, 2).map(w => w.statement);
    const topOpportunities = opportunities.slice(0, 2).map(o => o.statement);
    const topThreats = threats.slice(0, 2).map(t => t.statement);

    return {
      strengths,
      weaknesses,
      opportunities,
      threats,
      strategicSummary: {
        topStrengths,
        topWeaknesses,
        topOpportunities,
        topThreats
      }
    };
  }
}

export class ConfidenceEngine {
  /**
   * Programmatically validates and enforces confidence levels on each SWOT item based on evidence.
   */
  public static evaluateItemConfidence(
    item: SwotItem,
    validatedFacts: ValidatedFact[]
  ): SwotConfidenceLevel {
    if (item.evidence.length === 0) {
      return "LOW";
    }

    const validatedFactsMap = new Map(validatedFacts.map(f => [f.id, f]));
    let totalAgreementSum = 0;
    let validatedEvidenceCount = 0;

    item.evidence.forEach((evId) => {
      const fact = validatedFactsMap.get(evId);
      if (fact) {
        totalAgreementSum += fact.agreementScore;
        validatedEvidenceCount++;
      }
    });

    if (validatedEvidenceCount === 0) {
      // Evidence cited is not a validated fact (e.g. raw source or custom text)
      // Check quantity to determine default confidence
      if (item.evidence.length >= 3) return "HIGH";
      if (item.evidence.length >= 1) return "MEDIUM";
      return "LOW";
    }

    const avgAgreement = totalAgreementSum / validatedEvidenceCount;
    const evidenceQuantity = item.evidence.length;

    // Multi-factor confidence score
    const score = (avgAgreement * 0.7) + (Math.min(evidenceQuantity, 5) * 6);

    if (score >= 85) return "VERY_HIGH";
    if (score >= 70) return "HIGH";
    if (score >= 45) return "MEDIUM";
    return "LOW";
  }
}
