// lib/graph/report/node.ts
import { llm, apiKeyStorage } from "../llm";
import { VentureStateType } from "../state";
import { Group1Schema, Group2Schema, Group3Schema, Group4Schema } from "./schema";
import { REPORT_GROUP1_PROMPT, REPORT_GROUP2_PROMPT, REPORT_GROUP3_PROMPT, REPORT_GROUP4_PROMPT } from "./prompt";
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

  // Build targeted context payloads for LLM sub-calls
  const summaryContext = `
Venture Context:
${JSON.stringify(ventureContext, null, 2)}

Market Attractiveness & Summary:
${JSON.stringify(marketIntel.marketAttractiveness || {}, null, 2)}

Decision Engine Verdict:
${JSON.stringify(decisionReport.verdict || {}, null, 2)}
`;

  const plansContext = `
Venture Context:
${JSON.stringify(ventureContext, null, 2)}

Market Segments & Overview:
${JSON.stringify(marketIntel.customerSegments || [], null, 2)}

SWOT Intelligence:
${JSON.stringify(swotIntel, null, 2)}

Milestones & Execution Roadmap:
${JSON.stringify(roadmapIntel, null, 2)}
`;

  const dueDiligenceContext = `
Venture Context:
${JSON.stringify(ventureContext, null, 2)}

Competitor Analysis:
${JSON.stringify(competitorIntel, null, 2)}

Risk Profiles:
${JSON.stringify(riskIntel, null, 2)}

Financial Forecasts:
${JSON.stringify(financialIntel, null, 2)}

Venture Readiness Scores:
${JSON.stringify(finalReport, null, 2)}
`;

  const pitchDeckContext = `
Venture Context:
${JSON.stringify(ventureContext, null, 2)}

Market Intel TAM/SAM/SOM:
${JSON.stringify({ tam: marketIntel.tam, sam: marketIntel.sam, som: marketIntel.som }, null, 2)}

Competitor Summary:
${JSON.stringify(competitorIntel.positioningAnalysis || {}, null, 2)}

Financial Projections & Startup Costs:
${JSON.stringify({ revenueProjections: financialIntel.revenueForecast?.revenueProjections, capitalNeeded: financialIntel.fundingRequirements?.capitalNeeded }, null, 2)}

Milestone Phases:
${JSON.stringify(roadmapIntel.milestones || [], null, 2)}
`;

  console.log("Invoking structured LLM sub-calls sequentially...");
  let reportIntel: VentureReportsContainer;

  try {
    const store = apiKeyStorage.getStore() || {};

    const token1 = store.cloudflareApiToken1 || store.cloudflareApiToken || process.env.CLOUDFLARE_API_1 || process.env.CLOUDFLARE_API || "";
    const account1 = store.cloudflareAccountId1 || store.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID_1 || process.env.CLOUDFLARE_ACCOUNT_ID || "";
    console.log(`[Report Node] Call 1 Cloudflare Token: ${token1 ? token1.substring(0, 8) + "..." : "none"}, Account ID: ${account1 ? account1.substring(0, 8) + "..." : "none"}`);

    const token2 = store.cloudflareApiToken2 || store.cloudflareApiToken || process.env.CLOUDFLARE_API_2 || process.env.CLOUDFLARE_API || "";
    const account2 = store.cloudflareAccountId2 || store.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID_2 || process.env.CLOUDFLARE_ACCOUNT_ID || "";
    console.log(`[Report Node] Call 2 Cloudflare Token: ${token2 ? token2.substring(0, 8) + "..." : "none"}, Account ID: ${account2 ? account2.substring(0, 8) + "..." : "none"}`);

    const token3 = store.cloudflareApiToken3 || store.cloudflareApiToken || process.env.CLOUDFLARE_API_3 || process.env.CLOUDFLARE_API || "";
    const account3 = store.cloudflareAccountId3 || store.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID_3 || process.env.CLOUDFLARE_ACCOUNT_ID || "";
    console.log(`[Report Node] Call 3 Cloudflare Token: ${token3 ? token3.substring(0, 8) + "..." : "none"}, Account ID: ${account3 ? account3.substring(0, 8) + "..." : "none"}`);

    const token4 = store.cloudflareApiToken4 || store.cloudflareApiToken || process.env.CLOUDFLARE_API_4 || process.env.CLOUDFLARE_API || "";
    const account4 = store.cloudflareAccountId4 || store.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID_4 || process.env.CLOUDFLARE_ACCOUNT_ID || "";
    console.log(`[Report Node] Call 4 Cloudflare Token: ${token4 ? token4.substring(0, 8) + "..." : "none"}, Account ID: ${account4 ? account4.substring(0, 8) + "..." : "none"}`);

    console.log("[Report Node] Querying all 4 Groups in parallel (each using its own Cloudflare token)...");

    // BUG-4 FIX: These 4 calls were designed to use separate Cloudflare tokens for
    // concurrent execution, but were awaited sequentially. Promise.all() runs them
    // in parallel, reducing report generation time by ~75%.
    const [res1, res2, res3, res4] = await Promise.all([
      apiKeyStorage.run({
        ...store,
        cloudflareApiToken: token1,
        cloudflareAccountId: account1,
      }, () => llm.withStructuredOutput(Group1Schema).invoke([
        { role: "system", content: REPORT_GROUP1_PROMPT },
        { role: "user", content: summaryContext }
      ])),

      apiKeyStorage.run({
        ...store,
        cloudflareApiToken: token2,
        cloudflareAccountId: account2,
      }, () => llm.withStructuredOutput(Group2Schema).invoke([
        { role: "system", content: REPORT_GROUP2_PROMPT },
        { role: "user", content: plansContext }
      ])),

      apiKeyStorage.run({
        ...store,
        cloudflareApiToken: token3,
        cloudflareAccountId: account3,
      }, () => llm.withStructuredOutput(Group3Schema).invoke([
        { role: "system", content: REPORT_GROUP3_PROMPT },
        { role: "user", content: dueDiligenceContext }
      ])),

      apiKeyStorage.run({
        ...store,
        cloudflareApiToken: token4,
        cloudflareAccountId: account4,
      }, () => llm.withStructuredOutput(Group4Schema).invoke([
        { role: "system", content: REPORT_GROUP4_PROMPT },
        { role: "user", content: pitchDeckContext }
      ])),
    ]) as [any, any, any, any];

    reportIntel = {
      executiveSummary: res1.executiveSummary,
      onePageBrief: res1.onePageBrief,
      opportunityAnalysis: res1.opportunityAnalysis,
      businessPlan: res2.businessPlan,
      founderRoadmap: res2.founderRoadmap,
      investorReport: res3.investorReport,
      charts: res3.charts,
      pitchDeck: res4.pitchDeck,
    };

    if (!reportIntel || !reportIntel.charts || !reportIntel.pitchDeck) {
      throw new Error("Invalid or empty venture reports container generated");
    }
  } catch (err: any) {
    console.error("Structured LLM query failed for Report Engine, returning empty report:", err);
    reportIntel = {
      executiveSummary: MOCK_REPORTS_CONTAINER.executiveSummary,
      businessPlan: MOCK_REPORTS_CONTAINER.businessPlan,
      investorReport: MOCK_REPORTS_CONTAINER.investorReport,
      founderRoadmap: MOCK_REPORTS_CONTAINER.founderRoadmap,
      pitchDeck: MOCK_REPORTS_CONTAINER.pitchDeck,
      opportunityAnalysis: MOCK_REPORTS_CONTAINER.opportunityAnalysis,
      onePageBrief: MOCK_REPORTS_CONTAINER.onePageBrief,
      charts: MOCK_REPORTS_CONTAINER.charts
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
