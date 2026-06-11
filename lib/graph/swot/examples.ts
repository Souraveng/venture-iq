// lib/graph/swot/examples.ts
import { swotIntelligenceAgent } from "./node";
import { VentureStateType } from "../state";

export async function runExamples() {
  console.log("================================================================================");
  console.log("VENTUREIQ SWOT INTELLIGENCE AGENT - RUNNING DEMO");
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
      reasoning: "User has land and capital to start an EV network."
    },
    retrievedKnowledge: [
      {
        documentId: "rag_fact_1",
        content: "The Indian EV market expected to reach $142B by 2030, presenting huge expansion opportunity.",
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
        statement: "Ather Grid and Tata Power dominate the EV charging market in India.",
        consensusValue: "dominate EV charging",
        confidence: "HIGH",
        credibilityScore: 90,
        agreementScore: 95,
        supportingSources: ["rag_fact_1"],
        conflictingSources: []
      },
      {
        id: "val_fact_2",
        statement: "Indian EV market is projected to grow to $142B by 2030.",
        consensusValue: "$142B",
        confidence: "HIGH",
        credibilityScore: 92,
        agreementScore: 96,
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
      directCompetitors: ["Ather Grid", "Tata Power"],
      indirectCompetitors: ["Bolt.Earth"],
      competitorProfiles: [
        { name: "Ather Grid", marketPosition: "Market Leader", strengths: ["Brand"], weaknesses: ["Cost"] }
      ],
      marketGaps: [
        { gapType: "Technology Gap", description: "Legacy billing structures", opportunitySignal: "Modern open API billing" }
      ],
      competitiveIntensity: { score: 75 }
    }
  };

  console.log("Inputs prepared. Running SWOT Intelligence Agent...\n");

  const resultState = await swotIntelligenceAgent(mockState as VentureStateType);

  console.log("\n================================================================================");
  console.log("GENERATED SWOT INTELLIGENCE REPORT");
  console.log("================================================================================\n");
  console.log(JSON.stringify(resultState.swotIntel, null, 2));
  console.log("\nStrategic SWOT strings written to marketIntel.swot (for UI components):");
  console.log(JSON.stringify(resultState.marketIntel.swot, null, 2));
  console.log("\n================================================================================");
}

// Automatically execute if run directly in node
if (require.main === module) {
  runExamples().catch(console.error);
}
