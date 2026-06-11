// lib/graph/roadmap/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { FounderRoadmapReportSchema } from "./schema";
import { FOUNDER_ROADMAP_SYSTEM_PROMPT } from "./prompt";
import { MilestoneDependencyEngine, TimelineAlignmentEngine } from "./engines";
import { FounderRoadmapReport } from "./types";
import { MOCK_ROADMAP_REPORT } from "./examples";

export async function roadmapIntelligenceAgent(state: VentureStateType) {
  console.log("--- Agent: Founder Roadmap & Execution Intelligence ---");

  const ventureContext = state.ventureContext;
  const validatedFacts = state.validatedFacts || [];
  const marketIntel = state.marketIntel || {};
  const competitorIntel = state.competitorIntel || {};
  const swotIntel = state.swotIntel || {};
  const riskIntel = state.riskIntel || {};
  const financialIntel = state.financialIntel || {};
  const finalReport = state.finalReport || {};

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

Venture Analyst / VC Investor Report:
${JSON.stringify({
  investmentRecommendation: finalReport.investmentRecommendation,
  redFlags: finalReport.redFlags,
  moatAnalysis: finalReport.moatAnalysis,
  ventureReadiness: finalReport.ventureReadiness
}, null, 2)}

Based on the above intelligence inputs, formulate the Founder Roadmap & Execution Report. Emphasize validation first, address red flags directly in validation experiments, stay strictly within the budget limit of ₹2 Lakhs for the initial validation stage, and prioritize hiring sequence. Ensure milestones have dependencies.
`;

  // 2. Query LLM
  console.log("Invoking LLM for structured roadmap generation...");
  let report: FounderRoadmapReport;

  try {
    const structuredLlm = llm.withStructuredOutput(FounderRoadmapReportSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: FOUNDER_ROADMAP_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    report = response as unknown as FounderRoadmapReport;
  } catch (err: any) {
    console.error("Structured LLM query failed for Founder Roadmap, falling back to mock examples:", err);
    report = JSON.parse(JSON.stringify(MOCK_ROADMAP_REPORT));
  }

  // 3. Programmatic Engines
  // A. Sort milestones topologically and clean circular dependencies
  report.milestones = MilestoneDependencyEngine.sortAndClean(report.milestones);

  // B. Align timelines to respect dependencies
  report.milestones = TimelineAlignmentEngine.align(report.milestones);

  console.log(`Programmatically verified and sorted ${report.milestones.length} milestones topologically.`);

  // 4. Return state update
  return {
    roadmapIntel: report
  };
}
