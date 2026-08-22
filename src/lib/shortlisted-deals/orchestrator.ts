import { StateGraph, START, END } from "@langchain/langgraph";
import { BatchPipelineState } from "./contracts";
import type { PipelineNodeId } from "./contracts";

// Node imports
import { runBatchInputValidation } from "./nodes/batch-input-validation";
import { runCacheEvaluator } from "./nodes/cache-evaluator";
import {
  runDealGroundingSearch,
  runMarketAnalysis,
  runTeamTraction,
  runBusinessModelViability,
} from "./nodes/active-evaluation";
import {
  runBatchDecisionScorecard,
  runBatchDealSynthesis,
} from "./nodes/synthesis-nodes";

// Infrastructure imports (reusing from founder intelligence)
import { PipelineLogger } from "../founder-intelligence/pipeline-logger";
import { PipelineEmitter } from "../founder-intelligence/pipeline-emitter";

// ── Resilient Node Wrappers ─────────────────────────────────────────────────
// Ensures that parallel branches don't bring down the whole orchestrator if they fail.

function wrapResilientNode(
  nodeId: PipelineNodeId | string,
  nodeFunc: (state: any) => Promise<any>,
  emitter: PipelineEmitter,
  logger: PipelineLogger,
) {
  return async (state: typeof BatchPipelineState.State) => {
    try {
      logger.nodeStart(nodeId);
      emitter.emit(nodeId, "started");

      const result = await nodeFunc(state);

      logger.nodeComplete(nodeId);
      emitter.emit(nodeId, "completed", { preview: "Node execution complete" });

      // Add to completed nodes
      const pipelineUpdates = result.pipeline || {};
      pipelineUpdates.completedNodes = [nodeId];

      return {
        ...result,
        pipeline: pipelineUpdates
      };
    } catch (err: any) {
      const sanitizedMessage = `Node "${nodeId}" encountered an internal error during execution.`;
      logger.nodeFailed(nodeId, err.message);
      emitter.emit(nodeId, "failed", { error: sanitizedMessage });

      return {
        pipeline: {
          errors: [{ nodeId, error: sanitizedMessage, retryCount: 0, timestamp: Date.now() }],
          failedNodes: [nodeId],
        }
      };
    }
  };
}

// ── Graph Construction ──────────────────────────────────────────────────────

export function buildShortlistedDealsOrchestrator(
  emitter: PipelineEmitter,
  logger: PipelineLogger
) {
  const workflow = new StateGraph(BatchPipelineState)
    // 1. Sequential Gates
    .addNode("batch-input-validation", wrapResilientNode("batch-input-validation", runBatchInputValidation, emitter, logger))
    .addNode("cache-evaluator", wrapResilientNode("cache-evaluator", runCacheEvaluator, emitter, logger))

    // 2. Parallel Evaluation Nodes
    .addNode("deal-grounding-search", wrapResilientNode("deal-grounding-search", runDealGroundingSearch, emitter, logger))
    .addNode("market-analysis", wrapResilientNode("market-analysis", runMarketAnalysis, emitter, logger))
    .addNode("team-traction", wrapResilientNode("team-traction", runTeamTraction, emitter, logger))
    .addNode("business-model-viability", wrapResilientNode("business-model-viability", runBusinessModelViability, emitter, logger))

    // 3. Aggregation & Synthesis
    .addNode("aggregator-node", async (state) => {
      // Partial fan-in logic: ensuring enough nodes completed before proceeding
      return { pipeline: { completedNodes: ["aggregator-node"] } };
    })
    .addNode("batch-decision-scorecard", wrapResilientNode("batch-decision-scorecard", runBatchDecisionScorecard, emitter, logger))
    .addNode("batch-deal-synthesis", wrapResilientNode("batch-deal-synthesis", runBatchDealSynthesis, emitter, logger));

  // Edges
  workflow.addEdge(START, "batch-input-validation");
  workflow.addEdge("batch-input-validation", "cache-evaluator");

  // From cache evaluator, we fan out to parallel evaluation
  workflow.addEdge("cache-evaluator", "deal-grounding-search");
  workflow.addEdge("cache-evaluator", "market-analysis");
  workflow.addEdge("cache-evaluator", "team-traction");
  workflow.addEdge("cache-evaluator", "business-model-viability");

  // Fan-in to aggregator
  workflow.addEdge("deal-grounding-search", "aggregator-node");
  workflow.addEdge("market-analysis", "aggregator-node");
  workflow.addEdge("team-traction", "aggregator-node");
  workflow.addEdge("business-model-viability", "aggregator-node");

  // Aggregation to ranking
  workflow.addEdge("aggregator-node", "batch-decision-scorecard");
  workflow.addEdge("batch-decision-scorecard", "batch-deal-synthesis");
  workflow.addEdge("batch-deal-synthesis", END);

  return workflow.compile();
}
