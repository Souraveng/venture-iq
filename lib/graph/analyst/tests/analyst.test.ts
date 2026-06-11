// lib/graph/analyst/tests/analyst.test.ts
import { ReadinessEngine, InvestmentScoringEngine } from "../engines";
import { VentureAnalystReportSchema } from "../schema";
import { ventureAnalystAgent } from "../node";
import { VentureStateType } from "../../state";
import { MOCK_ANALYST_REPORT } from "../examples";

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
  console.log("RUNNING VENTUREIQ VENTURE ANALYST INTELLIGENCE TESTS...");
  console.log("==========================================================\n");

  // --- TEST 1: Readiness Engine ---
  console.log("--- 1. Testing ReadinessEngine ---");
  try {
    const readinessInput = {
      customerValidationScore: 80,
      marketValidationScore: 90,
      financialReadinessScore: 70,
      executionReadinessScore: 75,
      fundraisingReadinessScore: 65,
      score: 0, // to be calculated
      reasoning: "Test readiness details"
    };

    const computed = ReadinessEngine.compute(readinessInput);
    // Average: (80 + 90 + 70 + 75 + 65) / 5 = 380 / 5 = 76
    assert(computed.score === 76, "Averages the 5 readiness dimensions programmatically");
  } catch (err: any) {
    console.error("ReadinessEngine test failed:", err);
  }

  // --- TEST 2: Investment Scoring Engine Overrides ---
  console.log("\n--- 2. Testing InvestmentScoringEngine Overrides ---");
  try {
    const mockReport = JSON.parse(JSON.stringify(MOCK_ANALYST_REPORT));
    mockReport.investmentRecommendation.decision = "STRONG YES";
    mockReport.investmentRecommendation.confidence = 90;

    // A. Test override when risk is CRITICAL
    const overrideCritical = InvestmentScoringEngine.validateDecision(mockReport, "CRITICAL");
    assert(overrideCritical.decision === "MAYBE", "Downgrades decision to MAYBE if risk severity is CRITICAL");
    assert(overrideCritical.reasoning[0].includes("downgraded to MAYBE due to CRITICAL level risks"), "Inserts override explanation into reasoning");

    // B. Test override when red flags >= 4
    const mockReportManyFlags = JSON.parse(JSON.stringify(MOCK_ANALYST_REPORT));
    mockReportManyFlags.redFlags = ["flag 1", "flag 2", "flag 3", "flag 4"];
    mockReportManyFlags.investmentRecommendation.decision = "STRONG YES";
    mockReportManyFlags.investmentRecommendation.confidence = 90;

    const overrideFlags = InvestmentScoringEngine.validateDecision(mockReportManyFlags, "MEDIUM");
    assert(overrideFlags.decision === "YES", "Downgrades STRONG YES to YES if red flag count is high");
    assert(overrideFlags.confidence === 65, "Caps confidence at 65% if red flag count is high");
  } catch (err: any) {
    console.error("InvestmentScoringEngine test failed:", err);
  }

  // --- TEST 3: Zod Schema Compliance ---
  console.log("\n--- 3. Testing Schema Validation ---");
  try {
    const parseResult = VentureAnalystReportSchema.safeParse(MOCK_ANALYST_REPORT);
    assert(parseResult.success === true, "Mock analyst report complies with Zod schema validation");
  } catch (err: any) {
    console.error("Zod schema validation test failed:", err);
  }

  // --- TEST 4: LangGraph Node Integration ---
  console.log("\n--- 4. Testing LangGraph Node (ventureAnalystAgent) ---");
  try {
    const mockState: Partial<VentureStateType> = {
      userInput: { idea: "Build an EV charging startup in India" },
      ventureContext: {
        intent: "VALIDATE_IDEA",
        goal: "Build an EV charging startup in India",
        secondary_goals: [],
        resources: [],
        skills: [],
        constraints: [],
        existing_business: { description: "none", industry: "none", years_active: "none" },
        startup_idea: { description: "EV charging network", target_audience: "none", value_proposition: "none" },
        location: { country: "India", state: "", district: "", city: "", village: "", region: "", location_status: "AVAILABLE" },
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
        reasoning: "Mock research context"
      },
      validatedFacts: [
        {
          id: "fact_1",
          statement: "EV subscription ACV is $1,200",
          consensusValue: "1200",
          confidence: "HIGH",
          credibilityScore: 85,
          agreementScore: 90,
          supportingSources: ["ev_1"],
          conflictingSources: []
        }
      ],
      marketIntel: {
        swot: {
          strengths: ["S1"],
          weaknesses: ["W1"],
          opportunities: ["O1"],
          threats: ["T1"]
        }
      },
      financialIntel: {
        projection: "Financial model loaded."
      }
    };

    const outputStateUpdate = await ventureAnalystAgent(mockState as VentureStateType);
    assert(outputStateUpdate !== undefined, "Node executes without error");
    assert(outputStateUpdate.finalReport !== undefined, "Node returns finalReport updates");
    assert(outputStateUpdate.finalReport.verdict !== undefined, "Report contains backward-compatible verdict field");
    assert(outputStateUpdate.finalReport.readinessScore !== undefined, "Report contains backward-compatible readinessScore field");
    assert(outputStateUpdate.finalReport.redFlags !== undefined, "Report contains redFlags array");
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
