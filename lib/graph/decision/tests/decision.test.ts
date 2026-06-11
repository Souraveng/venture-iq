// lib/graph/decision/tests/decision.test.ts
import { 
  OpportunityScoringEngine, 
  ConfidenceCalculationEngine, 
  FinalDecisionEngine 
} from "../engines";
import { VentureDecisionReportSchema } from "../schema";
import { decisionIntelligenceAgent } from "../node";
import { VentureStateType } from "../../state";
import { MOCK_DECISION_REPORT } from "../examples";
import { OpportunityScoreBreakdown, VerdictReport } from "../types";
import { ValidatedFact, ReliabilityScores } from "../../validator/types";

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
  console.log("RUNNING VENTUREIQ FINAL DECISION INTELLIGENCE TESTS...");
  console.log("==========================================================\n");

  // --- TEST 1: OpportunityScoringEngine ---
  console.log("--- 1. Testing OpportunityScoringEngine ---");
  try {
    const breakdown: OpportunityScoreBreakdown = {
      marketOpportunityScore: 80,    // 30% -> 24
      competitionScore: 70,          // 15% -> 10.5
      financialViabilityScore: 90,   // 20% -> 18
      executionFeasibilityScore: 60, // 15% -> 9
      fundingPotentialScore: 70,     // 10% -> 7
      riskResilienceScore: 80        // 10% -> 8
    };
    // Sum: 24 + 10.5 + 18 + 9 + 7 + 8 = 76.5 -> 77
    const result = OpportunityScoringEngine.compute(breakdown);
    assert(result.score === 77, `Weighted average opportunity score calculated correctly: expected 77, got ${result.score}`);
  } catch (err: any) {
    console.error("OpportunityScoringEngine test failed:", err);
  }

  // --- TEST 2: ConfidenceCalculationEngine ---
  console.log("\n--- 2. Testing ConfidenceCalculationEngine ---");
  try {
    const validatedFacts: Partial<ValidatedFact>[] = [
      { id: "f-1", agreementScore: 90, statement: "Market size $10B" },
      { id: "f-2", agreementScore: 80, statement: "Competitor revenue $5M" }
    ];
    const reliability: ReliabilityScores = {
      overallReliability: 85,
      marketReliability: 80,
      competitionReliability: 80,
      financialReliability: 90,
      regulationReliability: 85
    };
    
    // overallReliability (85) * 0.70 = 59.5
    // agreementAvg (85) * 0.20 = 17
    // volumeFactor (2 facts * 5 = 10) * 0.10 = 1
    // Total: 59.5 + 17 + 1 = 77.5 -> 78
    const confidence = ConfidenceCalculationEngine.compute(
      validatedFacts as ValidatedFact[],
      reliability
    );
    assert(confidence.score === 78, `Confidence score calculated correctly: expected 78, got ${confidence.score}`);
    assert(confidence.reasoning.length === 3, "Assembles three items of validation data reasoning");
  } catch (err: any) {
    console.error("ConfidenceCalculationEngine test failed:", err);
  }

  // --- TEST 3: FinalDecisionEngine Overrides ---
  console.log("\n--- 3. Testing FinalDecisionEngine Overrides ---");
  try {
    const mockVerdict: VerdictReport = {
      decision: "STRONG OPPORTUNITY",
      reasoning: ["Promising industry indicators."]
    };

    // A. Downgrade low opportunity score (< 50)
    const overrideLowScore = FinalDecisionEngine.validate(mockVerdict, 45, 20, "LOW");
    assert(overrideLowScore.decision === "NOT RECOMMENDED", "Downgrades decision to NOT RECOMMENDED when opportunity score is low (< 50)");
    assert(overrideLowScore.reasoning[0].includes("Opportunity Score (45/100)"), "Appends explanation to reasoning");

    // B. Downgrade high risk/critical severity
    const overrideHighRisk = FinalDecisionEngine.validate(mockVerdict, 85, 65, "CRITICAL");
    assert(overrideHighRisk.decision === "HIGH RISK", "Downgrades decision to HIGH RISK when risk severity is CRITICAL or risk score > 60");
    assert(overrideHighRisk.reasoning[0].includes("Overall risk score: 65/100"), "Appends risk warning to reasoning");

    // C. Cap moderate opportunity score (50-69)
    const overrideModerate = FinalDecisionEngine.validate(mockVerdict, 65, 20, "LOW");
    assert(overrideModerate.decision === "PROCEED WITH CAUTION", "Caps decision at PROCEED WITH CAUTION when opportunity score is moderate (50-69)");
  } catch (err: any) {
    console.error("FinalDecisionEngine test failed:", err);
  }

  // --- TEST 4: Zod Schema Compliance ---
  console.log("\n--- 4. Testing Schema Validation ---");
  try {
    const mockReport = JSON.parse(JSON.stringify(MOCK_DECISION_REPORT));
    // Provide a valid score so it complies with schema constraints
    mockReport.opportunityScore.score = 77;
    const parseResult = VentureDecisionReportSchema.safeParse(mockReport);
    assert(parseResult.success === true, "Mock decision report complies with Zod schema validation");
  } catch (err: any) {
    console.error("Zod schema validation test failed:", err);
  }

  // --- TEST 5: LangGraph Node Integration ---
  console.log("\n--- 5. Testing LangGraph Node (decisionIntelligenceAgent) ---");
  try {
    const mockState: Partial<VentureStateType> = {
      userInput: { idea: "Build EV charging network in Pune" },
      ventureContext: {
        intent: "VALIDATE_IDEA",
        goal: "Build EV charging network in Pune",
        secondary_goals: [],
        resources: [],
        skills: [],
        constraints: [],
        existing_business: { description: "none", industry: "none", years_active: "none" },
        startup_idea: { description: "EV charging network", target_audience: "none", value_proposition: "none" },
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
      reliability: {
        overallReliability: 80,
        marketReliability: 75,
        competitionReliability: 70,
        financialReliability: 85,
        regulationReliability: 78
      },
      marketIntel: {},
      financialIntel: {},
      riskIntel: {
        overallRiskIndex: {
          score: 25,
          severity: "MEDIUM",
          reasoning: []
        }
      },
      finalReport: {
        ventureReadiness: {
          score: 72
        }
      },
      roadmapIntel: {
        milestones: []
      }
    };

    const outputStateUpdate = await decisionIntelligenceAgent(mockState as VentureStateType);
    assert(outputStateUpdate !== undefined, "Node executes without error");
    assert(outputStateUpdate.decisionReport !== undefined, "Node returns decisionReport updates");
    assert(outputStateUpdate.decisionReport.opportunityScore.score > 0, "Calculates non-zero opportunity score");
    assert(outputStateUpdate.decisionReport.confidence.score > 0, "Calculates non-zero validator-based confidence score");
    assert(outputStateUpdate.decisionReport.verdict.decision !== undefined, "Returns structured decision verdict");
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
