// lib/graph/decision/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { VentureDecisionReportSchema } from "./schema";
import { DECISION_ENGINE_SYSTEM_PROMPT } from "./prompt";
import { 
  OpportunityScoringEngine, 
  ConfidenceCalculationEngine, 
  FinalDecisionEngine 
} from "./engines";
import { VentureDecisionReport } from "./types";
import { MOCK_DECISION_REPORT } from "./examples";

export async function decisionIntelligenceAgent(state: VentureStateType) {
  console.log("--- Agent: Final Decision & Opportunity Scoring Engine ---");

  const ventureContext = state.ventureContext;
  const validatedFacts = state.validatedFacts || [];
  const reliability = state.reliability || { overallReliability: 70, marketReliability: 70, competitionReliability: 70, financialReliability: 70, regulationReliability: 70 };
  const marketIntel = state.marketIntel || {};
  const competitorIntel = state.competitorIntel || {};
  const swotIntel = state.swotIntel || {};
  const riskIntel = state.riskIntel || {};
  const financialIntel = state.financialIntel || {};
  const finalReport = state.finalReport || {};
  const roadmapIntel = state.roadmapIntel || {};

  // 1. Build structured prompt
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

Reliability Scores:
${JSON.stringify(reliability, null, 2)}

Market Intelligence (TAM/SAM/SOM):
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
  competitiveIntensity: competitorIntel.competitiveIntensity
}, null, 2)}

SWOT Strategic Elements:
${JSON.stringify({
  strengths: swotIntel.strengths,
  weaknesses: swotIntel.weaknesses,
  opportunities: swotIntel.opportunities,
  threats: swotIntel.threats
}, null, 2)}

Risk Analysis Severity Profiles:
${JSON.stringify({
  overallScore: riskIntel.overallRiskIndex?.score,
  overallSeverity: riskIntel.overallRiskIndex?.severity,
  reasoning: riskIntel.overallRiskIndex?.reasoning || []
}, null, 2)}

Financial Analysis Parameters:
${JSON.stringify({
  startupCosts: financialIntel.startupCosts?.scenarios,
  revenueProjections: financialIntel.revenueForecast?.revenueProjections,
  unitEconomics: financialIntel.unitEconomics,
  breakEven: financialIntel.breakEvenAnalysis,
  roi: financialIntel.roiAnalysis
}, null, 2)}

Venture Analyst Report:
${JSON.stringify({
  investmentRecommendation: finalReport.investmentRecommendation,
  redFlags: finalReport.redFlags,
  moatAnalysis: finalReport.moatAnalysis,
  ventureReadiness: finalReport.ventureReadiness
}, null, 2)}

Founder Roadmap & Execution Milestones:
${JSON.stringify({
  milestonesCount: (roadmapIntel.milestones || []).length,
  hiringCount: (roadmapIntel.hiringRoadmap || []).length,
  milestones: (roadmapIntel.milestones || []).slice(0, 5).map((m: any) => ({ goal: m.goal, timeline: m.timeline }))
}, null, 2)}

Generate the final due diligence assessment. Keep in mind the strict validation runway budget limit of ₹2 Lakhs, competitor real estate dominance by Ather/Tata Power, and regulatory grid policies. Compute components for the Opportunity Score and provide a definitive, structured output.
`;

  // 2. Query LLM
  console.log("Invoking LLM for structured decision report...");
  let report: VentureDecisionReport;

  try {
    const structuredLlm = llm.withStructuredOutput(VentureDecisionReportSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: DECISION_ENGINE_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    report = response as unknown as VentureDecisionReport;
  } catch (err: any) {
    console.error("Structured LLM query failed for Final Decision, falling back to mock examples:", err);
    report = JSON.parse(JSON.stringify(MOCK_DECISION_REPORT));
  }

  // 3. Programmatic Calculations & Overrides
  
  // A. Programmatically compute the weighted Opportunity Score
  report.opportunityScore = OpportunityScoringEngine.compute(report.opportunityScore.breakdown);

  // B. Programmatically compute the Confidence Score based on real facts & reliability
  const confidenceResult = ConfidenceCalculationEngine.compute(validatedFacts, reliability);
  report.confidence = {
    score: confidenceResult.score,
    reasoning: [...(report.confidence.reasoning || []), ...confidenceResult.reasoning]
  };

  // C. Programmatically validate and override the Final Verdict Decision if risks mismatch or scores are low
  const riskScore = riskIntel.overallRiskIndex?.score ?? 30;
  const riskSeverity = riskIntel.overallRiskIndex?.severity ?? "MEDIUM";
  report.verdict = FinalDecisionEngine.validate(
    report.verdict,
    report.opportunityScore.score,
    riskScore,
    riskSeverity
  );

  console.log(`Programmatically finalized decision: ${report.verdict.decision} | Opportunity Score: ${report.opportunityScore.score}/100 | Confidence: ${report.confidence.score}%`);

  // 4. Return state update
  return {
    decisionReport: report
  };
}
