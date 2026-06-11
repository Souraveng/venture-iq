// lib/graph/market/tests/market.test.ts
import { CalculationEngine, MarketScoringEngine, ConfidenceEngine } from "../scoring";
import { MarketIntelligenceReportSchema } from "../schema";
import { marketIntelligenceAgent } from "../node";
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
  console.log("RUNNING VENTUREIQ MARKET INTELLIGENCE LAYER TESTS...");
  console.log("==========================================================\n");

  // --- TEST 1: Calculation Engine - Money Parsing ---
  console.log("--- 1. Testing Money Parsing ---");
  try {
    assert(CalculationEngine.parseMoneyValue("$142B") === 142000000000, "Parses Billions ($142B)");
    assert(CalculationEngine.parseMoneyValue("$2.4T") === 2400000000000, "Parses Trillions ($2.4T)");
    assert(CalculationEngine.parseMoneyValue("₹15 Lakhs") === 1500000, "Parses Lakhs (₹15 Lakhs)");
    assert(CalculationEngine.parseMoneyValue("₹5.6 Crore") === 56000000, "Parses Crores (₹5.6 Crore)");
    assert(CalculationEngine.parseMoneyValue("$50M") === 50000000, "Parses Millions ($50M)");
  } catch (err: any) {
    console.error("Money parsing test failed:", err);
  }

  // --- TEST 2: Calculation Engine - Hierarchy Verifier ---
  console.log("\n--- 2. Testing Market Hierarchy Verifier ---");
  try {
    const validCheck = CalculationEngine.verifyMarketHierarchies("$100B", "$10B", "$1B");
    assert(validCheck.valid === true, "Valid hierarchy TAM >= SAM >= SOM passes");

    const invalidSamCheck = CalculationEngine.verifyMarketHierarchies("$10B", "$50B", "$1B");
    assert(invalidSamCheck.valid === false, "Invalid hierarchy detected when SAM > TAM");
    assert(invalidSamCheck.reasoning.includes("cannot exceed TAM"), "Correct reason returned when SAM > TAM");

    const invalidSomCheck = CalculationEngine.verifyMarketHierarchies("$100B", "$10B", "$15B");
    assert(invalidSomCheck.valid === false, "Invalid hierarchy detected when SOM > SAM");
    assert(invalidSomCheck.reasoning.includes("cannot exceed SAM"), "Correct reason returned when SOM > SAM");
  } catch (err: any) {
    console.error("Market hierarchy verification test failed:", err);
  }

  // --- TEST 3: Market Scoring Engine (Weighted average) ---
  console.log("\n--- 3. Testing Market Scoring Engine ---");
  try {
    const factors = [
      { factorName: "Market Size" as const, score: 90, weight: 0.20, reasoning: "Huge size" },
      { factorName: "Growth Rate" as const, score: 85, weight: 0.20, reasoning: "Fast growth" },
      { factorName: "Accessibility" as const, score: 50, weight: 0.15, reasoning: "Medium barriers" },
      { factorName: "Competition" as const, score: 40, weight: 0.15, reasoning: "High competition" },
      { factorName: "Demand" as const, score: 95, weight: 0.15, reasoning: "Intense customer pain" },
      { factorName: "Timing" as const, score: 90, weight: 0.15, reasoning: "Catalysts active" }
    ];

    // Compute expected: (90*0.2) + (85*0.2) + (50*0.15) + (40*0.15) + (95*0.15) + (90*0.15)
    // = 18 + 17 + 7.5 + 6.0 + 14.25 + 13.5 = 76.25 -> 76
    const results = MarketScoringEngine.computeScore(factors);
    assert(results.score === 76, "Attractiveness score calculated correctly (76)");

    // Test weight normalization when sum is not 1.0
    const unnormalizedFactors = [
      { factorName: "Market Size" as const, score: 100, weight: 1.0, reasoning: "Test" },
      { factorName: "Growth Rate" as const, score: 50, weight: 1.0, reasoning: "Test" }
    ];
    const normalizedResults = MarketScoringEngine.computeScore(unnormalizedFactors);
    assert(normalizedResults.score === 75, "Attractiveness score normalized correctly (75)");
    assert(normalizedResults.normalizedFactors[0].weight === 0.5, "Weights normalized to 0.5");
  } catch (err: any) {
    console.error("Market scoring test failed:", err);
  }

  // --- TEST 4: Confidence Engine ---
  console.log("\n--- 4. Testing Confidence Engine ---");
  try {
    const mockRetrieved = [
      {
        documentId: "d1",
        content: "EV facts",
        similarityScore: 90,
        credibilityScore: 95,
        freshnessScore: 100,
        finalScore: 93,
        metadata: { industry: "EV", country: "India", sourceType: "Gov", credibilityScore: 95, confidence: "HIGH", publishDate: "2026", category: "market" }
      }
    ];

    const mockValidated = [
      {
        id: "f1",
        statement: "EV market size is $142B",
        consensusValue: "142B",
        confidence: "VERY_HIGH" as const,
        credibilityScore: 95,
        agreementScore: 90,
        supportingSources: ["d1"],
        conflictingSources: []
      }
    ];

    const report = ConfidenceEngine.evaluate(mockRetrieved, mockValidated, 90);
    assert(report.sourceQualityScore === 95, "Calculates source quality correctly");
    assert(report.agreementScore === 90, "Calculates agreement score correctly");
    assert(report.overallConfidence === "HIGH" || report.overallConfidence === "VERY_HIGH", "Returns high confidence level");
  } catch (err: any) {
    console.error("Confidence engine test failed:", err);
  }

  // --- TEST 5: Zod Schema Compliance ---
  console.log("\n--- 5. Testing Schema Validation ---");
  try {
    const mockReport = {
      marketOverview: {
        industryDescription: "Test industry description",
        currentState: "Growth state",
        industryMaturity: "Growth stage",
        growthStage: "Rapid expansion",
        marketDynamics: "Competitive entry"
      },
      tam: {
        definition: "Entire EV market",
        value: "$142B",
        formula: "TAM = N * P",
        calculation: "Multiplied EV registration projection by charger cost",
        assumptions: ["Assume Maharashtra market matches national CAGR"],
        sources: ["rag_fact_1"],
        confidence: "VERY_HIGH" as const
      },
      sam: {
        targetMarket: "Serviceable available Maharashtra charging infrastructure",
        value: "$4.2B",
        geographicScope: "Maharashtra, India",
        industryScope: "Public DC charging stations",
        assumptions: ["Assume 35% concentration in Pune & Mumbai"],
        sources: ["rag_fact_2"],
        confidence: "HIGH" as const
      },
      som: {
        realisticMarketCapture: "SOM target capture in Western Maharashtra",
        firstThreeYearsValue: "$50M",
        firstFiveYearsValue: "$150M",
        assumptions: ["Assume 3% share captured by year 5"],
        sources: ["rag_fact_3"],
        confidence: "MEDIUM" as const
      },
      customerSegments: [
        {
          segmentName: "Fleet operators",
          type: "Enterprise" as const,
          description: "Logistics companies converting to EV fleets",
          painPoints: ["High charging downtime", "Lack of commercial chargers"],
          sizeEstimate: "$500M"
        }
      ],
      marketTrends: [
        {
          trend: "Public battery swapping standardization",
          type: "Technology" as const,
          description: "Standardized dimensions for rapid battery swaps",
          evidenceSource: "rag_fact_1"
        }
      ],
      growthDrivers: [
        {
          driver: "Government subsidy allocations",
          type: "Growth Catalyst" as const,
          description: "Subsidy funding for high-capacity public chargers",
          evidenceSource: "rag_fact_2"
        }
      ],
      marketAttractiveness: {
        score: 85,
        factors: [
          { factorName: "Market Size" as const, score: 90, weight: 0.20, reasoning: "Large TAM" },
          { factorName: "Growth Rate" as const, score: 85, weight: 0.20, reasoning: "High CAGR" },
          { factorName: "Accessibility" as const, score: 80, weight: 0.15, reasoning: "No license required" },
          { factorName: "Competition" as const, score: 75, weight: 0.15, reasoning: "Strong entrants" },
          { factorName: "Demand" as const, score: 90, weight: 0.15, reasoning: "High bottleneck" },
          { factorName: "Timing" as const, score: 95, weight: 0.15, reasoning: "Favorable policy window" }
        ],
        reasoning: ["Attractive market conditions"]
      },
      confidence: {
        overallConfidence: "HIGH" as const,
        sourceQualityScore: 92,
        evidenceQuantityScore: 80,
        agreementScore: 95,
        reasoning: "High source credibility and fact consensus agreement"
      }
    };

    const parseResult = MarketIntelligenceReportSchema.safeParse(mockReport);
    assert(parseResult.success === true, "Mock report schema parses successfully under Zod");
  } catch (err: any) {
    console.error("Zod schema validation test failed:", err);
  }

  // --- TEST 6: LangGraph Node Integration Test ---
  console.log("\n--- 6. Testing LangGraph Node (marketIntelligenceAgent) ---");
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
      retrievedKnowledge: [
        {
          documentId: "fact_1",
          content: "India EV market expected to reach $142B by 2030",
          similarityScore: 95,
          credibilityScore: 90,
          freshnessScore: 100,
          finalScore: 94,
          metadata: { industry: "EV", country: "India", sourceType: "Government", credibilityScore: 90, confidence: "HIGH", publishDate: "2026-01-01", category: "market" }
        }
      ],
      validatedFacts: [
        {
          id: "fact_1",
          statement: "India EV market expected to reach $142B by 2030",
          consensusValue: "$142B",
          confidence: "HIGH",
          credibilityScore: 90,
          agreementScore: 95,
          supportingSources: ["fact_1"],
          conflictingSources: []
        }
      ]
    };

    const outputStateUpdate = await marketIntelligenceAgent(mockState as VentureStateType);
    assert(outputStateUpdate !== undefined, "Node executes without error");
    assert(outputStateUpdate.marketIntel !== undefined, "Node returns marketIntel report updates");
    assert(outputStateUpdate.marketIntel.marketOverview !== undefined, "Report contains marketOverview");
    assert(outputStateUpdate.marketIntel.marketAttractiveness.score !== undefined, "Report contains computed attractiveness score");
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
