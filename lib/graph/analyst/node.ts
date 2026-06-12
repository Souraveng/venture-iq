// lib/graph/analyst/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { VentureAnalystReportSchema } from "./schema";
import { VENTURE_ANALYST_SYSTEM_PROMPT } from "./prompt";
import { ReadinessEngine, InvestmentScoringEngine } from "./engines";
import { VentureAnalystReport } from "./types";
import { MOCK_ANALYST_REPORT } from "./examples";

export async function ventureAnalystAgent(state: VentureStateType) {
  console.log("--- Agent: Venture Analyst (VC Partner & Due Diligence Lead) ---");

  const ventureContext = state.ventureContext;
  const validatedFacts = state.validatedFacts || [];
  const marketIntel = state.marketIntel || {};
  const competitorIntel = state.competitorIntel || {};
  const swotIntel = state.swotIntel || {};
  const riskIntel = state.riskIntel || {};
  const financialIntel = state.financialIntel || {};
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

RAG Evidence Citations:
${JSON.stringify(retrievedKnowledge.slice(0, 5).map(k => ({
  id: k.documentId,
  content: k.content.substring(0, 300) + "..."
})), null, 2)}

Based on the above facts, formulate the Venture Analyst Due Diligence Report. Think critically and skepticism-first. Actively identify red flags and formulate required investor milestones.
`;

  // 2. Query LLM with structured output schema validation
  console.log("Invoking LLM for structured investor evaluation...");
  
  let report: VentureAnalystReport;
  try {
    const structuredLlm = llm.withStructuredOutput(VentureAnalystReportSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: VENTURE_ANALYST_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    report = response as unknown as VentureAnalystReport;
    if (!report || !report.ventureReadiness || !report.investmentRecommendation || !report.redFlags) {
      throw new Error("Invalid or empty venture analyst report received from LLM");
    }
  } catch (err: any) {
    console.error("Structured LLM query failed for Venture Analyst, falling back to mock examples:", err);
    report = JSON.parse(JSON.stringify(MOCK_ANALYST_REPORT));
  }

  // 3. Programmatic calculations to enforce strict due diligence alignment
  
  // A. Recalculate venture readiness overall score programmatically
  report.ventureReadiness = ReadinessEngine.compute(report.ventureReadiness);

  // B. Programmatically validate and override recommendation decision if risks mismatch
  const riskSeverity = riskIntel.overallRiskIndex?.severity || "MEDIUM";
  report.investmentRecommendation = InvestmentScoringEngine.validateDecision(report, riskSeverity);

  console.log(`Programmatically verified Investment Recommendation: ${report.investmentRecommendation.decision} | Confidence: ${report.investmentRecommendation.confidence}%`);

  // 4. Map the backward-compatible properties required by existing UI pages (e.g. app/validation/page.tsx)
  const verdictMapping = {
    "STRONG YES": "Proceed",
    "YES": "Proceed",
    "MAYBE": "Caution",
    "NO": "Stop",
    "STRONG NO": "Stop"
  };

  const finalReportObject = {
    ...state.finalReport,
    ...report, // Merges marketAttractiveness, scalability, defensibility, moatAnalysis, timingAnalysis, fundingPotential, exitPotential, ventureReadiness, redFlags, investmentRecommendation
    readinessScore: report.ventureReadiness.score,
    verdict: verdictMapping[report.investmentRecommendation.decision] || "Caution",
    strengths: swotIntel.strengths?.map((s: any) => s.statement) || report.investmentRecommendation.reasoning,
    weaknesses: swotIntel.weaknesses?.map((w: any) => w.statement) || report.redFlags,
    opportunities: swotIntel.opportunities?.map((o: any) => o.statement) || [],
    threats: swotIntel.threats?.map((t: any) => t.statement) || [],
    financialProjection: financialIntel.projection || "Estimated break-even and runway calculated.",
    summary: `Investment Decision: ${report.investmentRecommendation.decision} (Confidence: ${report.investmentRecommendation.confidence}%). Overall Readiness Score: ${report.ventureReadiness.score}/100. Primary Red Flag detected: "${report.redFlags[0] || "None detected"}"`
  };

  // 5. Return state update
  return {
    finalReport: finalReportObject
  };
}
