// lib/graph/engine.ts
import { StateGraph, END } from "@langchain/langgraph";
import { VentureState } from "./state";
import { intentAgent } from "./nodes"; // You must define this in nodes.ts
import { researchAgent } from "./nodes";
import { analystAgent } from "./analyst";


const workflow = new StateGraph(VentureState)
  .addNode("intent", intentAgent)
  .addNode("research", researchAgent)
  .addNode("analyst", analystAgent)
  .addEdge("__start__", "intent")
  .addEdge("intent", "research")
  .addEdge("research", "analyst")
  .addEdge("analyst", END);

export const graph = workflow.compile();