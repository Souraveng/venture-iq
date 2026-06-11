// lib/graph/risk/examples.ts
import { riskIntelligenceAgent } from "./node";
import { VentureStateType } from "../state";

export async function runExamples() {
  console.log("================================================================================");
  console.log("VENTUREIQ RISK INTELLIGENCE AGENT - RUNNING DEMO");
  console.log("================================================================================\n");

  const mockState: Partial<VentureStateType> = {
    userInput: { idea: "EV Charging Infrastructure in India" },
    ventureContext: {
      intent: "VALIDATE_IDEA",
      goal: "Build an EV charging startup in India",
      secondary_goals: ["Identify profitable cities"],
      resources: ["₹2 Lakhs capital", "3 acres of land"],
      skills: ["Electrical engineering background"],
      constraints: ["Strict budget limits"],
      location: {
        country: "India",
        state: "Maharashtra",
        district: "",
        city: "Pune",
        village: "",
        region: "Western India",
        location_status: "AVAILABLE"
      },
      financial_context: {
        budget: "200000",
        available_capital: "200000",
        revenue: "0",
        profit: "0",
        funding_stage: "Bootstrapping"
      },
      timeline: "Immediate",
      existing_business: { description: "none", industry: "none", years_active: "none" },
      startup_idea: { description: "EV charging network", target_audience: "none", value_proposition: "none" },
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
      reasoning: "User wants to set up EV infrastructure."
    },
    retrievedKnowledge: [
      {
        documentId: "rag_fact_1",
        content: "India EV market expected to reach $142B by 2030, but grid integration and lack of commercial SaaS chargers represent execution risk.",
        similarityScore: 95,
        credibilityScore: 90,
        freshnessScore: 100,
        finalScore: 94,
        metadata: { industry: "EV", country: "India", sourceType: "Gov", credibilityScore: 90, confidence: "HIGH", publishDate: "2026", category: "market" }
      }
    ],
    validatedFacts: [
      {
        id: "val_fact_1",
        statement: "Maharashtra power grid faces distribution losses of up to 15%.",
        consensusValue: "15% losses",
        confidence: "HIGH",
        credibilityScore: 90,
        agreementScore: 95,
        supportingSources: ["rag_fact_1"],
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
      marketGaps: [],
      competitiveIntensity: { score: 60 }
    },
    swotIntel: {
      strengths: [],
      weaknesses: [
        { statement: "Starting capital ₹2 Lakhs is highly constrained.", evidence: ["val_fact_1"], confidence: "HIGH", impactScore: 85, impactTier: "CRITICAL" }
      ],
      opportunities: [],
      threats: [
        { statement: "Strong incumbents Ather Grid and Tata Power.", evidence: ["val_fact_1"], confidence: "HIGH", impactScore: 75, impactTier: "HIGH" }
      ]
    }
  };

  console.log("Inputs prepared. Running Risk Intelligence Agent...\n");

  const resultState = await riskIntelligenceAgent(mockState as VentureStateType);

  console.log("\n================================================================================");
  console.log("GENERATED RISK INTELLIGENCE REPORT");
  console.log("================================================================================\n");
  console.log(JSON.stringify(resultState.riskIntel, null, 2));
  console.log("\n================================================================================");
}

// Automatically execute if run directly in node
if (require.main === module) {
  runExamples().catch(console.error);
}
