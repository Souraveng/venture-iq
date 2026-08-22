// ──────────────────────────────────────────────────────────────────────────────
// LangGraph Orchestrator — Production Pipeline
// Features: retry/partial completion, SSE streaming, observability, HITL
// ──────────────────────────────────────────────────────────────────────────────

import { StateGraph, Annotation } from "@langchain/langgraph";
import type {
  PipelineInput, PipelineNodeId, PlaybookConfig, OpportunityPlan,
  InputValidationResult, RuleValidationResult,
  ExtractedFact, ValidatedFact, MarketCompetitorAnalysis,
  RiskSwotAnalysis, FinancialAnalysis, DecisionScorecard,
  VentureSynthesis, RoadmapReport, DashboardTab, NodeError,
} from "./contracts";

// Node imports
import { runInputValidation } from "./nodes/input-validation";
import { runOpportunityPlanning } from "./nodes/opportunity-planning";
import { runCacheEvaluator } from "./nodes/cache-evaluator";
import { runResearchExtraction } from "./nodes/research-extraction";
import { runVectorStore } from "./nodes/vector-store";
import { runRuleValidation } from "./nodes/rule-validation";
import { runMarketCompetitor } from "./nodes/market-competitor";
import { runRiskSwot } from "./nodes/risk-swot";
import { runFinancialEngine } from "./nodes/financial-engine";
import { runDecisionScorecard } from "./nodes/decision-scorecard";
import { runVentureSynthesis } from "./nodes/venture-synthesis";
import { runRoadmapReport } from "./nodes/roadmap-report";

// Infrastructure imports
import { PipelineLogger, createPipelineLogger } from "./pipeline-logger";
import { PipelineEmitter, createNoopEmitter, type NodeEventCallback } from "./pipeline-emitter";
import { abortContext } from "./abort-context";

// ── State Annotation ────────────────────────────────────────────────────────

export const PipelineState = Annotation.Root({
  input: Annotation<PipelineInput>(),
  pipeline: Annotation<{
    playbook?: PlaybookConfig;
    inputValidation?: InputValidationResult;
    opportunity?: OpportunityPlan;
    extractedFacts?: ExtractedFact[];
    cachedFacts?: ExtractedFact[];
    missingQueries?: string[];
    cacheSufficient?: boolean;
    forceContinueResearch?: boolean;
    ruleValidationResult?: RuleValidationResult;
    validatedFacts?: ValidatedFact[];
    marketAnalysis?: MarketCompetitorAnalysis;
    riskAnalysis?: RiskSwotAnalysis;
    financialAnalysis?: FinancialAnalysis;
    scorecard?: DecisionScorecard;
    synthesis?: VentureSynthesis;
    report?: RoadmapReport;
    completedNodes?: PipelineNodeId[];
    // ── Error Recovery ──────────────────────────────────────────────────
    errors?: NodeError[];
    failedNodes?: PipelineNodeId[];
  }>({
    reducer: (curr, next) => ({
      playbook: next?.playbook || curr?.playbook,
      inputValidation: next?.inputValidation || curr?.inputValidation,
      opportunity: next?.opportunity || curr?.opportunity,
      extractedFacts: next?.extractedFacts || curr?.extractedFacts,
      cachedFacts: next?.cachedFacts || curr?.cachedFacts,
      missingQueries: next?.missingQueries || curr?.missingQueries,
      cacheSufficient: next?.cacheSufficient ?? curr?.cacheSufficient,
      forceContinueResearch: next?.forceContinueResearch ?? curr?.forceContinueResearch,
      ruleValidationResult: next?.ruleValidationResult || curr?.ruleValidationResult,
      validatedFacts: next?.validatedFacts || curr?.validatedFacts,
      marketAnalysis: next?.marketAnalysis || curr?.marketAnalysis,
      riskAnalysis: next?.riskAnalysis || curr?.riskAnalysis,
      financialAnalysis: next?.financialAnalysis || curr?.financialAnalysis,
      scorecard: next?.scorecard || curr?.scorecard,
      synthesis: next?.synthesis || curr?.synthesis,
      report: next?.report || curr?.report,
      completedNodes: Array.from(new Set([
        ...(curr?.completedNodes || []),
        ...(next?.completedNodes || []),
      ])),
      // Merge errors arrays
      errors: [
        ...(curr?.errors || []),
        ...(next?.errors || []),
      ],
      // Merge failedNodes arrays
      failedNodes: Array.from(new Set([
        ...(curr?.failedNodes || []),
        ...(next?.failedNodes || []),
      ])) as PipelineNodeId[],
    }),
    default: () => ({ completedNodes: [], errors: [], failedNodes: [] }),
  }),
});

// ── Resilient Node Wrappers ─────────────────────────────────────────────────
// Phase 4 nodes are wrapped in try/catch for partial completion.
// If one fails, the pipeline continues with the other two.
// Mitigates the "one timeout kills everything" problem.

function wrapPhase4Node(
  nodeId: PipelineNodeId,
  nodeFunc: (state: any) => Promise<any>,
  emitter: PipelineEmitter,
  logger: PipelineLogger,
) {
  return async (state: typeof PipelineState.State) => {
    emitter.emit(nodeId, "started");
    logger.nodeStart(nodeId);

    try {
      const result = await nodeFunc(state);
      const preview = getNodePreview(nodeId, result);
      emitter.emit(nodeId, "completed", { preview });
      // Note: logger.nodeComplete is called inside the node via vertexAiCallJSON
      // but we still need to handle deterministic nodes
      return result;
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      emitter.emit(nodeId, "failed", { error: errorMsg });
      logger.nodeFailed(nodeId, errorMsg);

      // Return error state instead of throwing — pipeline continues
      return {
        pipeline: {
          errors: [{
            nodeId,
            error: errorMsg,
            retryCount: err.primaryError ? 3 : 0,
            fallbackUsed: err.fallbackError ? "yes" : undefined,
            timestamp: Date.now(),
          }] as NodeError[],
          failedNodes: [nodeId] as PipelineNodeId[],
          completedNodes: [nodeId] as PipelineNodeId[], // Mark as "done" for aggregator
        },
      };
    }
  };
}

/**
 * Wrap a non-critical node with emitter + logger.
 * These nodes WILL throw on failure (no partial completion for sequential nodes).
 */
function wrapNode(
  nodeId: string,
  nodeFunc: (state: any) => any | Promise<any>,
  emitter: PipelineEmitter,
  logger: PipelineLogger,
) {
  return async (state: typeof PipelineState.State) => {
    emitter.emit(nodeId, "started");
    logger.nodeStart(nodeId);

    const result = await nodeFunc(state);

    const preview = getNodePreview(nodeId, result);
    emitter.emit(nodeId, "completed", { preview });

    // For deterministic nodes that don't call vertexAiCallJSON (which logs itself),
    // we need to log completion manually
    const deterministicNodes = ["input-validation", "rule-validation", "decision-scorecard"];
    if (deterministicNodes.includes(nodeId)) {
      logger.nodeComplete(nodeId);
    }

    return result;
  };
}

/**
 * Extract a short human-readable preview from a node's result.
 * Used by SSE streaming to show partial results as they arrive.
 */
function getNodePreview(nodeId: string, result: any): string | undefined {
  const p = result?.pipeline;
  if (!p) return undefined;

  switch (nodeId) {
    case "input-validation":
      if (p.inputValidation?.isValid === false) {
        return `Idea validation failed: ${p.inputValidation.summary.slice(0, 60)}...`;
      }
      return `Sector: ${p.inputValidation?.sector || p.playbook?.sector || "detected"}, Geo: ${p.inputValidation?.geography || p.playbook?.geography || "global"}`;
    case "opportunity-planning":
      return p.opportunity?.valueProposition?.slice(0, 60) || "Plan generated";
    case "cache-evaluator":
      return p.cacheSufficient ? "Cache sufficient — skipping web search" : `${p.missingQueries?.length || 0} queries need web search`;
    case "research-extraction":
      return `${p.extractedFacts?.length || 0} facts extracted`;
    case "vector-store":
      return `Embeddings indexed: ${p.extractedFacts?.length || 0}`;
    case "rule-validation":
      if (p.ruleValidationResult?.isResearchComplete === false) {
        return `PAUSED: Research Incomplete - ${p.ruleValidationResult.lackingDetails.slice(0, 50)}...`;
      }
      return `Confirmed: ${p.validatedFacts?.filter((f: any) => f.validationStatus === "confirmed").length || 0}`;
    case "market-competitor":
      return `Market score: ${p.marketAnalysis?.marketScore || "N/A"}/100`;
    case "risk-swot":
      return `Risk score: ${p.riskAnalysis?.riskScore || "N/A"}/100`;
    case "financial-engine":
      return `Financial score: ${p.financialAnalysis?.financialScore || "N/A"}/100`;
    case "decision-scorecard":
      return `Grade: ${p.scorecard?.grade || "N/A"} (${p.scorecard?.overallScore || "N/A"}/100)`;
    case "venture-synthesis":
      return p.synthesis?.executiveSummary?.slice(0, 60) || "Synthesis complete";
    case "roadmap-report":
      return "Dashboard report generated";
    default:
      return undefined;
  }
}

// ── Graph Builder ───────────────────────────────────────────────────────────
// Factory function that builds a graph with injected logger and emitter.
// This allows each request to have its own logger/emitter instance.

function buildValidationGraph(logger: PipelineLogger, emitter: PipelineEmitter) {
  const workflow = new StateGraph(PipelineState)
    // Phase 0
    .addNode("input-validation", wrapNode("input-validation", runInputValidation, emitter, logger))
    // Phase 1
    .addNode("opportunity-planning", wrapNode("opportunity-planning", runOpportunityPlanning, emitter, logger))
    // Phase 2
    .addNode("cache-evaluator", wrapNode("cache-evaluator", runCacheEvaluator, emitter, logger))
    .addNode("research-extraction", wrapNode("research-extraction", runResearchExtraction, emitter, logger))
    .addNode("vector-store", wrapNode("vector-store", runVectorStore, emitter, logger))
    // Phase 3
    .addNode("rule-validation", wrapNode("rule-validation", runRuleValidation, emitter, logger))
    // Phase 4 — parallel analysis with RESILIENT wrappers
    .addNode("market-competitor", wrapPhase4Node("market-competitor", runMarketCompetitor, emitter, logger))
    .addNode("risk-swot", wrapPhase4Node("risk-swot", runRiskSwot, emitter, logger))
    .addNode("financial-engine", wrapPhase4Node("financial-engine", runFinancialEngine, emitter, logger))
    // Phase 5
    .addNode("decision-scorecard", wrapNode("decision-scorecard", runDecisionScorecard, emitter, logger))
    .addNode("venture-synthesis", wrapNode("venture-synthesis", runVentureSynthesis, emitter, logger))
    .addNode("roadmap-report", wrapNode("roadmap-report", runRoadmapReport, emitter, logger))

    // Aggregator nodes for fan-in
    .addNode("phase4-aggregator", () => ({}))
    .addNode("phase4-wait", () => ({}))

    // ── Edges ─────────────────────────────────────────────────────────────

    // Phase 0 → 1
    .addEdge("__start__", "input-validation")
    .addEdge("input-validation", "opportunity-planning")

    // Phase 1 → 2a
    .addEdge("opportunity-planning", "cache-evaluator")

    // Conditional: If cache sufficient -> rule-validation, else -> research-extraction
    .addConditionalEdges("cache-evaluator", (state) => {
      if (state.pipeline?.cacheSufficient) {
        return "rule-validation";
      }
      return "research-extraction";
    }, { "rule-validation": "rule-validation", "research-extraction": "research-extraction" })

    // Phase 2b → Phase 2c (update vector store with new facts)
    .addEdge("research-extraction", "vector-store")

    // Phase 2c → Phase 3
    .addEdge("vector-store", "rule-validation")

    // Phase 3 → Phase 4 (fan-out: 3 parallel analysis agents)
    .addEdge("rule-validation", "market-competitor")
    .addEdge("rule-validation", "risk-swot")
    .addEdge("rule-validation", "financial-engine")

    // Phase 4 fan-in → Phase 5a
    // Mitigates partial completion con: aggregator now accepts 2/3 nodes
    .addEdge("market-competitor", "phase4-aggregator")
    .addEdge("risk-swot", "phase4-aggregator")
    .addEdge("financial-engine", "phase4-aggregator")
    .addConditionalEdges("phase4-aggregator", (state) => {
      const nodes = state.pipeline?.completedNodes || [];
      const hasMarket = nodes.includes("market-competitor");
      const hasRisk = nodes.includes("risk-swot");
      const hasFinancial = nodes.includes("financial-engine");
      const completedCount = [hasMarket, hasRisk, hasFinancial].filter(Boolean).length;

      // Proceed if ALL 3 are done, OR if at least 2 are done (partial completion)
      if (completedCount >= 2) return "decision-scorecard";
      // Still waiting for more nodes
      return "phase4-wait";
    }, { "decision-scorecard": "decision-scorecard", "phase4-wait": "phase4-wait" })

    // Phase 5: sequential scorecard → synthesis → report → end
    .addEdge("decision-scorecard", "venture-synthesis")
    .addEdge("venture-synthesis", "roadmap-report")
    .addEdge("roadmap-report", "__end__");

  return workflow.compile();
}

// ── HITL: Split Graphs ──────────────────────────────────────────────────────
// Concept 4: Human-in-the-Loop checkpoint after Phase 1
// 
// planningGraph: Runs Phase 0 + Phase 1 only, returns OpportunityPlan for review
// executionGraph: Resumes from Phase 2 with confirmed/edited OpportunityPlan
//
// Mitigates "extra click" con: "Skip Review" just calls the full graph directly
// Mitigates "stale checkpoints" con: plan data is stored in-memory/DB, not in LangGraph state

function buildPlanningGraph(logger: PipelineLogger, emitter: PipelineEmitter) {
  const workflow = new StateGraph(PipelineState)
    .addNode("input-validation", wrapNode("input-validation", runInputValidation, emitter, logger))
    .addNode("opportunity-planning", wrapNode("opportunity-planning", runOpportunityPlanning, emitter, logger))
    .addEdge("__start__", "input-validation")
    .addEdge("input-validation", "opportunity-planning")
    .addEdge("opportunity-planning", "__end__");

  return workflow.compile();
}

function buildExecutionGraph(logger: PipelineLogger, emitter: PipelineEmitter) {
  const workflow = new StateGraph(PipelineState)
    .addNode("cache-evaluator", wrapNode("cache-evaluator", runCacheEvaluator, emitter, logger))
    .addNode("research-extraction", wrapNode("research-extraction", runResearchExtraction, emitter, logger))
    .addNode("vector-store", wrapNode("vector-store", runVectorStore, emitter, logger))
    .addNode("rule-validation", wrapNode("rule-validation", runRuleValidation, emitter, logger))
    .addNode("market-competitor", wrapPhase4Node("market-competitor", runMarketCompetitor, emitter, logger))
    .addNode("risk-swot", wrapPhase4Node("risk-swot", runRiskSwot, emitter, logger))
    .addNode("financial-engine", wrapPhase4Node("financial-engine", runFinancialEngine, emitter, logger))
    .addNode("decision-scorecard", wrapNode("decision-scorecard", runDecisionScorecard, emitter, logger))
    .addNode("venture-synthesis", wrapNode("venture-synthesis", runVentureSynthesis, emitter, logger))
    .addNode("roadmap-report", wrapNode("roadmap-report", runRoadmapReport, emitter, logger))
    .addNode("phase4-aggregator", () => ({}))
    .addNode("phase4-wait", () => ({}))
    .addEdge("__start__", "cache-evaluator")
    .addConditionalEdges("cache-evaluator", (state) => {
      if (state.pipeline?.cacheSufficient) return "rule-validation";
      return "research-extraction";
    }, { "rule-validation": "rule-validation", "research-extraction": "research-extraction" })
    .addEdge("research-extraction", "vector-store")
    .addEdge("vector-store", "rule-validation")
    .addNode("rule-validation-check", () => ({}))
    .addNode("rule-validation-fan-out", () => ({}))
    .addEdge("rule-validation", "rule-validation-check")
    .addConditionalEdges("rule-validation-check", (state) => {
      const p = state.pipeline;
      if (p?.ruleValidationResult?.isResearchComplete === false && !p?.forceContinueResearch) {
        return "pause";
      }
      return "continue";
    }, {
      "pause": "__end__",
      "continue": "rule-validation-fan-out"
    })
    .addEdge("rule-validation-fan-out", "market-competitor")
    .addEdge("rule-validation-fan-out", "risk-swot")
    .addEdge("rule-validation-fan-out", "financial-engine")
    .addEdge("market-competitor", "phase4-aggregator")
    .addEdge("risk-swot", "phase4-aggregator")
    .addEdge("financial-engine", "phase4-aggregator")
    .addConditionalEdges("phase4-aggregator", (state) => {
      const nodes = state.pipeline?.completedNodes || [];
      const completedCount = [
        nodes.includes("market-competitor"),
        nodes.includes("risk-swot"),
        nodes.includes("financial-engine"),
      ].filter(Boolean).length;
      return completedCount >= 2 ? "decision-scorecard" : "phase4-wait";
    }, { "decision-scorecard": "decision-scorecard", "phase4-wait": "phase4-wait" })
    .addEdge("decision-scorecard", "venture-synthesis")
    .addEdge("venture-synthesis", "roadmap-report")
    .addEdge("roadmap-report", "__end__");

  return workflow.compile();
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface InvokeOptions {
  /** Callback for real-time node events (SSE streaming) */
  onNodeEvent?: NodeEventCallback;
  /** Abort signal to cancel LLM API calls if the request is closed */
  signal?: AbortSignal;
}

/**
 * Run the full validation pipeline (Phase 0 → Phase 5).
 * Backwards-compatible replacement for the old `validationGraph.invoke()`.
 */
export async function invokeValidationPipeline(
  input: PipelineInput,
  options?: InvokeOptions,
) {
  const logger = createPipelineLogger();
  const emitter = options?.onNodeEvent
    ? new PipelineEmitter(options.onNodeEvent)
    : createNoopEmitter();

  const graph = buildValidationGraph(logger, emitter);
  
  const execute = async () => {
    const finalState = await graph.invoke({ input });
    const trace = logger.finalize(
      (finalState.pipeline?.failedNodes?.length || 0) > 0 ? "partial" : "completed"
    );
    return { state: finalState, trace };
  };

  if (options?.signal) {
    return abortContext.run(options.signal, execute);
  }
  return execute();
}

/**
 * HITL Step 1: Run only Phase 0 + Phase 1 (planning).
 * Returns the OpportunityPlan for founder review before continuing.
 */
export async function invokePlanningOnly(
  input: PipelineInput,
  options?: InvokeOptions,
) {
  const logger = createPipelineLogger();
  const emitter = options?.onNodeEvent
    ? new PipelineEmitter(options.onNodeEvent)
    : createNoopEmitter();

  const graph = buildPlanningGraph(logger, emitter);
  
  const execute = async () => {
    const finalState = await graph.invoke({ input });
    const trace = logger.finalize("completed");
    return { state: finalState, trace };
  };

  if (options?.signal) {
    return abortContext.run(options.signal, execute);
  }
  return execute();
}

/**
 * HITL Step 2: Resume pipeline from Phase 2 with confirmed/edited plan.
 * Accepts the OpportunityPlan (potentially edited by founder) and playbook.
 */
export async function invokeExecutionFromPlan(
  input: PipelineInput,
  confirmedPlan: {
    opportunity: OpportunityPlan;
    playbook: PlaybookConfig;
    forceContinueResearch?: boolean;
  },
  options?: InvokeOptions,
) {
  const logger = createPipelineLogger();
  const emitter = options?.onNodeEvent
    ? new PipelineEmitter(options.onNodeEvent)
    : createNoopEmitter();

  const graph = buildExecutionGraph(logger, emitter);

  const execute = async () => {
    // Pre-seed pipeline state with the confirmed plan from Phase 1
    const finalState = await graph.invoke({
      input,
      pipeline: {
        playbook: confirmedPlan.playbook,
        opportunity: confirmedPlan.opportunity,
        forceContinueResearch: confirmedPlan.forceContinueResearch,
        completedNodes: ["input-validation", "opportunity-planning"] as PipelineNodeId[],
      },
    });

    const trace = logger.finalize(
      (finalState.pipeline?.failedNodes?.length || 0) > 0 ? "partial" : "completed"
    );

    return { state: finalState, trace };
  };

  if (options?.signal) {
    return abortContext.run(options.signal, execute);
  }
  return execute();
}

/**
 * HITL Step 3: Resume pipeline from Phase 4 despite incomplete research.
 */
export async function resumeWithForcedResearch(
  input: PipelineInput,
  currentState: any,
  options?: InvokeOptions,
) {
  const logger = createPipelineLogger();
  const emitter = options?.onNodeEvent
    ? new PipelineEmitter(options.onNodeEvent)
    : createNoopEmitter();

  const graph = buildExecutionGraph(logger, emitter);

  const execute = async () => {
    const finalState = await graph.invoke({
      input,
      pipeline: {
        ...currentState,
        forceContinueResearch: true,
      },
    });

    const trace = logger.finalize(
      (finalState.pipeline?.failedNodes?.length || 0) > 0 ? "partial" : "completed"
    );

    return { state: finalState, trace };
  };

  if (options?.signal) {
    return abortContext.run(options.signal, execute);
  }
  return execute();
}

/**
 * HITL Step 3: Re-run the research agent from Phase 2 to fix incomplete research.
 */
export async function rerunResearchPhase(
  input: PipelineInput,
  currentState: any,
  options?: InvokeOptions,
) {
  const logger = createPipelineLogger();
  const emitter = options?.onNodeEvent
    ? new PipelineEmitter(options.onNodeEvent)
    : createNoopEmitter();

  const graph = buildExecutionGraph(logger, emitter);

  const execute = async () => {
    // Clear out extracted facts and rule validation results so it re-runs fresh
    const finalState = await graph.invoke({
      input,
      pipeline: {
        ...currentState,
        extractedFacts: [],
        ruleValidationResult: undefined,
        cacheSufficient: false, // force research to run again
        completedNodes: ["input-validation", "opportunity-planning"] as PipelineNodeId[], // roll back nodes
      },
    });

    const trace = logger.finalize(
      (finalState.pipeline?.failedNodes?.length || 0) > 0 ? "partial" : "completed"
    );

    return { state: finalState, trace };
  };

  if (options?.signal) {
    return abortContext.run(options.signal, execute);
  }
  return execute();
}

// ── Legacy export for backwards compatibility ───────────────────────────────
// The old `validationGraph` constant is replaced by the factory function above.
// This export ensures existing imports don't break during migration.

const _defaultLogger = createPipelineLogger("legacy");
const _defaultEmitter = createNoopEmitter();
export const validationGraph = buildValidationGraph(_defaultLogger, _defaultEmitter);
