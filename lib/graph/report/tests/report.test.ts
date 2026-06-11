// lib/graph/report/tests/report.test.ts
import { ChartEngine } from "../engines";
import { VentureReportsContainerSchema } from "../schema";
import { reportIntelligenceAgent } from "../node";
import { VentureStateType } from "../../state";
import { MOCK_REPORTS_CONTAINER } from "../examples";
import { ChartCollection } from "../types";

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

async function runTests() {
  console.log("==========================================================");
  console.log("RUNNING VENTUREIQ REPORT GENERATION INTELLIGENCE TESTS...");
  console.log("==========================================================\n");

  // --- TEST 1: ChartEngine.validateAndSync ---
  console.log("--- 1. Testing ChartEngine.validateAndSync ---");
  try {
    const mockCharts: ChartCollection = {
      marketGrowth: [],
      revenueForecast: [],
      costBreakdown: [],
      riskMatrix: [],
      competitorMatrix: [],
      roadmapTimeline: []
    };

    const mockFinancialIntel = {
      revenueForecast: {
        revenueProjections: [
          { arr: "$150,000" },
          { arr: "$400,000" },
          { arr: "$1,200,000" }
        ]
      },
      startupCosts: {
        scenarios: {
          expected: [
            { item: "Embedded Firmware Dev", amount: "70000" },
            { item: "Pilot Hardware Deployment", amount: "50000" },
            { item: "SaaS Platform Hosting", amount: "20000" }
          ]
        }
      }
    };

    const mockMarketIntel = {};

    const synced = ChartEngine.validateAndSync(mockCharts, mockFinancialIntel, mockMarketIntel);

    assert(synced.revenueForecast.length === 3, "Revenue forecast charts generated with correct size");
    assert(synced.revenueForecast[0].value === 150000, `First year revenue synced: expected 150000, got ${synced.revenueForecast[0].value}`);
    assert(synced.revenueForecast[2].value === 1200000, `Third year revenue synced: expected 1200000, got ${synced.revenueForecast[2].value}`);

    assert(synced.costBreakdown.length === 3, "Cost breakdown charts generated with correct size");
    assert(synced.costBreakdown[0].label === "Embedded Firmware Dev", "Cost labels synced successfully");
    assert(synced.costBreakdown[0].value === 70000, `First cost synced: expected 70000, got ${synced.costBreakdown[0].value}`);
  } catch (err: any) {
    console.error("ChartEngine.validateAndSync test failed:", err);
  }

  // --- TEST 2: Zod Schema & Mock Container Compliance ---
  console.log("\n--- 2. Testing Zod Schema & Slide Constraints ---");
  try {
    const parseResult = VentureReportsContainerSchema.safeParse(MOCK_REPORTS_CONTAINER);
    assert(parseResult.success === true, "Mock reports container complies with Zod schema validation");
    
    if (parseResult.success) {
      const parsed = parseResult.data;
      assert(parsed.pitchDeck.length === 12, `Pitch deck contains exactly 12 slides: actual ${parsed.pitchDeck.length}`);
      
      // Check slide structure
      const slide1 = parsed.pitchDeck[0];
      assert(slide1.slideNumber === 1, "First slide is slide number 1");
      assert(slide1.title.toLowerCase().includes("cover") || slide1.headline.toLowerCase().includes("electrification") || slide1.headline.toLowerCase().includes("fleet"), "First slide contains correct cover/title markers");

      const slide12 = parsed.pitchDeck[11];
      assert(slide12.slideNumber === 12, "Last slide is slide number 12");
    }
  } catch (err: any) {
    console.error("Schema and Slide Constraints test failed:", err);
  }

  // --- TEST 3: LangGraph Node execution ---
  console.log("\n--- 3. Testing LangGraph Node (reportIntelligenceAgent) ---");
  try {
    const mockState: Partial<VentureStateType> = {
      userInput: { idea: "Build EV charging load balancer in Pune" },
      ventureContext: {
        intent: "VALIDATE_IDEA",
        goal: "Build EV charging load balancer in Pune",
        secondary_goals: [],
        resources: [],
        skills: [],
        constraints: [],
        existing_business: { description: "none", industry: "none", years_active: "none" },
        startup_idea: { description: "EV charging load balancer", target_audience: "none", value_proposition: "none" },
        location: { country: "India", state: "Maharashtra", district: "Pune", city: "Pune", village: "", region: "", location_status: "AVAILABLE" },
        financial_context: { budget: "200000", available_capital: "", revenue: "", profit: "", funding_stage: "" },
        timeline: "Immediate",
        critical_missing_information: [],
        confidence: {
          intent: "HIGH",
          goal: "HIGH",
          resources: "HIGH",
          skills: "HIGH",
          constraints: "HIGH",
          location: "HIGH",
          financial_context: "HIGH",
          timeline: "HIGH",
          existing_business: "HIGH",
          startup_idea: "HIGH"
        },
        reasoning: "Pune EV charging network context"
      },
      marketIntel: {
        tam: "₹1,500 Crore",
        sam: "₹180 Crore",
        som: "₹4.2 Crore"
      },
      financialIntel: {
        revenueForecast: {
          revenueProjections: [
            { arr: "$142,000" },
            { arr: "$450,000" },
            { arr: "$1,420,000" }
          ]
        },
        startupCosts: {
          scenarios: {
            expected: [
              { item: "Embedded Firmware Dev", amount: "80000" }
            ]
          }
        }
      },
      competitorIntel: {},
      swotIntel: {},
      riskIntel: {},
      finalReport: {},
      roadmapIntel: {},
      decisionReport: {}
    };

    const outputStateUpdate = await reportIntelligenceAgent(mockState as VentureStateType);
    assert(outputStateUpdate !== undefined, "Report agent node executes without error");
    assert(outputStateUpdate.reportIntel !== undefined, "Node returns reportIntel updates");
    assert(outputStateUpdate.reportIntel.pitchDeck.length === 12, `Generated pitch deck contains exactly 12 slides: actual ${outputStateUpdate.reportIntel.pitchDeck.length}`);
    assert(outputStateUpdate.reportIntel.charts.revenueForecast[0].value === 142000, `Synced first year revenue correctly: expected 142000, got ${outputStateUpdate.reportIntel.charts.revenueForecast[0].value}`);
  } catch (err: any) {
    console.error("LangGraph Node test failed:", err);
  }

  console.log("\n==========================================================");
  console.log(`TEST EXECUTION COMPLETED: ${passedTests}/${totalTests} ASSERTIONS PASSED.`);
  console.log("==========================================================");
  
  if (passedTests !== totalTests) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution aborted with fatal error:", err);
  process.exit(1);
});
