// lib/graph/competitor/examples.ts
import { competitorIntelligenceAgent } from "./node";
import { VentureStateType } from "../state";

export async function runExamples() {
  console.log("================================================================================");
  console.log("VENTUREIQ COMPETITOR INTELLIGENCE AGENT - RUNNING DEMO");
  console.log("================================================================================\n");

  const mockState: Partial<VentureStateType> = {
    userInput: { idea: "EV Charging Infrastructure in India" },
    ventureContext: {
      intent: "VALIDATE_IDEA",
      goal: "Build an EV charging startup in India",
      secondary_goals: ["Identify profitable cities", "Calculate initial cap cost"],
      resources: ["₹2 Lakhs capital", "3 acres of land"],
      skills: ["Electrical engineering background", "Business development"],
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
      reasoning: "User wants to set up EV charging points."
    },
    retrievedKnowledge: [
      {
        documentId: "rag_fact_1",
        content: "Ather Grid is a direct competitor in India charging stations, currently operating over 1,400 fast chargers with premium branding.",
        similarityScore: 92,
        credibilityScore: 95,
        freshnessScore: 100,
        finalScore: 94,
        metadata: {
          industry: "EV Charging Infrastructure",
          country: "India",
          sourceType: "Government",
          credibilityScore: 95,
          confidence: "HIGH",
          publishDate: "2026-01-10",
          category: "competition"
        }
      },
      {
        documentId: "rag_fact_2",
        content: "Statiq is an emerging competitor in India offering software subscriptions for fleet charging and affordable charging hardware.",
        similarityScore: 88,
        credibilityScore: 90,
        freshnessScore: 95,
        finalScore: 90,
        metadata: {
          industry: "EV Charging Infrastructure",
          country: "India",
          sourceType: "News",
          credibilityScore: 90,
          confidence: "HIGH",
          publishDate: "2025-11-20",
          category: "competition"
        }
      }
    ],
    validatedFacts: [
      {
        id: "val_fact_1",
        statement: "Ather Grid operates over 1,400 fast chargers in India",
        consensusValue: "1,400 fast chargers",
        confidence: "HIGH",
        credibilityScore: 95,
        agreementScore: 100,
        supportingSources: ["rag_fact_1"],
        conflictingSources: []
      },
      {
        id: "val_fact_2",
        statement: "Statiq provides B2B fleet charging software subscriptions in India",
        consensusValue: "B2B fleet software subscriptions",
        confidence: "HIGH",
        credibilityScore: 90,
        agreementScore: 95,
        supportingSources: ["rag_fact_2"],
        conflictingSources: []
      }
    ],
    reliability: {
      overallReliability: 93,
      marketReliability: 95,
      competitionReliability: 92,
      financialReliability: 90,
      regulationReliability: 95
    },
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

  console.log("Inputs prepared. Running Competitor Intelligence Agent...\n");

  const resultState = await competitorIntelligenceAgent(mockState as VentureStateType);

  console.log("\n================================================================================");
  console.log("GENERATED COMPETITOR INTELLIGENCE REPORT");
  console.log("================================================================================\n");
  console.log(JSON.stringify(resultState.competitorIntel, null, 2));
  console.log("\n================================================================================");
}

// Automatically execute if run directly in node
if (require.main === module) {
  runExamples().catch(console.error);
}
