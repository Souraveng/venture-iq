// lib/graph/engine.ts
import { StateGraph, END } from "@langchain/langgraph";
import { VentureState } from "./state";
import { ventureAnalystAgent } from "./analyst/node";
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
import { roadmapIntelligenceAgent } from "./roadmap/node";
import { decisionIntelligenceAgent } from "./decision/node";
import { reportIntelligenceAgent } from "./report/node";


const workflow = new StateGraph(VentureState)
  .addNode("opportunity", opportunityAgent)
  .addNode("planner", researchPlannerAgent)
  .addNode("research", evidenceResearchAgent)
  .addNode("extractor", factExtractionAgent)
  .addNode("validator", validationAgent)
  .addNode("retriever", knowledgeStoreAgent)
  .addNode("market", marketIntelligenceAgent)
  .addNode("competitor", competitorIntelligenceAgent)
  .addNode("swot", swotIntelligenceAgent)
  .addNode("risk", riskIntelligenceAgent)
  .addNode("financial", financialIntelligenceAgent)
  .addNode("analyst", ventureAnalystAgent)
  .addNode("roadmap", roadmapIntelligenceAgent)
  .addNode("decision", decisionIntelligenceAgent)
  .addNode("report", reportIntelligenceAgent)
  .addEdge("__start__", "opportunity")
  .addEdge("opportunity", "planner")
  .addEdge("planner", "research")
  .addEdge("research", "extractor")
  .addEdge("extractor", "validator")
  .addEdge("validator", "retriever")
  .addEdge("retriever", "market")
  .addEdge("market", "competitor")
  .addEdge("competitor", "swot")
  .addEdge("swot", "risk")
  .addEdge("risk", "financial")
  .addEdge("financial", "analyst")
  .addEdge("analyst", "roadmap")
  .addEdge("roadmap", "decision")
  .addEdge("decision", "report")
  .addEdge("report", END);

export const graph = workflow.compile();