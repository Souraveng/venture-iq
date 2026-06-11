// lib/graph/decision/engines.ts
import { 
  OpportunityScoreBreakdown, 
  OpportunityScore, 
  ConfidenceReport, 
  VerdictReport, 
  VerdictDecision
} from "./types";
import { ValidatedFact, ReliabilityScores } from "../validator/types";

export class OpportunityScoringEngine {
  /**
   * Calculates the weighted opportunity score:
   * - Market Opportunity = 30%
   * - Competition = 15%
   * - Financial Viability = 20%
   * - Execution Feasibility = 15%
   * - Funding Potential = 10%
   * - Risk = 10%
   */
  public static compute(breakdown: OpportunityScoreBreakdown): OpportunityScore {
    const market = Math.max(0, Math.min(100, breakdown.marketOpportunityScore));
    const competition = Math.max(0, Math.min(100, breakdown.competitionScore));
    const financials = Math.max(0, Math.min(100, breakdown.financialViabilityScore));
    const execution = Math.max(0, Math.min(100, breakdown.executionFeasibilityScore));
    const funding = Math.max(0, Math.min(100, breakdown.fundingPotentialScore));
    const risk = Math.max(0, Math.min(100, breakdown.riskResilienceScore));

    const finalScore = Math.round(
      (market * 0.30) + 
      (competition * 0.15) + 
      (financials * 0.20) + 
      (execution * 0.15) + 
      (funding * 0.10) + 
      (risk * 0.10)
    );

    return {
      score: finalScore,
      breakdown: {
        marketOpportunityScore: market,
        competitionScore: competition,
        financialViabilityScore: financials,
        executionFeasibilityScore: execution,
        fundingPotentialScore: funding,
        riskResilienceScore: risk
      }
    };
  }
}

export class ConfidenceCalculationEngine {
  /**
   * Computes the decision confidence index based on validator reliability metrics,
   * agreement scores, and fact database density.
   */
  public static compute(
    validatedFacts: ValidatedFact[],
    reliability: ReliabilityScores
  ): ConfidenceReport {
    const overallReliability = reliability?.overallReliability ?? 70;
    
    // Average consensus/agreement score of validated facts
    const factsWithAgreement = (validatedFacts || []).filter(f => f.agreementScore !== undefined);
    const agreementAvg = factsWithAgreement.length > 0
      ? factsWithAgreement.reduce((sum, f) => sum + f.agreementScore, 0) / factsWithAgreement.length
      : 80;
      
    // Fact volume factor (e.g. 20 facts = 100%)
    const volumeFactor = Math.min(100, (validatedFacts || []).length * 5);

    // Formula: 70% reliability, 20% consensus agreement, 10% fact volume
    const score = Math.round(
      (overallReliability * 0.70) +
      (agreementAvg * 0.20) +
      (volumeFactor * 0.10)
    );

    const reasoning: string[] = [
      `Data Quality: Fact verification index is at ${overallReliability}%.`,
      `Agreement: Consensus rate across sources stands at ${Math.round(agreementAvg)}%.`,
      `Fact Density: Processed and cross-verified ${(validatedFacts || []).length} specific business intelligence facts.`
    ];

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning
    };
  }
}

export class FinalDecisionEngine {
  /**
   * Enforces strict investment committee guidelines by programmatically overriding
   * LLM decisions when risk profiles are mismatched or scores are too low.
   */
  public static validate(
    verdict: VerdictReport,
    opportunityScore: number,
    riskScore: number,
    riskSeverity: string
  ): VerdictReport {
    let decision: VerdictDecision = verdict.decision;
    const reasoning = [...verdict.reasoning];

    // Rule 1: Low opportunity scores (< 50) are NOT RECOMMENDED
    if (opportunityScore < 50 && decision !== "NOT RECOMMENDED") {
      decision = "NOT RECOMMENDED";
      reasoning.unshift(`Programmatic Override: Downgraded to NOT RECOMMENDED due to a low calculated Opportunity Score (${opportunityScore}/100).`);
    }

    // Rule 2: Critical Risk severity or high risk score (> 60) triggers NOT RECOMMENDED or HIGH RISK
    else if ((riskSeverity === "CRITICAL" || riskScore > 60) && (decision === "STRONG OPPORTUNITY" || decision === "PROCEED")) {
      decision = "HIGH RISK";
      reasoning.unshift(`Programmatic Override: Downgraded to HIGH RISK because Risk Assessment returned ${riskSeverity} severity (Overall risk score: ${riskScore}/100).`);
    }

    // Rule 3: Moderate Opportunity scores (50 - 69) must PROCEED WITH CAUTION
    else if (opportunityScore >= 50 && opportunityScore < 70 && (decision === "STRONG OPPORTUNITY" || decision === "PROCEED")) {
      decision = "PROCEED WITH CAUTION";
      reasoning.unshift(`Programmatic Override: Capped at PROCEED WITH CAUTION due to a moderate calculated Opportunity Score (${opportunityScore}/100).`);
    }

    return {
      decision,
      reasoning
    };
  }
}
