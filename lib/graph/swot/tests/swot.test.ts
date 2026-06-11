// lib/graph/swot/tests/swot.test.ts
import { ImpactScoringEngine, PrioritizationSorter, ConfidenceEngine } from "../engines";
import { SwotIntelligenceReportSchema } from "../schema";
import { swotIntelligenceAgent } from "../node";
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
  console.log("RUNNING VENTUREIQ SWOT INTELLIGENCE LAYER TESTS...");
  console.log("==========================================================\n");

  // --- TEST 1: Impact Scoring Engine ---
  console.log("--- 1. Testing Impact Scoring Engine ---");
  try {
    assert(ImpactScoringEngine.mapScoreToTier(90) === "CRITICAL", "90 maps to CRITICAL");
    assert(ImpactScoringEngine.mapScoreToTier(60) === "HIGH", "60 maps to HIGH");
    assert(ImpactScoringEngine.mapScoreToTier(40) === "MEDIUM", "40 maps to MEDIUM");
    assert(ImpactScoringEngine.mapScoreToTier(10) === "LOW", "10 maps to LOW");

    const validated = ImpactScoringEngine.validateItem({
      statement: "High cost",
      evidence: ["f1"],
      confidence: "HIGH" as const,
      impactScore: 120, // should normalize to 100
      impactTier: "LOW"  // should override to CRITICAL
    });
    assert(validated.impactScore === 100, "Normalizes out-of-range impact score");
    assert(validated.impactTier === "CRITICAL", "Overrides incorrect impact tier to match score");
  } catch (err: any) {
    console.error("Impact scoring test failed:", err);
  }

  // --- TEST 2: Prioritization Sorter ---
  console.log("\n--- 2. Testing Prioritization Sorter ---");
  try {
    const items = [
      { statement: "Item 1", evidence: ["f1"], confidence: "HIGH" as const, impactScore: 50, impactTier: "MEDIUM" as const },
      { statement: "Item 2", evidence: ["f1"], confidence: "HIGH" as const, impactScore: 90, impactTier: "CRITICAL" as const },
      { statement: "Item 3", evidence: ["f1"], confidence: "HIGH" as const, impactScore: 70, impactTier: "HIGH" as const }
    ];

    const sorted = PrioritizationSorter.sort(items);
    assert(sorted[0].statement === "Item 2", "Highest impact score ranked first");
    assert(sorted[1].statement === "Item 3", "Second highest impact score ranked second");
    assert(sorted[2].statement === "Item 1", "Lowest impact score ranked last");
  } catch (err: any) {
    console.error("Prioritization sorter test failed:", err);
  }

  // --- TEST 3: Confidence Engine ---
  console.log("\n--- 3. Testing Confidence Engine ---");
  try {
    const mockValidated = [
      {
        id: "val_1",
        statement: "India EV is $142B",
        consensusValue: "142B",
        confidence: "HIGH" as const,
        credibilityScore: 90,
        agreementScore: 95,
        supportingSources: ["d1"],
        conflictingSources: []
      }
    ];

    const item = {
      statement: "India EV grows to $142B",
      evidence: ["val_1"],
      confidence: "LOW" as const, // will be recalculated
      impactScore: 80,
      impactTier: "HIGH" as const
    };

    const calculatedConfidence = ConfidenceEngine.evaluateItemConfidence(item, mockValidated);
    assert(calculatedConfidence === "HIGH" || calculatedConfidence === "VERY_HIGH", "Programmatic confidence returns high rating based on agreement");
  } catch (err: any) {
    console.error("Confidence engine test failed:", err);
  }

  // --- TEST 4: Zod Schema Compliance ---
  console.log("\n--- 4. Testing Schema Validation ---");
  try {
    const mockReport = {
      strengths: [
        { statement: "Unique Pune land assets", evidence: ["val_1"], confidence: "HIGH" as const, impactScore: 80, impactTier: "HIGH" as const }
      ],
      weaknesses: [
        { statement: "Lack of commercial charging expertise", evidence: ["val_1"], confidence: "MEDIUM" as const, impactScore: 70, impactTier: "HIGH" as const }
      ],
      opportunities: [
        { statement: "Subsidy policies in Maharashtra", evidence: ["val_1"], confidence: "HIGH" as const, impactScore: 90, impactTier: "CRITICAL" as const }
      ],
      threats: [
        { statement: "Ather charging network growth", evidence: ["val_1"], confidence: "HIGH" as const, impactScore: 85, impactTier: "CRITICAL" as const }
      ],
      strategicSummary: {
        topStrengths: ["Unique Pune land assets"],
        topWeaknesses: ["Lack of commercial charging expertise"],
        topOpportunities: ["Subsidy policies in Maharashtra"],
        topThreats: ["Ather charging network growth"]
      }
    };

    const parseResult = SwotIntelligenceReportSchema.safeParse(mockReport);
    assert(parseResult.success === true, "SWOT report complies with Zod schema validation");
  } catch (err: any) {
    console.error("Zod schema validation test failed:", err);
  }

  // --- TEST 5: LangGraph Node Integration ---
  console.log("\n--- 5. Testing LangGraph Node (swotIntelligenceAgent) ---");
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
      ],
      marketIntel: {
        marketOverview: {
          industryDescription: "EV Charging Infrastructure",
          currentState: "Expansion phase",
          industryMaturity: "Emerging",
          growthStage: "Rapid growth",
          marketDynamics: "High policy support"
        },
        tam: { value: "$142B" },
        sam: { value: "$4.2B" },
        som: { value: "$150M" }
      },
      competitorIntel: {
        directCompetitors: ["Ather Grid"],
        indirectCompetitors: [],
        competitorProfiles: [],
        featureMatrix: { features: [], comparisons: [] },
        pricingAnalysis: { pricingModels: [], segments: [] },
        positioningAnalysis: { positioningMap: [], strategicPosition: "" },
        marketGaps: [],
        moatOpportunities: [],
        differentiationOpportunities: [],
        competitiveIntensity: { score: 60, factors: [], reasoning: [] },
        confidence: { overallConfidence: "HIGH", supportingSources: [], evidenceCount: 0, reasoning: "" }
      }
    };

    const outputStateUpdate = await swotIntelligenceAgent(mockState as VentureStateType);
    assert(outputStateUpdate !== undefined, "Node executes without error");
    assert(outputStateUpdate.swotIntel !== undefined, "Node returns swotIntel report updates");
    assert(outputStateUpdate.swotIntel.strengths !== undefined, "Report contains strengths category");
    assert(outputStateUpdate.swotIntel.strategicSummary.topStrengths !== undefined, "Report contains top strengths summaries");
    assert(outputStateUpdate.marketIntel !== undefined, "Node enriches marketIntel state");
    assert(outputStateUpdate.marketIntel.swot !== undefined, "marketIntel contains swot flat lists");
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
