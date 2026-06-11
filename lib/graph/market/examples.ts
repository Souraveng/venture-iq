// lib/graph/market/examples.ts
import { marketIntelligenceAgent } from "./node";
import { VentureStateType } from "../state";

export async function runExamples() {
  console.log("================================================================================");
  console.log("VENTUREIQ MARKET INTELLIGENCE AGENT - RUNNING DEMO");
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
      reasoning: "User wants to set up EV infrastructure in Pune, India."
    },
    retrievedKnowledge: [
      {
        documentId: "rag_fact_1",
        content: "The Indian electric vehicle market size is expected to reach $142 billion by 2030, expanding at a CAGR of 49%.",
        similarityScore: 95,
        credibilityScore: 98,
        freshnessScore: 100,
        finalScore: 96,
        metadata: {
          industry: "EV Charging Infrastructure",
          country: "India",
          sourceType: "Government",
          credibilityScore: 98,
          confidence: "VERY_HIGH",
          publishDate: "2026-02-15",
          category: "market"
        }
      },
      {
        documentId: "rag_fact_2",
        content: "The public EV charging infrastructure market in India is projected to grow to $4.2 billion by 2030 to support the vehicle base.",
        similarityScore: 90,
        credibilityScore: 92,
        freshnessScore: 95,
        finalScore: 91,
        metadata: {
          industry: "EV Charging Infrastructure",
          country: "India",
          sourceType: "Industry Report",
          credibilityScore: 92,
          confidence: "HIGH",
          publishDate: "2025-10-10",
          category: "market"
        }
      },
      {
        documentId: "rag_fact_3",
        content: "Pune and Mumbai are leading cities for EV registration in Maharashtra, accounting for over 35% of EV charging demand in the state.",
        similarityScore: 85,
        credibilityScore: 88,
        freshnessScore: 90,
        finalScore: 87,
        metadata: {
          industry: "EV Charging Demand",
          country: "India",
          sourceType: "News",
          credibilityScore: 88,
          confidence: "HIGH",
          publishDate: "2026-03-01",
          category: "market"
        }
      }
    ],
    validatedFacts: [
      {
        id: "val_fact_1",
        statement: "Indian EV market expected to reach $142B by 2030",
        consensusValue: "$142B",
        confidence: "VERY_HIGH",
        credibilityScore: 98,
        agreementScore: 100,
        supportingSources: ["rag_fact_1"],
        conflictingSources: []
      },
      {
        id: "val_fact_2",
        statement: "Indian EV charging station market projected to reach $4.2B by 2030",
        consensusValue: "$4.2B",
        confidence: "HIGH",
        credibilityScore: 92,
        agreementScore: 95,
        supportingSources: ["rag_fact_2"],
        conflictingSources: []
      }
    ],
    reliability: {
      overallReliability: 94,
      marketReliability: 96,
      competitionReliability: 90,
      financialReliability: 92,
      regulationReliability: 95
    }
  };

  console.log("Input validated facts and retrieved knowledge successfully prepared.");
  console.log("Running Market Intelligence Agent...\n");

  const resultState = await marketIntelligenceAgent(mockState as VentureStateType);

  console.log("\n================================================================================");
  console.log("GENERATED MARKET INTELLIGENCE REPORT");
  console.log("================================================================================\n");
  console.log(JSON.stringify(resultState.marketIntel, null, 2));
  console.log("\n================================================================================");
}

// Automatically execute if run directly in node
if (require.main === module) {
  runExamples().catch(console.error);
}
