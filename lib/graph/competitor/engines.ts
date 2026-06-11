// lib/graph/competitor/engines.ts
import { 
  CompetitiveIntensityFactor, CompetitorConfidenceReport, 
  CompetitorProfile, MarketGap, MoatOpportunity 
} from "./types";
import { ValidatedFact } from "../validator/types";
import { RetrievedKnowledge } from "../vectorstore/types";

export class CompetitiveIntensityEngine {
  /**
   * Calculates the weighted Competitive Intensity Score from the factors.
   * Ensures weights are normalized to sum to 1.0 if they aren't already.
   */
  public static computeScore(factors: CompetitiveIntensityFactor[]): {
    score: number;
    normalizedFactors: CompetitiveIntensityFactor[];
  } {
    if (factors.length === 0) {
      return { score: 0, normalizedFactors: [] };
    }

    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const needsNormalization = Math.abs(totalWeight - 1.0) > 0.01;

    const normalizedFactors = factors.map((f) => {
      const weight = needsNormalization ? (f.weight / totalWeight) : f.weight;
      return {
        ...f,
        weight: parseFloat(weight.toFixed(3)),
        score: Math.max(0, Math.min(100, f.score))
      };
    });

    const rawScore = normalizedFactors.reduce((sum, f) => sum + f.score * f.weight, 0);
    const score = Math.round(rawScore);

    return { score, normalizedFactors };
  }
}

export class CompetitorConfidenceEngine {
  /**
   * Programmatically computes the competitor analysis confidence level.
   * Measures source credibility, matching competitor name citations, and validated facts.
   */
  public static evaluate(
    retrievedDocs: RetrievedKnowledge[],
    validatedFacts: ValidatedFact[],
    competitors: CompetitorProfile[],
    overallReliability: number
  ): CompetitorConfidenceReport {
    const competitorNames = competitors.map(c => c.name.toLowerCase());

    // 1. Gather all supporting source IDs that mention the competitor names in their content
    const supportingSourcesSet = new Set<string>();
    let matchedDocCredibilitySum = 0;
    let matchedDocCount = 0;

    retrievedDocs.forEach((doc) => {
      const contentLower = doc.content.toLowerCase();
      // Check if any of the competitors are mentioned in this RAG document
      const isMentioned = competitorNames.some(name => contentLower.includes(name));
      if (isMentioned) {
        supportingSourcesSet.add(doc.documentId);
        matchedDocCredibilitySum += doc.credibilityScore;
        matchedDocCount++;
      }
    });

    // Fallback if no specific mentions are found but general documents exist
    if (supportingSourcesSet.size === 0 && retrievedDocs.length > 0) {
      retrievedDocs.slice(0, 2).forEach(doc => supportingSourcesSet.add(doc.documentId));
    }

    // 2. Score source quality
    const sourceQualityScore = matchedDocCount > 0
      ? Math.round(matchedDocCredibilitySum / matchedDocCount)
      : Math.round(overallReliability || 50);

    // 3. Score evidence quantity
    // 0 competitors = LOW, 1-2 competitors with 3+ sources = MEDIUM, 3+ competitors with 5+ sources = HIGH/VERY_HIGH
    const evidenceCount = supportingSourcesSet.size;
    let quantityScore = 20;
    if (evidenceCount === 0) quantityScore = 0;
    else if (evidenceCount <= 2) quantityScore = 40;
    else if (evidenceCount <= 4) quantityScore = 70;
    else quantityScore = 100;

    // 4. Agreement Score based on validated facts
    const agreementScore = validatedFacts.length > 0
      ? Math.round(validatedFacts.reduce((sum, f) => sum + f.agreementScore, 0) / validatedFacts.length)
      : 80;

    // 5. Compute categorical confidence level
    const finalScore = (sourceQualityScore * 0.40) + (quantityScore * 0.30) + (agreementScore * 0.30);
    
    let overallConfidence: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
    if (finalScore >= 85) overallConfidence = "VERY_HIGH";
    else if (finalScore >= 70) overallConfidence = "HIGH";
    else if (finalScore >= 45) overallConfidence = "MEDIUM";
    else overallConfidence = "LOW";

    let reasoning = `Competitor confidence is rated ${overallConfidence} (Confidence Score: ${Math.round(finalScore)}/100). `;
    reasoning += `Found competitor citations in ${matchedDocCount} primary evidence sources. `;
    reasoning += `Evidence quality score is ${sourceQualityScore}% with a fact consensus agreement of ${agreementScore}%.`;

    return {
      overallConfidence,
      supportingSources: Array.from(supportingSourcesSet),
      evidenceCount,
      reasoning
    };
  }
}
