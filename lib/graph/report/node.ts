// lib/graph/report/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { VentureReportsContainerSchema } from "./schema";
import { REPORT_ENGINE_SYSTEM_PROMPT } from "./prompt";
import { ChartEngine } from "./engines";
import { VentureReportsContainer } from "./types";
import { MOCK_REPORTS_CONTAINER } from "./examples";

export async function reportIntelligenceAgent(state: VentureStateType) {
  console.log("--- Agent: Report Generation & Export Intelligence Layer ---");

  const ventureContext = state.ventureContext;
  const marketIntel = state.marketIntel || {};
  const competitorIntel = state.competitorIntel || {};
  const swotIntel = state.swotIntel || {};
  const riskIntel = state.riskIntel || {};
  const financialIntel = state.financialIntel || {};
  const finalReport = state.finalReport || {};
  const roadmapIntel = state.roadmapIntel || {};
  const decisionReport = state.decisionReport || {};

  // Construct context payload for the LLM report generation
  const prompt = `
Venture Context:
${JSON.stringify(ventureContext, null, 2)}

Market Intelligence (TAM/SAM/SOM):
${JSON.stringify(marketIntel, null, 2)}

Competitor Intelligence:
${JSON.stringify(competitorIntel, null, 2)}

SWOT Intelligence:
${JSON.stringify(swotIntel, null, 2)}

Risk Analysis:
${JSON.stringify(riskIntel, null, 2)}

Financial Forecasts:
${JSON.stringify(financialIntel, null, 2)}

Venture Analyst Outputs (Investor Readiness):
${JSON.stringify(finalReport, null, 2)}

Execution Roadmap:
${JSON.stringify(roadmapIntel, null, 2)}

Decision Engine Verdict & Opportunity Score:
${JSON.stringify(decisionReport, null, 2)}

Generate the complete portfolio of 7 deliverables and the corresponding chart datasets using the specified structure. Keep in mind the strict ₹2 Lakhs initial validation budget limit, Ather/Tata Power competition, and Pune context.
`;

  console.log("Invoking structured LLM for report generation...");
  let reportIntel: VentureReportsContainer;

  try {
    const structuredLlm = llm.withStructuredOutput(VentureReportsContainerSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: REPORT_ENGINE_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    reportIntel = response as unknown as VentureReportsContainer;
  } catch (err: any) {
    console.error("Structured LLM query failed for Report Engine, falling back to mock examples:", err);
    reportIntel = JSON.parse(JSON.stringify(MOCK_REPORTS_CONTAINER));
  }

  // Enforce programmatic chart validations & syncing with actual financial and market details
  console.log("Syncing generated charts with actual financial and market data...");
  reportIntel.charts = ChartEngine.validateAndSync(
    reportIntel.charts,
    financialIntel,
    marketIntel
  );

  // Return state updates
  return {
    reportIntel
  };
}
