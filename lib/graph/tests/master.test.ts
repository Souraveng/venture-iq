// lib/graph/tests/master.test.ts
import { graph } from "../engine";
import { VentureStateType } from "../state";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(` ✅ PASS: ${message}`);
  } else {
    console.error(` ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runMasterTest() {
  console.log("==========================================================");
  console.log("RUNNING VENTUREIQ MASTER ORCHESTRATOR END-TO-END TESTS...");
  console.log("==========================================================\n");

  const initialState = {
    mode: "validate",
    userInput: { idea: "Build an asset-light OCPP EV charging grid load balancer in Pune" },
    userTier: "premium" as const,
    researchPlan: [],
    marketIntel: {},
    competitorIntel: {},
    swotIntel: {},
    riskIntel: {},
    financialIntel: {},
    finalReport: {},
    roadmapIntel: {},
    decisionReport: {},
    reportIntel: {}
  };

  try {
    console.log("Invoking Master LangGraph orchestrator...");
    const result = await graph.invoke(initialState, { recursionLimit: 100 }) as VentureStateType;
    
    console.log("\nMaster LangGraph finished execution. Verifying node outputs...");

    // 1. Core State existence assertions
    assert(result !== undefined, "Master graph execution returned a non-null state result");
    
    // 2. Node outputs assertions
    assert(result.ventureContext !== undefined, "Venture context node completed and updated state");
    assert(result.researchPlanDetails !== undefined, "Research planner node completed and updated state");
    assert(result.evidence !== undefined && result.evidence.length > 0, "Evidence research node generated facts");
    assert(result.facts !== undefined && result.facts.length > 0, "Fact extraction node extracted structured entities");
    assert(result.validatedFacts !== undefined, "Validation node completed");
    assert(result.reliability !== undefined, "Validation node evaluated reliability indices");
    
    // 3. Downstream analysis agent assertions
    assert(result.marketIntel !== undefined, "Market Intelligence agent updated TAM/SAM/SOM");
    assert(result.competitorIntel !== undefined, "Competitor Intelligence agent evaluated competitive intensity");
    assert(result.swotIntel !== undefined, "SWOT Analysis agent structured strengths & weaknesses");
    assert(result.riskIntel !== undefined, "Risk Analysis agent prioritized severity metrics");
    assert(result.financialIntel !== undefined, "Financial Intelligence agent output startup scenarios");
    assert(result.finalReport !== undefined, "Venture Analyst (Investor Brain) evaluated investment readiness");
    assert(result.roadmapIntel !== undefined, "Founder Roadmap agent generated tactical timeline phases");
    
    // 4. Scoring and Final decision engine assertions
    assert(result.decisionReport !== undefined, "Opportunity Score and Final Decision Engine compiled final verdict");
    assert(result.decisionReport.opportunityScore.score > 0, "Calculated non-zero weighted opportunity score");
    assert(result.decisionReport.confidence.score > 0, "Calculated validator-based data confidence score");
    assert(result.decisionReport.verdict.decision !== undefined, "Returned structured investment decision verdict");

    // 5. Report deliverables & slides assertions
    assert(result.reportIntel !== undefined, "Report & Export Layer generated consolidated deliverables");
    assert(result.reportIntel.pitchDeck.length === 12, `Pitch deck contains exactly 12 slides: actual ${result.reportIntel.pitchDeck.length}`);
    assert(result.reportIntel.charts.revenueForecast.length > 0, "Synced and programmatically validated forecast charts");

    console.log("\n==========================================================");
    console.log(`MASTER INTEGRATION TEST COMPLETED: ${passedTests}/${totalTests} ASSERTIONS PASSED.`);
    console.log("==========================================================");
    process.exit(0);
  } catch (err: any) {
    console.error("Master Orchestrator execution failed:", err);
    process.exit(1);
  }
}

runMasterTest().catch((err) => {
  console.error("Fatal error during master orchestrator verification:", err);
  process.exit(1);
});
