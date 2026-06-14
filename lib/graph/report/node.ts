// lib/graph/report/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { VentureReportsContainerSchema } from "./schema";
import { REPORT_ENGINE_SYSTEM_PROMPT } from "./prompt";
import { ChartEngine } from "./engines";
import { VentureReportsContainer } from "./types";


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
    if (!reportIntel || !reportIntel.charts || !reportIntel.pitchDeck) {
      throw new Error("Invalid or empty venture reports container received from LLM");
    }
  } catch (err: any) {
    console.error("Structured LLM query failed for Report Engine, returning empty report:", err);
    reportIntel = {
      executiveSummary: {
        title: "Executive Summary",
        sections: {
          opportunity: ["Opportunity details not specified."],
          market: ["Market details not specified."],
          competition: ["Competition details not specified."],
          risk: ["Risk details not specified."],
          financials: ["Financial details not specified."],
          verdict: ["Verdict details not specified."]
        }
      },
      businessPlan: {
        title: "Startup Business Plan",
        sections: {
          problem: ["Problem details not specified."],
          solution: ["Solution details not specified."],
          market: ["Market details not specified."],
          businessModel: ["Business model details not specified."],
          competition: ["Competition details not specified."],
          financials: ["Financial details not specified."],
          roadmap: ["Roadmap details not specified."],
          risk: ["Risk details not specified."],
          funding: ["Funding details not specified."]
        }
      },
      investorReport: {
        title: "Investor Report",
        sections: {
          marketAnalysis: ["Market analysis details not specified."],
          tamSamSom: ["TAM SAM SOM details not specified."],
          competition: ["Competition details not specified."],
          moat: ["Moat details not specified."],
          financialViability: ["Financial viability details not specified."],
          investmentRecommendation: ["Investment recommendation details not specified."],
          redFlags: ["Red flags details not specified."]
        }
      },
      founderRoadmap: {
        title: "Founder Roadmap",
        sections: {
          plan30Day: ["30-day plan details not specified."],
          plan90Day: ["90-day plan details not specified."],
          plan1Year: ["1-year plan details not specified."],
          milestones: ["Milestones details not specified."],
          kpis: ["KPIs details not specified."],
          riskMitigation: ["Risk mitigation details not specified."]
        }
      },
      pitchDeck: [],
      opportunityAnalysis: {
        title: "Opportunity Analysis",
        overallScore: 0,
        breakdown: {
          marketOpportunityScore: 0,
          competitionScore: 0,
          financialViabilityScore: 0,
          executionFeasibilityScore: 0,
          fundingPotentialScore: 0,
          riskResilienceScore: 0
        },
        keyFindings: ["Key findings not specified."]
      },
      onePageBrief: {
        title: "One-Page Brief",
        summary: "Summary details not specified.",
        keyMetrics: [],
        recommendedActions: []
      },
      charts: {
        marketGrowth: [],
        revenueForecast: [],
        costBreakdown: [],
        riskMatrix: [],
        competitorMatrix: [],
        roadmapTimeline: []
      }
    };
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
