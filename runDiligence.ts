import { diligenceGraph } from "./src/lib/intelligence/graphs/diligence-graph";

async function run() {
  const startups = [
    {
      id: "test-123",
      name: "AutoAgentic",
      tagline: "Autonomous AI Agents for enterprise",
      stage: "Seed",
      traction: "5 pilots with Fortune 500, $10k MRR",
      sector: "AI",
      desc: "AutoAgentic builds scalable autonomous agents that integrate into existing enterprise workflows to automate complex multi-step processes."
    }
  ];

  const investorThesis = "Focus on enterprise AI tools that show early traction with large corporates.";

  console.log("Starting diligence graph...");
  try {
    const finalState = await diligenceGraph.invoke({
      startups,
      investorThesis
    });
    console.log("Diligence Output:", JSON.stringify(finalState, null, 2));
  } catch (error) {
    console.error("Error running graph:", error);
  }
}

run();
