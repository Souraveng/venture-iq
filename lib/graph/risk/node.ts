// lib/graph/risk/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { RiskIntelligenceReportSchema } from "./schema";
import { RISK_INTELLIGENCE_SYSTEM_PROMPT } from "./prompt";
import { RiskScoringEngine, OverallRiskIndexScorer } from "./engines";
import { RiskIntelligenceReport } from "./types";

export async function riskIntelligenceAgent(state: VentureStateType) {
  console.log("--- Agent: Risk Intelligence (VC Due Diligence Specialist) ---");

  const ventureContext = state.ventureContext;
  const validatedFacts = state.validatedFacts || [];
  const marketIntel = state.marketIntel || {};
  const competitorIntel = state.competitorIntel || {};
  const swotIntel = state.swotIntel || {};
  const retrievedKnowledge = state.retrievedKnowledge || [];

  // 1. Build structured prompt for LLM evaluation
  const prompt = `
Venture Opportunity Context:
${JSON.stringify(ventureContext, null, 2)}

Validated Facts:
${JSON.stringify(validatedFacts.map(f => ({
  id: f.id,
  statement: f.statement,
  consensusValue: f.consensusValue,
  confidence: f.confidence
})), null, 2)}

Market Intelligence:
${JSON.stringify({
  marketOverview: marketIntel.marketOverview,
  tam: marketIntel.tam,
  sam: marketIntel.sam,
  som: marketIntel.som,
  marketAttractiveness: marketIntel.marketAttractiveness
}, null, 2)}

Competitor Intelligence:
${JSON.stringify({
  directCompetitors: competitorIntel.directCompetitors,
  indirectCompetitors: competitorIntel.indirectCompetitors,
  competitorProfiles: competitorIntel.competitorProfiles,
  competitiveIntensity: competitorIntel.competitiveIntensity
}, null, 2)}

SWOT Intelligence:
${JSON.stringify({
  strengths: swotIntel.strengths,
  weaknesses: swotIntel.weaknesses,
  opportunities: swotIntel.opportunities,
  threats: swotIntel.threats
}, null, 2)}

RAG Evidence Citations:
${JSON.stringify(retrievedKnowledge.slice(0, 5).map(k => ({
  id: k.documentId,
  content: k.content.substring(0, 300) + "...",
  sourceType: k.metadata.sourceType
})), null, 2)}

Based on the above facts, formulate the Risk Intelligence Report. Evaluate Market, Competition, Financial, Regulatory, Technology, Operational, Execution, and Funding Risks. Provide probability and impact for each. Recommend custom mitigation strategies.
`;

  // 2. Query LLM with structured output schema validation
  console.log("Invoking LLM for structured risk extraction...");
  
  let report: RiskIntelligenceReport;
  try {
    const structuredLlm = llm.withStructuredOutput(RiskIntelligenceReportSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: RISK_INTELLIGENCE_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    report = response as unknown as RiskIntelligenceReport;
    if (!report || !report.marketRisk || !report.competitionRisk || !report.financialRisk || !report.overallRiskIndex) {
      throw new Error("Invalid or empty risk intelligence report received from LLM");
    }
  } catch (err: any) {
    console.error("Structured LLM query failed for Risk Intelligence, falling back to heuristic parsing:", err);
    // Safety fallback report to prevent pipeline crashes
    const fallbackRisk = {
      probability: 50,
      impact: 50,
      severity: "MEDIUM" as const,
      riskScore: 25,
      reasoning: "Baseline fallback evaluation",
      indicators: ["General risk indicators"],
      mitigation: "General baseline mitigation"
    };

    report = {
      marketRisk: fallbackRisk,
      competitionRisk: fallbackRisk,
      financialRisk: fallbackRisk,
      regulatoryRisk: fallbackRisk,
      technologyRisk: fallbackRisk,
      operationalRisk: fallbackRisk,
      executionRisk: fallbackRisk,
      fundingRisk: fallbackRisk,
      overallRiskIndex: {
        score: 25,
        severity: "MEDIUM",
        reasoning: ["Baseline fallback evaluation"]
      },
      mitigationStrategies: [
        {
          riskDimension: "Financial Risk",
          description: "Capital constraints risk",
          preventiveActions: ["Careful budgeting and lean operations"],
          contingencyPlans: ["Raise bridge funding or alternative capital"]
        }
      ]
    };
  }

  // 3. Programmatic Verifications & Adjustments
  
  // A. Recalculate and normalize each risk dimension score/severity programmatically
  report.marketRisk = RiskScoringEngine.validateRisk(report.marketRisk);
  report.competitionRisk = RiskScoringEngine.validateRisk(report.competitionRisk);
  report.financialRisk = RiskScoringEngine.validateRisk(report.financialRisk);
  report.regulatoryRisk = RiskScoringEngine.validateRisk(report.regulatoryRisk);
  report.technologyRisk = RiskScoringEngine.validateRisk(report.technologyRisk);
  report.operationalRisk = RiskScoringEngine.validateRisk(report.operationalRisk);
  report.executionRisk = RiskScoringEngine.validateRisk(report.executionRisk);
  report.fundingRisk = RiskScoringEngine.validateRisk(report.fundingRisk);

  // B. Compute overall risk index programmatically
  const overallIndex = OverallRiskIndexScorer.compute(report);
  report.overallRiskIndex = overallIndex;
  
  console.log(`Programmatically verified Overall Risk Score: ${report.overallRiskIndex.score}/100 | Severity: ${report.overallRiskIndex.severity}`);

  // 4. Return state update
  return {
    riskIntel: report
  };
}
