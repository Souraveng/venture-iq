// ──────────────────────────────────────────────────────────────────────────────
// Pipeline Logger — Structured observability for every graph run
// Zero external dependencies, zero LLM tokens
// ──────────────────────────────────────────────────────────────────────────────

import type { PipelineNodeId } from "./contracts";

// ── Log Levels ──────────────────────────────────────────────────────────────
// Mitigates "verbose logs" con: only INFO+ logs in production, DEBUG in dev

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LOG_LEVEL: LogLevel =
  (process.env.PIPELINE_LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "info" : "debug");

// ── Cost Estimates (per 1M tokens) ──────────────────────────────────────────
// Documented here so changes are explicit. These are approximations.
// Con acknowledgment: NIM pricing may change — update these rates accordingly.

const COST_PER_1M_INPUT: Record<string, number> = {
  nemotron: 0.30,
  maverick: 0.20,
  glm: 0.25,
  deepseek: 0.55,
  embed: 0.10,
};

const COST_PER_1M_OUTPUT: Record<string, number> = {
  nemotron: 0.60,
  maverick: 0.40,
  glm: 0.50,
  deepseek: 1.10,
  embed: 0.00,
};

// ── Types ───────────────────────────────────────────────────────────────────

export interface NodeTrace {
  nodeId: string;
  startedAt: number;       // Date.now() epoch ms
  completedAt?: number;
  durationMs?: number;
  status: "running" | "completed" | "failed" | "skipped";
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  retryCount?: number;
  fallbackModel?: string;  // set if fallback was used
  error?: string;
}

export interface PipelineTrace {
  traceId: string;
  startedAt: number;
  completedAt?: number;
  totalDurationMs?: number;
  status: "running" | "completed" | "partial" | "failed";
  nodeTraces: NodeTrace[];
  totals: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    nodesCompleted: number;
    nodesFailed: number;
  };
}

export interface LLMCallMetrics {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  retryCount: number;
  fallbackModel?: string;
}

// ── Logger Class ────────────────────────────────────────────────────────────

export class PipelineLogger {
  private trace: PipelineTrace;
  private activeNodes: Map<string, NodeTrace> = new Map();

  constructor(traceId?: string) {
    this.trace = {
      traceId: traceId || `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      startedAt: Date.now(),
      status: "running",
      nodeTraces: [],
      totals: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
        nodesCompleted: 0,
        nodesFailed: 0,
      },
    };

    this.log("info", `Pipeline started`, { traceId: this.trace.traceId });
  }

  /**
   * Record that a node has started execution.
   */
  nodeStart(nodeId: string): void {
    const nodeTrace: NodeTrace = {
      nodeId,
      startedAt: Date.now(),
      status: "running",
    };
    this.activeNodes.set(nodeId, nodeTrace);
    this.log("debug", `Node started: ${nodeId}`);
  }

  /**
   * Record that a node has completed successfully.
   * Optionally include LLM call metrics.
   */
  nodeComplete(nodeId: string, metrics?: LLMCallMetrics): void {
    const nodeTrace = this.activeNodes.get(nodeId);
    if (!nodeTrace) {
      // Node wasn't tracked — create a minimal trace
      const minimal: NodeTrace = {
        nodeId,
        startedAt: Date.now(),
        completedAt: Date.now(),
        durationMs: 0,
        status: "completed",
      };
      this.trace.nodeTraces.push(minimal);
      this.trace.totals.nodesCompleted++;
      return;
    }

    nodeTrace.completedAt = Date.now();
    nodeTrace.durationMs = nodeTrace.completedAt - nodeTrace.startedAt;
    nodeTrace.status = "completed";

    if (metrics) {
      nodeTrace.model = metrics.model;
      nodeTrace.inputTokens = metrics.inputTokens;
      nodeTrace.outputTokens = metrics.outputTokens;
      nodeTrace.totalTokens = metrics.totalTokens;
      nodeTrace.retryCount = metrics.retryCount;
      nodeTrace.fallbackModel = metrics.fallbackModel;

      // Calculate estimated cost
      const modelKey = metrics.fallbackModel || metrics.model;
      const inputCost = (metrics.inputTokens / 1_000_000) * (COST_PER_1M_INPUT[modelKey] || 0.30);
      const outputCost = (metrics.outputTokens / 1_000_000) * (COST_PER_1M_OUTPUT[modelKey] || 0.60);
      nodeTrace.estimatedCostUsd = Math.round((inputCost + outputCost) * 100000) / 100000;

      // Accumulate totals
      this.trace.totals.inputTokens += metrics.inputTokens;
      this.trace.totals.outputTokens += metrics.outputTokens;
      this.trace.totals.totalTokens += metrics.totalTokens;
      this.trace.totals.estimatedCostUsd += nodeTrace.estimatedCostUsd;
    }

    this.trace.totals.nodesCompleted++;
    this.trace.nodeTraces.push(nodeTrace);
    this.activeNodes.delete(nodeId);

    this.log("info", `Node completed: ${nodeId}`, {
      durationMs: nodeTrace.durationMs,
      tokens: nodeTrace.totalTokens,
      ...(metrics?.retryCount ? { retries: metrics.retryCount } : {}),
      ...(metrics?.fallbackModel ? { fallback: metrics.fallbackModel } : {}),
    });
  }

  /**
   * Record that a node has failed.
   */
  nodeFailed(nodeId: string, error: string, metrics?: Partial<LLMCallMetrics>): void {
    const nodeTrace = this.activeNodes.get(nodeId) || {
      nodeId,
      startedAt: Date.now(),
    } as NodeTrace;

    nodeTrace.completedAt = Date.now();
    nodeTrace.durationMs = nodeTrace.completedAt - nodeTrace.startedAt;
    nodeTrace.status = "failed";
    nodeTrace.error = error;

    if (metrics) {
      nodeTrace.retryCount = metrics.retryCount;
      nodeTrace.fallbackModel = metrics.fallbackModel;
      nodeTrace.model = metrics.model;
    }

    this.trace.totals.nodesFailed++;
    this.trace.nodeTraces.push(nodeTrace);
    this.activeNodes.delete(nodeId);

    this.log("error", `Node failed: ${nodeId}`, { error, retries: metrics?.retryCount });
  }

  /**
   * Finalize the trace and return the complete pipeline trace object.
   */
  finalize(status?: "completed" | "partial" | "failed"): PipelineTrace {
    this.trace.completedAt = Date.now();
    this.trace.totalDurationMs = this.trace.completedAt - this.trace.startedAt;
    this.trace.status = status || (this.trace.totals.nodesFailed > 0 ? "partial" : "completed");

    // Round cost to 5 decimal places
    this.trace.totals.estimatedCostUsd =
      Math.round(this.trace.totals.estimatedCostUsd * 100000) / 100000;

    this.log("info", `Pipeline ${this.trace.status}`, {
      totalDurationMs: this.trace.totalDurationMs,
      nodesCompleted: this.trace.totals.nodesCompleted,
      nodesFailed: this.trace.totals.nodesFailed,
      totalTokens: this.trace.totals.totalTokens,
      estimatedCostUsd: `$${this.trace.totals.estimatedCostUsd}`,
    });

    return this.trace;
  }

  /**
   * Get the current trace (for mid-pipeline inspection).
   */
  getTrace(): PipelineTrace {
    return { ...this.trace };
  }

  /**
   * Get the trace ID.
   */
  getTraceId(): string {
    return this.trace.traceId;
  }

  // ── Internal structured log ───────────────────────────────────────────────

  private log(level: LogLevel, message: string, data?: Record<string, any>): void {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL]) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      pipeline: this.trace.traceId,
      message,
      ...(data || {}),
    };

    // Structured JSON output — easy to parse in Cloud Run / GCP Logging
    const output = JSON.stringify(entry);

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }
}

// ── Singleton-style factory ─────────────────────────────────────────────────

let _activeLogger: PipelineLogger | null = null;

/**
 * Create a new pipeline logger for a graph run.
 * Only one can be active at a time (server-side, per-request).
 */
export function createPipelineLogger(traceId?: string): PipelineLogger {
  _activeLogger = new PipelineLogger(traceId);
  return _activeLogger;
}

/**
 * Get the currently active pipeline logger.
 * Returns null if no pipeline is running.
 */
export function getActivePipelineLogger(): PipelineLogger | null {
  return _activeLogger;
}
