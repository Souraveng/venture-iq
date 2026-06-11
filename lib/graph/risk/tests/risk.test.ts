// lib/graph/risk/tests/risk.test.ts
import { RiskScoringEngine, OverallRiskIndexScorer } from "../engines";
import { RiskIntelligenceReportSchema } from "../schema";
import { riskIntelligenceAgent } from "../node";
import { VentureStateType } from "../../state";

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
  console.log("RUNNING VENTUREIQ RISK INTELLIGENCE LAYER TESTS...");
  console.log("==========================================================\n");

  // --- TEST 1: Risk Scoring Engine ---
  console.log("--- 1. Testing RiskScoringEngine ---");
  try {
    assert(RiskScoringEngine.mapScoreToSeverity(90) === "CRITICAL", "90 maps to CRITICAL");
    assert(RiskScoringEngine.mapScoreToSeverity(60) === "HIGH", "60 maps to HIGH");
    assert(RiskScoringEngine.mapScoreToSeverity(40) === "MEDIUM", "40 maps to MEDIUM");
    assert(RiskScoringEngine.mapScoreToSeverity(10) === "LOW", "10 maps to LOW");

    const details = {
      probability: 80,
      impact: 90,
      severity: "LOW" as const, // will be overwritten
      riskScore: 0,            // will be overwritten
      reasoning: "High likelihood and severity",
      indicators: ["warning sign 1"],
      mitigation: "immediate mitigation action"
    };

    const validated = RiskScoringEngine.validateRisk(details);
    // Score = (80 * 90) / 100 = 72 -> HIGH
    assert(validated.riskScore === 72, "Correctly calculates risk score via probability * impact");
    assert(validated.severity === "HIGH", "Maps computed score to correct severity");
  } catch (err: any) {
    console.error("RiskScoringEngine test failed:", err);
  }

  // --- TEST 2: Overall Risk Index Scorer ---
  console.log("\n--- 2. Testing OverallRiskIndexScorer ---");
  try {
    const mockDetails = {
      probability: 50,
      impact: 50,
      severity: "MEDIUM" as const,
      riskScore: 25,
      reasoning: "Test reasoning",
      indicators: ["ind"],
      mitigation: "mit"
    };

    const mockReport = {
      marketRisk: mockDetails,
      competitionRisk: { ...mockDetails, riskScore: 80, severity: "CRITICAL" as const, reasoning: "Critical market density" },
      financialRisk: mockDetails,
      regulatoryRisk: mockDetails,
      technologyRisk: mockDetails,
      operationalRisk: mockDetails,
      executionRisk: mockDetails,
      fundingRisk: mockDetails,
      mitigationStrategies: []
    };

    const calculatedIndex = OverallRiskIndexScorer.compute(mockReport);
    // Average score: (25 * 7 + 80) / 8 = 255 / 8 = 31.875 -> 32 -> MEDIUM
    assert(calculatedIndex.score === 32, "Averages risk score across all 8 dimensions");
    assert(calculatedIndex.severity === "MEDIUM", "Maps averaged score to correct severity");
    assert(calculatedIndex.reasoning.some(r => r.includes("Competition Risk")), "Highlights critical dimensions in reasoning");
  } catch (err: any) {
    console.error("OverallRiskIndexScorer test failed:", err);
  }

  // --- TEST 3: Zod Schema Compliance ---
  console.log("\n--- 3. Testing Schema Validation ---");
  try {
    const mockDetails = {
      probability: 50,
      impact: 50,
      severity: "MEDIUM" as const,
      riskScore: 25,
      reasoning: "Reasoning details",
      indicators: ["warning sign"],
      mitigation: "primary action"
    };

    const mockReport = {
      marketRisk: mockDetails,
      competitionRisk: mockDetails,
      financialRisk: mockDetails,
      regulatoryRisk: mockDetails,
      technologyRisk: mockDetails,
      operationalRisk: mockDetails,
      executionRisk: mockDetails,
      fundingRisk: mockDetails,
      overallRiskIndex: {
        score: 25,
        severity: "MEDIUM" as const,
        reasoning: ["overall risk summary reasoning"]
      },
      mitigationStrategies: [
        {
          riskDimension: "Financial Risk",
          description: "High capital requirements",
          preventiveActions: ["Secure early commitments"],
          contingencyPlans: ["Launch initial pilot first"]
        }
      ]
    };

    const parseResult = RiskIntelligenceReportSchema.safeParse(mockReport);
    assert(parseResult.success === true, "Mock risk report complies with Zod schema validation");
  } catch (err: any) {
    console.error("Zod schema validation test failed:", err);
  }

  // --- TEST 4: LangGraph Node Integration ---
  console.log("\n--- 4. Testing LangGraph Node (riskIntelligenceAgent) ---");
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
          statement: "EV battery swap policy is active in India",
          consensusValue: "active",
          confidence: "HIGH",
          credibilityScore: 85,
          agreementScore: 90,
          supportingSources: ["ev_1"],
          conflictingSources: []
        }
      ]
    };

    const outputStateUpdate = await riskIntelligenceAgent(mockState as VentureStateType);
    assert(outputStateUpdate !== undefined, "Node executes without error");
    assert(outputStateUpdate.riskIntel !== undefined, "Node returns riskIntel report updates");
    assert(outputStateUpdate.riskIntel.marketRisk !== undefined, "Report contains marketRisk category");
    assert(outputStateUpdate.riskIntel.overallRiskIndex.score !== undefined, "Report contains computed overall index score");
  } catch (err: any) {
    console.error("LangGraph Node test failed:", err);
  }

  console.log("\n==========================================================");
  console.log(`TEST EXECUTION COMPLETED: ${passedTests}/${totalTests} ASSERTONS PASSED.`);
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
