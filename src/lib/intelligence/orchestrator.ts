import { DiligenceInputSnapshot, EngineAnalysisResult } from "./contracts";
import { EngineContext, IntelligenceEngine } from "./types";
import { runCompletenessEngine } from "./engines/completeness";
import { runFinancialEngine } from "./engines/financial";
import { runRiskEngine } from "./engines/risk";
import { runInvestmentEngine } from "./engines/investment";
import { runMCDAStrategy } from "./strategies/mcda";
import { runRecommendationEngine } from "./engines/recommendation";
import { runVerificationEngine } from "./engines/verification";
import { runEvidenceEngine } from "./engines/evidence";

import { StateGraph, Annotation } from "@langchain/langgraph";
import { DiligenceWorkerId } from "./contracts";

export const DiligenceState = Annotation.Root({
  input: Annotation<DiligenceInputSnapshot>(),
  result: Annotation<EngineAnalysisResult>({
    reducer: (curr, next) => ({
      findings: [...(curr?.findings || []), ...(next?.findings || [])],
      scorecards: [...(curr?.scorecards || []), ...(next?.scorecards || [])],
      recommendations: [...(curr?.recommendations || []), ...(next?.recommendations || [])],
      completedWorkerIds: Array.from(new Set([...(curr?.completedWorkerIds || []), ...(next?.completedWorkerIds || [])])),
    }),
    default: () => ({ findings: [], scorecards: [], recommendations: [], completedWorkerIds: [] })
  }),
});

const wrapEngine = (engine: IntelligenceEngine, workerId: DiligenceWorkerId) => {
  return async (state: typeof DiligenceState.State) => {
    const localResult = JSON.parse(JSON.stringify(state.result || { findings: [], scorecards: [], recommendations: [], completedWorkerIds: [] }));
    const context: EngineContext = { input: state.input, result: localResult };
    
    await engine(context);
    
    const startF = state.result?.findings?.length || 0;
    const startS = state.result?.scorecards?.length || 0;
    const startR = state.result?.recommendations?.length || 0;

    return { 
      result: {
        findings: localResult.findings.slice(startF),
        scorecards: localResult.scorecards.slice(startS),
        recommendations: localResult.recommendations.slice(startR),
        completedWorkerIds: [workerId]
      }
    };
  };
};

const workflow = new StateGraph(DiligenceState)
  .addNode("data-completeness", wrapEngine(runCompletenessEngine, "data-completeness"))
  .addNode("evidence-collection", wrapEngine(runEvidenceEngine, "evidence-collection"))
  .addNode("financial-intelligence", wrapEngine(runFinancialEngine, "financial-intelligence"))
  .addNode("risk-intelligence", wrapEngine(runRiskEngine, "risk-intelligence"))
  .addNode("investment-intelligence", wrapEngine(runInvestmentEngine, "investment-intelligence"))
  .addNode("investment-mcda", wrapEngine(runMCDAStrategy, "investment-mcda"))
  .addNode("recommendation", wrapEngine(runRecommendationEngine, "recommendation"))
  .addNode("verification", wrapEngine(runVerificationEngine, "verification"))
  .addNode("mcda-aggregator", () => ({}))
  .addNode("wait-node", () => ({}))
  
  .addEdge("__start__", "data-completeness")
  .addEdge("data-completeness", "evidence-collection")
  .addEdge("data-completeness", "financial-intelligence")
  .addEdge("evidence-collection", "risk-intelligence")
  .addEdge("risk-intelligence", "investment-intelligence")
  
  .addEdge("financial-intelligence", "mcda-aggregator")
  .addEdge("investment-intelligence", "mcda-aggregator")
  .addConditionalEdges("mcda-aggregator", (state) => {
    const hasFin = state.result.completedWorkerIds.includes("financial-intelligence");
    const hasInv = state.result.completedWorkerIds.includes("investment-intelligence");
    return (hasFin && hasInv) ? "investment-mcda" : "wait-node";
  }, { "investment-mcda": "investment-mcda", "wait-node": "wait-node" })
  
  .addEdge("investment-mcda", "recommendation")
  .addEdge("recommendation", "verification")
  .addEdge("verification", "__end__");

export const diligenceGraph = workflow.compile();
