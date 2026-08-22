import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Stores the AbortSignal for the current request.
 * This allows deeply nested agent nodes to cancel LLM API calls
 * when the client disconnects, without threading the signal through every function.
 */
export const abortContext = new AsyncLocalStorage<AbortSignal>();
