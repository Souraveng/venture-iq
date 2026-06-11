// lib/graph/financial/tests/financial.test.ts
import { 
  FinancialModelingEngine, 
  BreakEvenCalculator, 
  RoiCalculator, 
  ScenarioEngine, 
  FinancialViabilityScorer 
} from "../engines";
import { FinancialIntelligenceReportSchema } from "../schema";
import { financialIntelligenceAgent } from "../node";
import { VentureStateType } from "../../state";
import { MOCK_FINANCIAL_REPORT } from "../examples";

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
  console.log("RUNNING VENTUREIQ FINANCIAL INTELLIGENCE LAYER TESTS...");
  console.log("==========================================================\n");

  // --- TEST 1: Financial Modeling Engine ---
  console.log("--- 1. Testing FinancialModelingEngine ---");
  try {
    const startupCosts = JSON.parse(JSON.stringify(MOCK_FINANCIAL_REPORT.startupCosts));
    // Set scenario total to wrong values to test overwrite
    startupCosts.scenarios.expected.total = 0;
    
    const validatedCosts = FinancialModelingEngine.validateStartupCosts(startupCosts);
    const expectedExpected = 
      startupCosts.infrastructure.expected +
      startupCosts.technology.expected +
      startupCosts.equipment.expected +
      startupCosts.licensing.expected +
      startupCosts.operations.expected +
      startupCosts.marketing.expected +
      startupCosts.team.expected +
      startupCosts.legal.expected;

    assert(validatedCosts.scenarios.expected.total === expectedExpected, "Recalculates expected cost scenario total programmatically");
    assert(validatedCosts.scenarios.min.total < validatedCosts.scenarios.expected.total, "Min scenario total is less than expected total");

    const unitEconInput = {
      cac: 300,
      ltv: 6000,
      grossMargin: 80,
      contributionMargin: 75,
      paybackPeriod: 4,
      revenuePerCustomer: 1500
    };

    const computedUe = FinancialModelingEngine.calculateUnitEconomics(unitEconInput);
    assert(computedUe.ltvToCacRatio === 20, "Computes LTV:CAC ratio exactly as LTV / CAC");
  } catch (err: any) {
    console.error("FinancialModelingEngine test failed:", err);
  }

  // --- TEST 2: Break Even Calculator ---
  console.log("\n--- 2. Testing BreakEvenCalculator ---");
  try {
    const breakEven = BreakEvenCalculator.compute(10000, 100, 80);
    // Contribution margin per customer = 100 * 0.8 = 80
    // Customers required = Math.ceil(10000 / 80) = 125
    // Revenue required = 125 * 100 = 12500
    assert(breakEven.breakEvenCustomers === 125, "Computes correct number of break-even customers");
    assert(breakEven.breakEvenRevenue === 12500, "Computes correct break-even revenue");
    assert(breakEven.methodology.includes("fixed monthly operating expenses (10000)"), "Exposes calculation fixed cost assumptions in methodology");
  } catch (err: any) {
    console.error("BreakEvenCalculator test failed:", err);
  }

  // --- TEST 3: ROI Calculator ---
  console.log("\n--- 3. Testing RoiCalculator ---");
  try {
    const roi = RoiCalculator.calculate(100000, 250000);
    // ROI = (250000 / 100000) * 100 = 250%
    assert(roi.expectedRoi === 250, "Calculates expected ROI programmatically");
    assert(roi.conservativeRoi === 150, "Calculates conservative ROI as 60% of expected");
    assert(roi.riskAdjustedRoi === 188, "Calculates risk adjusted ROI as 75% of expected");
  } catch (err: any) {
    console.error("RoiCalculator test failed:", err);
  }

  // --- TEST 4: Scenario Engine ---
  console.log("\n--- 4. Testing ScenarioEngine ---");
  try {
    const scenarios = ScenarioEngine.generate(1000000, 400000, 150);
    assert(scenarios.expectedCase.revenue === 1000000, "Expected case revenue matches base parameter");
    assert(scenarios.bestCase.revenue === 1400000, "Best case revenue scales expected by 1.4x");
    assert(scenarios.worstCase.revenue === 600000, "Worst case revenue scales expected by 0.6x");
    assert(scenarios.bestCase.profit === 1400000 - 360000, "Best case profit recalculated correctly with scaled costs");
  } catch (err: any) {
    console.error("ScenarioEngine test failed:", err);
  }

  // --- TEST 5: Financial Viability Scorer ---
  console.log("\n--- 5. Testing FinancialViabilityScorer ---");
  try {
    const mockReport = JSON.parse(JSON.stringify(MOCK_FINANCIAL_REPORT));
    const viability = FinancialViabilityScorer.compute(mockReport);
    assert(viability.score >= 0 && viability.score <= 100, "Generates viability score between 0 and 100");
    assert(viability.reasoning.length > 0, "Provides detailed reasoning highlights for the score");
  } catch (err: any) {
    console.error("FinancialViabilityScorer test failed:", err);
  }

  // --- TEST 6: Zod Schema Compliance ---
  console.log("\n--- 6. Testing Schema Validation ---");
  try {
    const parseResult = FinancialIntelligenceReportSchema.safeParse(MOCK_FINANCIAL_REPORT);
    assert(parseResult.success === true, "Mock financial report complies with Zod schema validation");
  } catch (err: any) {
    console.error("Zod schema validation test failed:", err);
  }

  // --- TEST 7: LangGraph Node Integration ---
  console.log("\n--- 7. Testing LangGraph Node (financialIntelligenceAgent) ---");
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
      ]
    };

    const outputStateUpdate = await financialIntelligenceAgent(mockState as VentureStateType);
    assert(outputStateUpdate !== undefined, "Node executes without error");
    assert(outputStateUpdate.financialIntel !== undefined, "Node returns financialIntel report updates");
    assert(outputStateUpdate.financialIntel.startupCosts !== undefined, "Report contains startupCosts category");
    assert(outputStateUpdate.financialIntel.financialViability.score !== undefined, "Report contains computed viability score");
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
