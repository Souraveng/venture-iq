// lib/graph/market/scoring.ts
import { 
  TamDetails, SamDetails, SomDetails, 
  AttractivenessFactor, MarketConfidenceLevel, ConfidenceReport 
} from "./types";
import { ValidatedFact } from "../validator/types";
import { RetrievedKnowledge } from "../vectorstore/types";

export class CalculationEngine {
  /**
   * Parses standard money abbreviations (e.g., "$142B", "₹15 Lakhs", "5.6 Crore", "$2.4T") to approximate float values for verification.
   */
  public static parseMoneyValue(valStr: string): number {
    const clean = valStr.replace(/[₹$,]/g, "").trim().toLowerCase();
    const floatVal = parseFloat(clean);
    if (isNaN(floatVal)) return 0;

    if (clean.endsWith("t") || clean.includes("trillion")) {
      return floatVal * 1000000000000;
    }
    if (clean.endsWith("b") || clean.includes("billion") || clean.includes("arab")) {
      return floatVal * 1000000000;
    }
    if (clean.endsWith("m") || clean.includes("million")) {
      return floatVal * 1000000;
    }
    if (clean.includes("crore") || clean.includes("cr")) {
      // 1 Crore = 10,000,000
      return floatVal * 10000000;
    }
    if (clean.includes("lakh") || clean.includes("lk")) {
      // 1 Lakh = 100,000
      return floatVal * 100000;
    }
    return floatVal;
  }

  /**
   * Verifies that TAM >= SAM >= SOM. If there is a violation, adjusts or logs a caution report.
   */
  public static verifyMarketHierarchies(tamVal: string, samVal: string, somVal: string): {
    valid: boolean;
    reasoning: string;
  } {
    const tamNum = this.parseMoneyValue(tamVal);
    const samNum = this.parseMoneyValue(samVal);
    const somNum = this.parseMoneyValue(somVal);

    if (tamNum === 0 || samNum === 0 || somNum === 0) {
      return {
        valid: true,
        reasoning: "One or more market sizes are qualitative or could not be parsed numerically; ordering is assumed valid."
      };
    }

    if (samNum > tamNum) {
      return {
        valid: false,
        reasoning: `SAM (${samVal}) cannot exceed TAM (${tamVal}). Please review market scope assumptions.`
      };
    }

    if (somNum > samNum) {
      return {
        valid: false,
        reasoning: `SOM (${somVal}) cannot exceed SAM (${samVal}). Realistic market capture must be smaller than serviceable market.`
      };
    }

    return {
      valid: true,
      reasoning: "Market hierarchies validated successfully: TAM >= SAM >= SOM."
    };
  }
}

export class MarketScoringEngine {
  /**
   * Computes the weighted attractiveness score based on factors.
   * Validates that weights add up to 1.0. If not, normalizes them.
   */
  public static computeScore(factors: AttractivenessFactor[]): {
    score: number;
    normalizedFactors: AttractivenessFactor[];
  } {
    if (factors.length === 0) {
      return { score: 0, normalizedFactors: [] };
    }

    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    
    // Normalize weights if sum is not exactly 1.0 (tolerance 0.01)
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

export class ConfidenceEngine {
  /**
   * Programmatically computes confidence reports based on reliability, evidence count, and fact agreement metrics.
   */
  public static evaluate(
    retrievedDocs: RetrievedKnowledge[],
    validatedFacts: ValidatedFact[],
    overallReliability: number
  ): ConfidenceReport {
    // 1. Source Quality Score: average of credibility scores in retrieved documents
    let sourceQualitySum = 0;
    let validSources = 0;

    retrievedDocs.forEach((doc) => {
      if (doc.credibilityScore > 0) {
        sourceQualitySum += doc.credibilityScore;
        validSources++;
      }
    });

    const sourceQualityScore = validSources > 0 
      ? Math.round(sourceQualitySum / validSources)
      : Math.round(overallReliability || 50);

    // 2. Evidence Quantity Score: logarithmic scaling based on facts and source counts
    // 0 sources = 0, 1 source = 30, 2-3 sources = 60, 4-5 sources = 80, 6+ sources = 100
    const totalEvidenceCount = retrievedDocs.length + validatedFacts.length;
    let evidenceQuantityScore = 20;
    if (totalEvidenceCount === 0) evidenceQuantityScore = 0;
    else if (totalEvidenceCount <= 1) evidenceQuantityScore = 30;
    else if (totalEvidenceCount <= 3) evidenceQuantityScore = 60;
    else if (totalEvidenceCount <= 5) evidenceQuantityScore = 80;
    else evidenceQuantityScore = 100;

    // 3. Agreement Score: average agreement score of the validated facts
    let agreementSum = 0;
    let validatedCount = 0;

    validatedFacts.forEach((fact) => {
      agreementSum += fact.agreementScore;
      validatedCount++;
    });

    const agreementScore = validatedCount > 0
      ? Math.round(agreementSum / validatedCount)
      : 75; // Default fallback to medium-high agreement

    // 4. Calculate Overall Confidence Level
    // Weighted final confidence score = 0.40 * Quality + 0.30 * Quantity + 0.30 * Agreement
    const weightedConfidenceScore = (sourceQualityScore * 0.40) + (evidenceQuantityScore * 0.30) + (agreementScore * 0.30);
    
    let overallConfidence: MarketConfidenceLevel = "MEDIUM";
    if (weightedConfidenceScore >= 85) overallConfidence = "VERY_HIGH";
    else if (weightedConfidenceScore >= 70) overallConfidence = "HIGH";
    else if (weightedConfidenceScore >= 45) overallConfidence = "MEDIUM";
    else overallConfidence = "LOW";

    let reasoning = `Confidence is ${overallConfidence} (Score: ${Math.round(weightedConfidenceScore)}/100). `;
    reasoning += `Evaluated ${retrievedDocs.length} retrieved facts and evidence items. `;
    reasoning += `Source quality score is ${sourceQualityScore}%, with an average fact consensus agreement of ${agreementScore}%.`;

    return {
      overallConfidence,
      sourceQualityScore,
      evidenceQuantityScore,
      agreementScore,
      reasoning
    };
  }
}
