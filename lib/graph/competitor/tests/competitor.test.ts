// lib/graph/competitor/tests/competitor.test.ts
import { CompetitiveIntensityEngine, CompetitorConfidenceEngine } from "../engines";
import { CompetitorIntelligenceReportSchema } from "../schema";
import { competitorIntelligenceAgent } from "../node";
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
  console.log("RUNNING VENTUREIQ COMPETITOR INTELLIGENCE LAYER TESTS...");
  console.log("==========================================================\n");

  // --- TEST 1: Competitive Intensity Engine ---
  console.log("--- 1. Testing Competitive Intensity Score ---");
  try {
    const factors = [
      { factorName: "Number of Competitors" as const, score: 80, weight: 0.25, reasoning: "High competitor count" },
      { factorName: "Market Saturation" as const, score: 70, weight: 0.25, reasoning: "Moderate saturation" },
      { factorName: "Switching Costs" as const, score: 30, weight: 0.15, reasoning: "Low switching costs" },
      { factorName: "Barrier to Entry" as const, score: 40, weight: 0.15, reasoning: "Low barriers" },
      { factorName: "Market Concentration" as const, score: 85, weight: 0.20, reasoning: "High concentration" }
    ];

    // Compute expected: (80*0.25) + (70*0.25) + (30*0.15) + (40*0.15) + (85*0.2)
    // = 20 + 17.5 + 4.5 + 6.0 + 17.0 = 65
    const results = CompetitiveIntensityEngine.computeScore(factors);
    assert(results.score === 65, "Calculates competitive intensity score correctly (65)");

    // Test weight normalization
    const unnormalizedFactors = [
      { factorName: "Number of Competitors" as const, score: 100, weight: 1.0, reasoning: "Test" },
      { factorName: "Market Saturation" as const, score: 50, weight: 1.0, reasoning: "Test" }
    ];
    const normalizedResults = CompetitiveIntensityEngine.computeScore(unnormalizedFactors);
    assert(normalizedResults.score === 75, "Intensity score normalized correctly (75)");
  } catch (err: any) {
    console.error("Competitive intensity test failed:", err);
  }

  // --- TEST 2: Competitor Confidence Engine ---
  console.log("\n--- 2. Testing Competitor Confidence Engine ---");
  try {
    const mockRetrieved = [
      {
        documentId: "d1",
        content: "Ather Energy has a growing grid of EV fast chargers.",
        similarityScore: 90,
        credibilityScore: 95,
        freshnessScore: 100,
        finalScore: 93,
        metadata: { industry: "EV", country: "India", sourceType: "Gov", credibilityScore: 95, confidence: "HIGH", publishDate: "2026", category: "competition" }
      }
    ];

    const mockValidated = [
      {
        id: "f1",
        statement: "Ather Grid has over 1,400 charging stations.",
        consensusValue: "1,400 stations",
        confidence: "HIGH" as const,
        credibilityScore: 95,
        agreementScore: 90,
        supportingSources: ["d1"],
        conflictingSources: []
      }
    ];

    const mockCompetitors = [
      {
        name: "Ather Energy",
        description: "EV charging networks",
        type: "Direct" as const,
        products: ["Ather Grid"],
        targetCustomers: ["Individual EV owners"],
        geography: "India",
        pricing: "Premium",
        funding: "$380M",
        marketPosition: "Market Leader" as const,
        strengths: ["Brand"],
        weaknesses: ["Cost"],
        threatLevel: 80
      }
    ];

    const confidenceReport = CompetitorConfidenceEngine.evaluate(
      mockRetrieved,
      mockValidated,
      mockCompetitors,
      95
    );

    assert(confidenceReport.supportingSources.includes("d1"), "Correctly associates d1 as a supporting source");
    assert(confidenceReport.evidenceCount === 1, "Evidence count matches matched sources");
    assert(confidenceReport.overallConfidence === "HIGH" || confidenceReport.overallConfidence === "VERY_HIGH", "Determines correct confidence level");
  } catch (err: any) {
    console.error("Competitor confidence test failed:", err);
  }

  // --- TEST 3: Zod Schema Compliance ---
  console.log("\n--- 3. Testing Schema Validation ---");
  try {
    const mockReport = {
      directCompetitors: ["Ather Grid"],
      indirectCompetitors: ["Zeon Charging"],
      competitorProfiles: [
        {
          name: "Ather Grid",
          description: "EV fast charging infrastructure",
          type: "Direct" as const,
          products: ["Ather Grid charging stations"],
          targetCustomers: ["EV two-wheeler owners"],
          geography: "India",
          pricing: "₹20/kWh subscription",
          funding: "$380M",
          marketPosition: "Market Leader" as const,
          strengths: ["Strong consumer brand", "Hardware-software vertical integration"],
          weaknesses: ["High infrastructure cost", "Mainly targets Ather vehicles"],
          threatLevel: 88
        }
      ],
      featureMatrix: {
        features: ["Fleet Analytics", "Mobile Charger App", "Open APIs"],
        comparisons: [
          { companyName: "Your Startup", featureSupport: [true, true, true] },
          { companyName: "Ather Grid", featureSupport: [false, true, false] }
        ]
      },
      pricingAnalysis: {
        pricingModels: [
          { modelType: "Subscription" as const, description: "Monthly base SaaS charging fee" }
        ],
        segments: [
          { tier: "Premium" as const, range: "₹20/kWh", details: "Premium DC fast charging rates" }
        ]
      },
      positioningAnalysis: {
        positioningMap: [
          { companyName: "Your Startup", xPosition: 20, yPosition: 85, labelX: "Pricing", labelY: "Software Autonomy" },
          { companyName: "Ather Grid", xPosition: 80, yPosition: 40, labelX: "Pricing", labelY: "Software Autonomy" }
        ],
        strategicPosition: "Your Startup positions as a low-cost, software-focused operator compared to Ather's high-cost, closed ecosystem."
      },
      marketGaps: [
        {
          gapType: "Technology Gap" as const,
          description: "Incumbents rely on closed billing protocols",
          opportunitySignal: "Open OCPP charging integration"
        }
      ],
      moatOpportunities: [
        {
          moatType: "Data" as const,
          description: "Consolidated battery degradation telemetry",
          feasibility: "HIGH" as const
        }
      ],
      differentiationOpportunities: [
        {
          strategy: "Affordable SaaS integration",
          type: "Unique Pricing" as const,
          description: "Bundle charging software with battery lease subscriptions",
          implementationEase: "HIGH" as const
        }
      ],
      competitiveIntensity: {
        score: 60,
        factors: [
          { factorName: "Number of Competitors" as const, score: 70, weight: 0.25, reasoning: "High competitor density" },
          { factorName: "Market Saturation" as const, score: 60, weight: 0.25, reasoning: "Moderate saturation" },
          { factorName: "Switching Costs" as const, score: 40, weight: 0.15, reasoning: "Low switching costs" },
          { factorName: "Barrier to Entry" as const, score: 70, weight: 0.15, reasoning: "High barrier to hardware" },
          { factorName: "Market Concentration" as const, score: 60, weight: 0.20, reasoning: "Top 3 players control 80%" }
        ],
        reasoning: ["Competitive intensity is moderate-high"]
      },
      confidence: {
        overallConfidence: "HIGH" as const,
        supportingSources: ["rag_fact_1"],
        evidenceCount: 1,
        reasoning: "High quality primary sources match competitor profiles"
      }
    };

    const parseResult = CompetitorIntelligenceReportSchema.safeParse(mockReport);
    assert(parseResult.success === true, "Mock competitor report passes Zod schema validation");
  } catch (err: any) {
    console.error("Zod schema validation test failed:", err);
  }

  // --- TEST 4: LangGraph Node Integration Test ---
  console.log("\n--- 4. Testing LangGraph Node (competitorIntelligenceAgent) ---");
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
          content: "Ather Grid operates EV chargers in India.",
          similarityScore: 95,
          credibilityScore: 90,
          freshnessScore: 100,
          finalScore: 94,
          metadata: { industry: "EV", country: "India", sourceType: "Government", credibilityScore: 90, confidence: "HIGH", publishDate: "2026-01-01", category: "competition" }
        }
      ],
      validatedFacts: [
        {
          id: "fact_1",
          statement: "Ather Grid is active in India EV charging.",
          consensusValue: "active",
          confidence: "HIGH",
          credibilityScore: 90,
          agreementScore: 95,
          supportingSources: ["fact_1"],
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
      }
    };

    const outputStateUpdate = await competitorIntelligenceAgent(mockState as VentureStateType);
    assert(outputStateUpdate !== undefined, "Node executes without error");
    assert(outputStateUpdate.competitorIntel !== undefined, "Node returns competitorIntel report updates");
    assert(outputStateUpdate.competitorIntel.directCompetitors !== undefined, "Report contains directCompetitors list");
    assert(outputStateUpdate.competitorIntel.competitiveIntensity.score !== undefined, "Report contains computed intensity score");
    assert(outputStateUpdate.marketIntel !== undefined, "Node enriches marketIntel state");
    assert(outputStateUpdate.marketIntel.competitors !== undefined, "marketIntel contains competitors sub-report");
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
