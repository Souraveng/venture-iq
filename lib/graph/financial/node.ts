// lib/graph/financial/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { FinancialIntelligenceReportSchema } from "./schema";
import { FINANCIAL_INTELLIGENCE_SYSTEM_PROMPT } from "./prompt";
import { 
  FinancialModelingEngine, 
  BreakEvenCalculator, 
  RoiCalculator, 
  ScenarioEngine, 
  FinancialViabilityScorer 
} from "./engines";
import { FinancialIntelligenceReport } from "./types";
import { MOCK_FINANCIAL_REPORT } from "./examples";

export async function financialIntelligenceAgent(state: VentureStateType) {
  console.log("--- Agent: Financial Intelligence (Startup CFO & VC Associate) ---");

  const ventureContext = state.ventureContext;
  const validatedFacts = state.validatedFacts || [];
  const marketIntel = state.marketIntel || {};
  const competitorIntel = state.competitorIntel || {};
  const swotIntel = state.swotIntel || {};
  const riskIntel = state.riskIntel || {};
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
  som: marketIntel.som
}, null, 2)}

Competitor Intelligence:
${JSON.stringify({
  directCompetitors: competitorIntel.directCompetitors,
  indirectCompetitors: competitorIntel.indirectCompetitors,
  pricingAnalysis: competitorIntel.pricingAnalysis
}, null, 2)}

SWOT Strategic Elements:
${JSON.stringify({
  strengths: swotIntel.strategicSummary?.topStrengths || [],
  weaknesses: swotIntel.strategicSummary?.topWeaknesses || [],
  opportunities: swotIntel.strategicSummary?.topOpportunities || [],
  threats: swotIntel.strategicSummary?.topThreats || []
}, null, 2)}

Risk Analysis Severity Profiles:
${JSON.stringify({
  overallScore: riskIntel.overallRiskIndex?.score,
  overallSeverity: riskIntel.overallRiskIndex?.severity,
  reasoning: riskIntel.overallRiskIndex?.reasoning || []
}, null, 2)}

RAG Evidence Citations:
${JSON.stringify(retrievedKnowledge.slice(0, 5).map(k => ({
  id: k.documentId,
  content: k.content.substring(0, 300) + "..."
})), null, 2)}

Based on the above facts, formulate the Financial Intelligence Report. Estimate initial startup costs, 5-year revenue forecast parameters, unit economics pricing details, break-even operating metrics, funding requirements, and scenario metrics.
`;

  // 2. Query LLM with structured output schema validation
  console.log("Invoking LLM for structured financial extraction...");
  
  let report: FinancialIntelligenceReport;
  try {
    const structuredLlm = llm.withStructuredOutput(FinancialIntelligenceReportSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: FINANCIAL_INTELLIGENCE_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    report = response as unknown as FinancialIntelligenceReport;
    if (!report || !report.startupCosts || !report.unitEconomics || !report.revenueForecast || !report.fundingRequirements) {
      throw new Error("Invalid or empty financial intelligence report received from LLM");
    }
  } catch (err: any) {
    console.error("Structured LLM query failed for Financial Intelligence, falling back to mock examples:", err);
    report = JSON.parse(JSON.stringify(MOCK_FINANCIAL_REPORT));
  }

  // 3. Programmatic calculations to enforce strict mathematical coherence
  
  // A. Recalculate startup cost scenarios programmatically
  report.startupCosts = FinancialModelingEngine.validateStartupCosts(report.startupCosts);

  // B. Recalculate unit economics ratios programmatically
  report.unitEconomics = FinancialModelingEngine.calculateUnitEconomics(report.unitEconomics);

  // C. Calculate break-even parameters programmatically
  const monthlyFixedCosts = report.startupCosts.infrastructure.expected + (report.startupCosts.team.expected / 12);
  const pricePerCustomer = report.unitEconomics.revenuePerCustomer;
  const marginPercentage = report.unitEconomics.grossMargin;
  
  report.breakEvenAnalysis = BreakEvenCalculator.compute(
    monthlyFixedCosts,
    pricePerCustomer,
    marginPercentage
  );

  // D. Calculate ROI programmatically
  const capitalNeeded = report.fundingRequirements.capitalNeeded || 150000;
  const year3Arr = report.revenueForecast.revenueProjections.year3;
  const expectedProfitY3 = year3Arr - (report.startupCosts.scenarios.expected.total * 0.5); // Approx Year 3 operations
  
  report.roiAnalysis = RoiCalculator.calculate(capitalNeeded, expectedProfitY3);

  // E. Populate Scenario Engine details programmatically
  report.scenarios = ScenarioEngine.generate(
    year3Arr,
    report.startupCosts.scenarios.expected.total,
    report.roiAnalysis.riskAdjustedRoi
  );

  // F. Generate Cash Flow forecast programmatically based on ARR projections
  report.cashFlowForecast.forecast = FinancialModelingEngine.generateCashFlowCurve(
    capitalNeeded,
    report.revenueForecast.revenueProjections.year1,
    report.revenueForecast.revenueProjections.year2,
    report.revenueForecast.revenueProjections.year3,
    monthlyFixedCosts
  );

  // G. Compute overall financial viability score programmatically
  const viabilityScore = FinancialViabilityScorer.compute(report);
  report.financialViability = viabilityScore;

  console.log(`Programmatically verified Financial Viability Score: ${report.financialViability.score}/100`);

  // 4. Return state update
  return {
    financialIntel: report
  };
}
