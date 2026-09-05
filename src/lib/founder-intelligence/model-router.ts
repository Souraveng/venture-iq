// ──────────────────────────────────────────────────────────────────────────────
// Replaced with Vertex AI Gemini API via OpenAI-compatible endpoints
// With dynamic OAuth 2.0 Token generation using service account credentials.
// ──────────────────────────────────────────────────────────────────────────────

import { PipelineLogger } from "./pipeline-logger";
import { abortContext } from "./abort-context";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const REGION = "us-central1";
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const VERTEX_BASE_URL = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/endpoints/openapi/chat/completions`;
const VERTEX_EMBED_URL = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/endpoints/openapi/embeddings`;

// ── Cache for OAuth Access Token ──────────────────────────────────────────
let cachedAccessToken: string | null = null;
let tokenExpiryTime = 0; // Epoch time in ms

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiryTime - 60000) {
    return cachedAccessToken;
  }

  let keyFile: any = null;

  // 1. Try reading from Base64 Environment Variable (e.g., Vercel / non-GCP hosting)
  if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
    try {
      const decoded = Buffer.from(process.env.GCP_SERVICE_ACCOUNT_KEY, "base64").toString("utf-8");
      keyFile = JSON.parse(decoded);
    } catch (e) {
      // If parsing base64 failed, try parsing as raw JSON
      try {
        keyFile = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
      } catch (err) {
        console.error("[Gemini Auth] Failed to parse GCP_SERVICE_ACCOUNT_KEY env variable.");
      }
    }
  }

  // 2. Try reading from Local JSON File (Development environment)
  if (!keyFile) {
    const keyFilePath = process.env.GCP_KEY_FILE_PATH;
    const keyPath = keyFilePath ? path.resolve(keyFilePath) : "";
    if (keyPath && fs.existsSync(keyPath)) {
      try {
        keyFile = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
      } catch (e) {
        console.error(`[Gemini Auth] Failed to parse service account key file at ${keyPath}`);
      }
    }
  }

  // 3. If key file content is found (either via Env or File), sign JWT
  if (keyFile) {
    const { client_email, private_key, token_uri } = keyFile;

    if (!client_email || !private_key) {
      throw new Error("[Gemini Auth] Invalid service account key structure.");
    }

    const header = { alg: "RS256", typ: "JWT" };
    const iat = Math.floor(now / 1000);
    const exp = iat + 3600; // 1 hour expiry
    const claimSet = {
      iss: client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: token_uri || "https://oauth2.googleapis.com/token",
      exp,
      iat,
    };

    const base64UrlEncode = (str: string) =>
      Buffer.from(str)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const claimB64 = base64UrlEncode(JSON.stringify(claimSet));
    const signatureInput = `${headerB64}.${claimB64}`;

    const sign = crypto.createSign("RSA-SHA256");
    sign.update(signatureInput);
    const signature = sign.sign(private_key);
    const signatureB64 = signature
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const jwt = `${signatureInput}.${signatureB64}`;

    const res = await fetch(token_uri || "https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[Gemini Auth] Failed to exchange JWT for access token: ${errText}`);
    }

    const data = (await res.json()) as any;
    if (!data.access_token) {
      throw new Error("[Gemini Auth] Access token not found in token response.");
    }

    cachedAccessToken = data.access_token;
    tokenExpiryTime = now + (data.expires_in || 3600) * 1000;
    return cachedAccessToken!;
  }

  // 4. Fallback: Try GCP Metadata Server (For zero-key Cloud Run deployments)
  try {
    const res = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      {
        headers: { "Metadata-Flavor": "Google" },
      }
    );
    if (res.ok) {
      const data = (await res.json()) as any;
      cachedAccessToken = data.access_token;
      tokenExpiryTime = now + (data.expires_in || 3600) * 1000;
      return cachedAccessToken!;
    }
  } catch (e) {
    // metadata server not reachable (not running inside GCP container)
  }

  throw new Error(
    "[Gemini Auth] Service account credentials not found. Please provide access credentials via one of:\n" +
      "1. Base64 or raw JSON service account string inside the 'GCP_SERVICE_ACCOUNT_KEY' environment variable,\n" +
      "2. A local JSON file '<GCP_KEY_FILE_PATH>' in the root directory, or\n" +
      "3. Running on GCP Cloud Run with default compute service account permissions."
  );
}

// ── Helper to convert schema types to uppercase for Vertex AI ──────────────
function uppercaseSchemaTypes(schema: any): any {
  if (!schema || typeof schema !== "object") return schema;

  const result = { ...schema };
  if (typeof result.type === "string") {
    result.type = result.type.toUpperCase();
  }
  
  if (result.properties && typeof result.properties === "object") {
    const newProps: Record<string, any> = {};
    for (const key of Object.keys(result.properties)) {
      newProps[key] = uppercaseSchemaTypes(result.properties[key]);
    }
    result.properties = newProps;
  }

  if (result.items && typeof result.items === "object") {
    result.items = uppercaseSchemaTypes(result.items);
  }

  return result;
}

// ── Retry Configuration ─────────────────────────────────────────────────────
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 800,
  maxDelayMs: 5000,
  nonRetryableStatuses: new Set([400, 401, 403, 404, 422]),
};

// ── Model Fallback Chain ────────────────────────────────────────────────────
const MODEL_FALLBACKS: Partial<Record<VertexModelKey, VertexModelKey>> = {};

// ── Model IDs mapped to pipeline tasks (Different models for different purposes) ─
export const VERTEX_MODELS = {
  /** Opportunity & Planning (Orchestrator - Deep Reasoning) */
  orchestrator: "google/gemini-2.5-pro",
  /** Financial narrative (Fast Agentic) */
  financial: "google/gemini-2.5-flash",
  /** Research & Extraction worker (Search Grounding) */
  researcher: "google/gemini-2.5-flash",
  /** Market/Competitor worker (Fast Agentic) */
  market_analyst: "google/gemini-2.5-flash",
  /** Risk & SWOT worker (Deep Reasoning) */
  risk_analyst: "google/gemini-2.5-pro",
  /** Venture Synthesis (Deep Reasoning) */
  synthesis: "google/gemini-2.5-pro",
  /** Roadmap & Report (Deep Reasoning) */
  roadmap: "google/gemini-2.5-pro",
  /** Multimodal & High-Density Embeddings for Vector Store (RAG) */
  embed: "google/text-embedding-004",

  // Legacy mappings for backward compatibility of other modules
  nemotron: "google/gemini-2.5-flash",
  maverick: "google/gemini-2.5-flash",
  glm: "google/gemini-2.5-flash",
  deepseek: "google/gemini-2.5-pro",
} as const;

// Backward-compatible alias
export const NIM_MODELS = VERTEX_MODELS;

export type VertexModelKey = keyof typeof VERTEX_MODELS;
export type NimModelKey = VertexModelKey;

// ── Core types ──────────────────────────────────────────────────────────────
interface VertexMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface VertexCallOptions {
  model: VertexModelKey;
  messages: VertexMessage[];
  temperature?: number;
  maxTokens?: number;
  guidedJson?: Record<string, any>;
  logger?: PipelineLogger;
  nodeId?: string;
}
export type NimCallOptions = VertexCallOptions;

export interface VertexResponse {
  content: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  _meta: {
    requestedModel: VertexModelKey;
    actualModel: VertexModelKey;
    retryCount: number;
    fallbackUsed: boolean;
  };
}
export type NimResponse = VertexResponse;

// ── Utilities ───────────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffDelay(attempt: number, retryAfterMs?: number): number {
  if (retryAfterMs && retryAfterMs > 0) {
    return Math.min(retryAfterMs, RETRY_CONFIG.maxDelayMs);
  }
  const exponential = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 200;
  return Math.min(exponential + jitter, RETRY_CONFIG.maxDelayMs);
}

// ── Core fetch wrapper (single attempt) ─────────────────────────────────────
async function callVertexModel(
  modelId: string,
  messages: VertexMessage[],
  options: { apiKey: string; temperature?: number; maxTokens?: number; guidedJson?: Record<string, any> }
): Promise<VertexResponse & { _modelKey?: VertexModelKey }> {
  const { apiKey } = options;

  const body: Record<string, any> = {
    model: modelId,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: Math.max(options.maxTokens ?? 8192, 4096),
    stream: false,
  };

  // Gemini/OpenAI standard structured output format
  if (options.guidedJson) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "response_schema",
        schema: options.guidedJson,
      },
    };
  }

  const signal = abortContext.getStore();

  const res = await fetch(VERTEX_BASE_URL, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    const error: any = new Error(`[Vertex AI] ${res.status} ${res.statusText}: ${errorText}`);
    error.status = res.status;
    const retryAfter = res.headers.get("retry-after");
    if (retryAfter) {
      error.retryAfterMs = parseInt(retryAfter, 10) * 1000;
    }
    throw error;
  }

  const json = (await res.json()) as any;
  const choice = json.choices?.[0];

  if (!choice?.message?.content) {
    throw new Error("[Vertex AI] Empty response from model.");
  }

  return {
    content: choice.message.content,
    model: json.model || modelId,
    usage: json.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    _meta: {
      requestedModel: "orchestrator" as VertexModelKey,
      actualModel: "orchestrator" as VertexModelKey,
      retryCount: 0,
      fallbackUsed: false,
    },
  };
}

// ── Retry + Fallback wrapper ────────────────────────────────────────────────
async function callWithRetryAndFallback(
  options: VertexCallOptions
): Promise<VertexResponse> {
  const { model, messages, temperature, maxTokens, guidedJson, logger, nodeId } = options;
  let lastError: Error | null = null;
  let totalRetries = 0;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      const apiKey = await getAccessToken();
      const modelId = VERTEX_MODELS[model];
      const response = await callVertexModel(modelId, messages, {
        apiKey,
        temperature,
        maxTokens,
        guidedJson,
      });

      response._meta = {
        requestedModel: model,
        actualModel: model,
        retryCount: attempt,
        fallbackUsed: false,
      };

      if (logger && nodeId) {
        logger.nodeComplete(nodeId, {
          model,
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          retryCount: attempt,
        });
      }

      return response;
    } catch (err: any) {
      lastError = err;
      totalRetries = attempt + 1;

      if (err.status && RETRY_CONFIG.nonRetryableStatuses.has(err.status)) {
        break;
      }

      if (attempt < RETRY_CONFIG.maxAttempts - 1) {
        const delay = getBackoffDelay(attempt, err.retryAfterMs);
        await sleep(delay);
      }
    }
  }

  const fallbackModelKey = MODEL_FALLBACKS[model];
  if (fallbackModelKey) {
    try {
      const fallbackApiKey = await getAccessToken();
      const fallbackModelId = VERTEX_MODELS[fallbackModelKey];

      const response = await callVertexModel(fallbackModelId, messages, {
        apiKey: fallbackApiKey,
        temperature,
        maxTokens,
        guidedJson,
      });

      response._meta = {
        requestedModel: model,
        actualModel: fallbackModelKey,
        retryCount: totalRetries,
        fallbackUsed: true,
      };

      if (logger && nodeId) {
        logger.nodeComplete(nodeId, {
          model: fallbackModelKey,
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          retryCount: totalRetries,
          fallbackModel: fallbackModelKey,
        });
      }

      return response;
    } catch (fallbackErr: any) {
      if (logger && nodeId) {
        logger.nodeFailed(nodeId, `Primary (${model}) and fallback (${fallbackModelKey}) both failed`, {
          model,
          retryCount: totalRetries,
          fallbackModel: fallbackModelKey,
        });
      }

      const combinedError: any = new Error(
        `[Vertex AI] Primary model "${model}" failed after ${totalRetries} retries, ` +
        `fallback "${fallbackModelKey}" also failed: ${fallbackErr.message}`
      );
      combinedError.primaryError = lastError;
      combinedError.fallbackError = fallbackErr;
      throw combinedError;
    }
  }

  if (logger && nodeId) {
    logger.nodeFailed(nodeId, lastError?.message || "Unknown error", {
      model,
      retryCount: totalRetries,
    });
  }

  throw lastError || new Error(`[Vertex AI] All retry attempts exhausted for model "${model}"`);
}

// ── Public API ──────────────────────────────────────────────────────────────
export async function vertexAiCall(options: VertexCallOptions): Promise<VertexResponse> {
  return callWithRetryAndFallback(options);
}
export const nimCall = vertexAiCall;

export async function vertexAiCallJSON<T>(options: VertexCallOptions): Promise<T> {
  const response = await callWithRetryAndFallback({
    ...options,
    logger: undefined,
    nodeId: undefined,
  });

  let content = response.content.trim();
  if (content.startsWith("```json")) {
    content = content.slice(7);
  }
  if (content.startsWith("```")) {
    content = content.slice(3);
  }
  if (content.endsWith("```")) {
    content = content.slice(0, -3);
  }

  content = content.trim();
  try {
    const parsed = JSON.parse(content) as T;

    if (options.logger && options.nodeId) {
      options.logger.nodeComplete(options.nodeId, {
        model: response._meta.actualModel,
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        retryCount: response._meta.retryCount,
        ...(response._meta.fallbackUsed ? { fallbackModel: response._meta.actualModel } : {}),
      });
    }

    return parsed;
  } catch (err: any) {
    console.error(`[vertexAiCallJSON] Failed to parse JSON. Raw content length: ${content.length}\n--- RAW CONTENT START ---\n${content}\n--- RAW CONTENT END ---`);
    throw err;
  }
}
export const nimCallJSON = vertexAiCallJSON;

export interface EmbedOptions {
  taskType?: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" | "SEMANTIC_SIMILARITY" | "CLASSIFICATION" | "CLUSTERING";
  title?: string;
}

export async function vertexAiEmbed(input: string[], options?: EmbedOptions): Promise<number[][]> {
  const rawModelId = VERTEX_MODELS.embed.replace(/^google\//, "");
  const apiKey = await getAccessToken();
  const isGemini = rawModelId.includes("gemini");
  
  // Format inputs based on Gemini task prefixes
  const formattedInputs = input.map(txt => {
    if (isGemini && options?.taskType) {
      if (options.taskType === "RETRIEVAL_QUERY") {
        return `task: search result | query: ${txt}`;
      } else if (options.taskType === "RETRIEVAL_DOCUMENT") {
        const title = options.title ? options.title : "none";
        return `title: ${title} | text: ${txt}`;
      } else if (options.taskType === "SEMANTIC_SIMILARITY") {
        return `task: sentence similarity | query: ${txt}`;
      } else if (options.taskType === "CLASSIFICATION") {
        return `task: classification | query: ${txt}`;
      } else if (options.taskType === "CLUSTERING") {
        return `task: clustering | query: ${txt}`;
      }
    }
    return txt;
  });
  
  // Use v1beta1 and embedContent for Gemini, v1 and predict for legacy text models
  const apiVersion = isGemini ? "v1beta1" : "v1";
  const action = isGemini ? "embedContent" : "predict";
  const endpoint = `https://${REGION}-aiplatform.googleapis.com/${apiVersion}/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${rawModelId}:${action}`;
  
  // Fallback for gemini: process all inputs concurrently
  if (isGemini) {
    const embeddings = await Promise.all(formattedInputs.map(async (txt) => {
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
        try {
          const signal = abortContext.getStore();
          const res = await fetch(endpoint, {
            method: "POST",
            signal,
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              content: { role: "user", parts: [{ text: txt }] },
            }),
          });
          
          if (!res.ok) {
            const errorText = await res.text().catch(() => "Unknown error");
            const error: any = new Error(`[Vertex AI Embed] ${res.status} ${res.statusText}: ${errorText}`);
            error.status = res.status;
            if (RETRY_CONFIG.nonRetryableStatuses.has(res.status)) throw error;
            throw error;
          }
          
          const json = await res.json() as any;
          if (!json.embedding || !json.embedding.values) {
             throw new Error("[Vertex AI Embed] Invalid response format from gemini embedding API.");
          }
          return json.embedding.values;
        } catch (err: any) {
          lastError = err;
          if (err.status && RETRY_CONFIG.nonRetryableStatuses.has(err.status)) break;
          if (attempt < RETRY_CONFIG.maxAttempts - 1) {
            await sleep(getBackoffDelay(attempt));
          }
        }
      }
      throw lastError || new Error("[Vertex AI Embed] All retry attempts exhausted");
    }));
    
    return embeddings.map((emb: number[]) => {
      const padded = [...emb];
      while (padded.length < 1024) { padded.push(0); }
      return padded;
    });
  }

  // Legacy predict for text-embedding
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      const signal = abortContext.getStore();
      const res = await fetch(endpoint, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          instances: input.map((txt) => {
            const instance: any = { content: txt };
            if (options?.taskType) {
              instance.task_type = options.taskType;
            }
            if (options?.title) {
              instance.title = options.title;
            }
            return instance;
          }),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        const error: any = new Error(`[Vertex AI Embed] ${res.status} ${res.statusText}: ${errorText}`);
        error.status = res.status;
        if (RETRY_CONFIG.nonRetryableStatuses.has(res.status)) throw error;
        throw error;
      }

      const json = (await res.json()) as any;
      if (!json.predictions || !Array.isArray(json.predictions)) {
        throw new Error("[Vertex AI Embed] Invalid response format from embedding API.");
      }

      const rawEmbeddings = json.predictions.map((p: any) => p.embeddings?.values);

      // Pad embeddings from 768 dimensions to 1024 dimensions (for Cosmos DB compatibility)
      return rawEmbeddings.map((emb: number[]) => {
        const padded = [...emb];
        while (padded.length < 1024) {
          padded.push(0);
        }
        return padded;
      });
    } catch (err: any) {
      lastError = err;
      if (err.status && RETRY_CONFIG.nonRetryableStatuses.has(err.status)) break;
      if (attempt < RETRY_CONFIG.maxAttempts - 1) {
        await sleep(getBackoffDelay(attempt));
      }
    }
  }

  throw lastError || new Error("[Vertex AI Embed] All retry attempts exhausted");
}
export const nimEmbed = vertexAiEmbed;

// ── Native Google Search Grounding Endpoint for Research Worker ─────────────────
export async function vertexAiCallGroundingJSON<T>(options: {
  model: VertexModelKey;
  prompt: string;
  systemInstruction?: string;
  guidedJson?: Record<string, any>;
}): Promise<T> {
  const apiKey = await getAccessToken();
  const rawModelId = VERTEX_MODELS[options.model].replace(/^google\//, "");
  
  const endpoint = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${rawModelId}:generateContent`;

  let promptWithSchema = options.prompt;
  if (options.guidedJson) {
    promptWithSchema += `\n\nIMPORTANT: Format your response STRICTLY as a JSON object matching this schema:\n${JSON.stringify(options.guidedJson)}\nDo not include any conversational filler, markdown block wraps, or explanations. Just output the raw JSON object string.`;
  }

  const body: Record<string, any> = {
    contents: [
      {
        role: "user",
        parts: [{ text: promptWithSchema }]
      }
    ],
    tools: [
      {
        google_search: {}
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    }
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }]
    };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`[Vertex AI Grounding] ${res.status} ${res.statusText}: ${errorText}`);
  }

  const json = (await res.json()) as any;
  const contentText = json.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!contentText) {
    throw new Error("[Vertex AI Grounding] Empty response from model.");
  }

  let text = contentText.trim();
  if (text.startsWith("```json")) {
    text = text.slice(7);
  }
  if (text.startsWith("```")) {
    text = text.slice(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }

  return JSON.parse(text.trim()) as T;
}
export const nimCallGroundingJSON = vertexAiCallGroundingJSON;

