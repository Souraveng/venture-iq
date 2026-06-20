// lib/graph/engine.ts
// Master Orchestration Engine — Supervisor Pattern
// Instead of a rigid linear pipeline, a Supervisor node reads the State
// and dynamically routes to the next agent based on deterministic rules.

import { StateGraph, END, START } from "@langchain/langgraph";
import { VentureState } from "./state";
import { supervisorNode } from "./supervisor";
import { opportunityAgent } from "./opportunity/node";
import { researchPlannerAgent } from "./planner/node";
import { evidenceResearchAgent } from "./researcher/node";
import { factExtractionAgent } from "./extractor/node";
import { validationAgent } from "./validator/node";
import { knowledgeStoreAgent } from "./vectorstore/node";
import { marketIntelligenceAgent } from "./market/node";
import { competitorIntelligenceAgent } from "./competitor/node";
import { swotIntelligenceAgent } from "./swot/node";
import { riskIntelligenceAgent } from "./risk/node";
import { financialIntelligenceAgent } from "./financial/node";
import { ventureAnalystAgent } from "./analyst/node";
import { roadmapIntelligenceAgent } from "./roadmap/node";
import { decisionIntelligenceAgent } from "./decision/node";
import { reportIntelligenceAgent } from "./report/node";

// Each agent node wrapper: runs the agent, then marks itself as completed
// so the supervisor knows not to route there again.
function wrapAgent(nodeKey: string, agentFn: (state: any) => Promise<any>) {
  return async (state: any) => {
    const result = await agentFn(state);
    return {
      ...result,
      completedAgents: [nodeKey],
    };
  };
}

const workflow = new StateGraph(VentureState)
  // The supervisor is the central routing hub
  .addNode("supervisor", supervisorNode)

  // All 15 agent nodes — wrapped to auto-mark completion
  .addNode("opportunity", wrapAgent("opportunity", opportunityAgent))
  .addNode("planner", wrapAgent("planner", researchPlannerAgent))
  .addNode("research", wrapAgent("research", evidenceResearchAgent))
  .addNode("extractor", wrapAgent("extractor", factExtractionAgent))
  .addNode("validator", wrapAgent("validator", validationAgent))
  .addNode("retriever", wrapAgent("retriever", knowledgeStoreAgent))
  .addNode("market", wrapAgent("market", marketIntelligenceAgent))
  .addNode("competitor", wrapAgent("competitor", competitorIntelligenceAgent))
  .addNode("swot", wrapAgent("swot", swotIntelligenceAgent))
  .addNode("risk", wrapAgent("risk", riskIntelligenceAgent))
  .addNode("financial", wrapAgent("financial", financialIntelligenceAgent))
  .addNode("analyst", wrapAgent("analyst", ventureAnalystAgent))
  .addNode("roadmap", wrapAgent("roadmap", roadmapIntelligenceAgent))
  .addNode("decision", wrapAgent("decision", decisionIntelligenceAgent))
  .addNode("report", wrapAgent("report", reportIntelligenceAgent))

  // Entry point: always start at the supervisor
  .addEdge(START, "supervisor")

  // Supervisor routes to any agent (or FINISH) based on state
  .addConditionalEdges("supervisor", (state: any) => state.nextAgent, {
    opportunity: "opportunity",
    planner: "planner",
    research: "research",
    extractor: "extractor",
    validator: "validator",
    retriever: "retriever",
    market: "market",
    competitor: "competitor",
    swot: "swot",
    risk: "risk",
    financial: "financial",
    analyst: "analyst",
    roadmap: "roadmap",
    decision: "decision",
    report: "report",
    FINISH: END,
  })

  // After every agent completes, circle back to the supervisor for the next decision
  .addEdge("opportunity", "supervisor")
  .addEdge("planner", "supervisor")
  .addEdge("research", "supervisor")
  .addEdge("extractor", "supervisor")
  .addEdge("validator", "supervisor")
  .addEdge("retriever", "supervisor")
  .addEdge("market", "supervisor")
  .addEdge("competitor", "supervisor")
  .addEdge("swot", "supervisor")
  .addEdge("risk", "supervisor")
  .addEdge("financial", "supervisor")
  .addEdge("analyst", "supervisor")
  .addEdge("roadmap", "supervisor")
  .addEdge("decision", "supervisor")
  .addEdge("report", "supervisor");

export const graph = workflow.compile().withConfig({ recursionLimit: 100 });