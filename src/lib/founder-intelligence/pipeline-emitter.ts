// ──────────────────────────────────────────────────────────────────────────────
// Pipeline Emitter — Real-time node progress events for SSE streaming
// Zero external dependencies, uses Node EventEmitter pattern
// ──────────────────────────────────────────────────────────────────────────────

export type NodeStatus = "started" | "completed" | "failed" | "skipped";

export interface NodeEvent {
  node: string;
  nodeId?: string;
  status: NodeStatus;
  timestamp: number;
  preview?: string;       // Short human-readable preview of what the node produced
  durationMs?: number;    // Only on completed/failed
  error?: string;         // Only on failed
  progress?: number;      // 0-100 overall pipeline progress estimate
}

// Callback type for pipeline consumers
export type NodeEventCallback = (event: NodeEvent) => void;

// ── Node weight map for accurate progress calculation ───────────────────────
// Weights reflect actual execution time (not equal distribution)
// Mitigates "fake progress" con by using real empirical node durations

const NODE_WEIGHTS: Record<string, number> = {
  "input-validation":     2,   // ~instant (deterministic)
  "opportunity-planning": 10,  // ~3-5s (LLM call)
  "cache-evaluator":      8,   // ~2-4s (LLM + vector search)
  "research-extraction":  20,  // ~5-15s (Tavily loop + LLM)
  "vector-store":         3,   // ~1-2s (embedding + upsert)
  "rule-validation":      2,   // ~instant (deterministic)
  "market-competitor":    12,  // ~3-6s (LLM call)
  "risk-swot":            15,  // ~4-8s (DeepSeek CoT)
  "financial-engine":     8,   // ~2-4s (math + LLM narrative)
  "decision-scorecard":   2,   // ~instant (deterministic)
  "venture-synthesis":    8,   // ~2-5s (LLM call)
  "roadmap-report":       10,  // ~3-6s (LLM call, large output)
};

const TOTAL_WEIGHT = Object.values(NODE_WEIGHTS).reduce((a, b) => a + b, 0);

/**
 * PipelineEmitter — lightweight event dispatcher for pipeline progress.
 * 
 * Usage:
 *   const emitter = new PipelineEmitter((event) => stream.write(event));
 *   emitter.emit("market-competitor", "started");
 *   emitter.emit("market-competitor", "completed", { preview: "Market score: 87/100" });
 */
export class PipelineEmitter {
  private callback: NodeEventCallback;
  private completedWeight: number = 0;
  private startTime: number;

  constructor(callback: NodeEventCallback) {
    this.callback = callback;
    this.startTime = Date.now();
  }

  /**
   * Emit a node event to all listeners.
   */
  emit(
    node: string,
    status: NodeStatus,
    extra?: { preview?: string; error?: string }
  ): void {
    const now = Date.now();

    if (status === "completed" || status === "skipped") {
      this.completedWeight += NODE_WEIGHTS[node] || 5;
    }

    const progress = Math.min(
      Math.round((this.completedWeight / TOTAL_WEIGHT) * 100),
      status === "completed" && node === "roadmap-report" ? 100 : 98
    );

    const event: NodeEvent = {
      node,
      nodeId: node,
      status,
      timestamp: now,
      progress,
      ...(extra?.preview ? { preview: extra.preview } : {}),
      ...(extra?.error ? { error: extra.error } : {}),
      ...(status !== "started" ? { durationMs: now - this.startTime } : {}),
    };

    try {
      this.callback(event);
    } catch (err) {
      // Swallow callback errors — never let emitter crash the pipeline
      console.warn(`[PipelineEmitter] Callback error for ${node}:${status}`, err);
    }
  }

  /**
   * Get current progress percentage.
   */
  getProgress(): number {
    return Math.min(Math.round((this.completedWeight / TOTAL_WEIGHT) * 100), 100);
  }
}

/**
 * Create a no-op emitter for when streaming isn't needed (e.g., /api/validations POST).
 * Mitigates backwards compatibility con — old endpoint works unchanged.
 */
export function createNoopEmitter(): PipelineEmitter {
  return new PipelineEmitter(() => {});
}
