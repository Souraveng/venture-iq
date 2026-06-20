// lib/graph/vectorstore/embeddings.ts
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { apiKeyStorage } from "../llm";

async function queryCloudflareEmbedding(text: string, apiToken: string, accountId: string): Promise<number[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/baai/bge-base-en-v1.5`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudflare Embedding API status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (!data.success) {
    const errors = data.errors ? JSON.stringify(data.errors) : "Unknown error";
    throw new Error(`Cloudflare Embedding API Error: ${errors}`);
  }

  const vector = data.result?.data?.[0];
  if (!vector || !Array.isArray(vector)) {
    throw new Error("Invalid embedding response structure from Cloudflare");
  }
  return vector;
}

export class EmbeddingService {
  private cache: Map<string, number[]>;
  private static cloudflareExhausted = false;
  
  // BUG-16 FIX: "gemini-embedding-2" is not a valid Google API model name.
  // "text-embedding-004" is the correct current model and outputs 768 dims by default,
  // matching the Cloudflare bge-base-en-v1.5 output dimension.
  public readonly modelName = "text-embedding-004";
  // BUG-9 FIX: Target dimension for all embeddings. Both Cloudflare bge-base-en-v1.5
  // and Google text-embedding-004 default to 768. Any mismatch is normalized below.
  public readonly dimensions = 768;

  constructor() {
    this.cache = new Map<string, number[]>();
  }

  /**
   * Generates embedding vector for a single text string with cache checking and retries.
   */
  public async getEmbedding(text: string, retries: number = 3): Promise<number[]> {
    const normalizedText = text.trim().toLowerCase();
    
    // 1. Check cache first
    if (this.cache.has(normalizedText)) {
      return this.cache.get(normalizedText)!;
    }

    // 2. Resolve API key dynamically from request storage or env
    const keys = apiKeyStorage.getStore();
    const userKey = typeof keys === "object" ? keys?.geminiApiKey : keys;
    const apiKey = (userKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "").trim();

    const userCfToken = typeof keys === "object" ? keys?.cloudflareApiToken : undefined;
    const userCfAccount = typeof keys === "object" ? keys?.cloudflareAccountId : undefined;
    const cfToken = (userCfToken || process.env.CLOUDFLARE_API || "").trim();
    const cfAccount = (userCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();

    // 3. Fallback mock vector if API Key is placeholder (e.g., during Next.js build time)
    if (!cfToken && !apiKey) {
      // Mock a 768-dimension vector
      const mockVector = new Array(this.dimensions).fill(0).map((_, i) => Math.sin(i) * 0.1);
      this.cache.set(normalizedText, mockVector);
      return mockVector;
    }

    // 4. Retry loop with exponential backoff
    let attempt = 0;
    let delay = 1000;

    while (attempt < retries) {
      try {
        let embeddings: number[] | null = null;
        
        if (cfToken && cfAccount && !EmbeddingService.cloudflareExhausted) {
          console.log(`[Embedding] Querying Cloudflare Workers AI embedding for "${text.substring(0, 40)}..."`);
          try {
            embeddings = await queryCloudflareEmbedding(normalizedText, cfToken, cfAccount);
          } catch (cfErr: any) {
            const errLower = (cfErr.message || "").toLowerCase();
            if (errLower.includes("429") || errLower.includes("neurons") || errLower.includes("allocation") || errLower.includes("limit")) {
              console.warn("[Embedding] Cloudflare quota exhausted. Permanently switching to Google Embeddings for this session.");
              EmbeddingService.cloudflareExhausted = true;
              // Do NOT re-throw on quota errors — fall through to Google embedding block on same attempt
            } else {
              throw cfErr; // Re-throw non-quota errors (auth, network, etc.)
            }
          }
        }
        
        if (!embeddings && apiKey && apiKey !== "placeholder-key-for-build") {
          console.log(`[Embedding] Querying Google Generative AI embedding for "${text.substring(0, 40)}..."`);
          const dynamicClient = new GoogleGenerativeAIEmbeddings({
            modelName: this.modelName,
            apiKey: apiKey,
          });
          embeddings = await dynamicClient.embedQuery(normalizedText);
        }

        if (embeddings && embeddings.length > 0) {
          // BUG-9 FIX: Previously, any dimension mismatch caused the code to fall through
          // to `throw new Error("Empty embedding...")` which triggered retries and ultimately
          // the Math.sin() fallback, making RAG completely useless.
          // Now: if the vector is valid but wrong size, normalize it rather than discarding it.
          let finalEmbedding = embeddings;
          if (embeddings.length !== this.dimensions) {
            console.warn(
              `[Embedding] Dimension mismatch: got ${embeddings.length}, expected ${this.dimensions}. Normalizing vector.`
            );
            if (embeddings.length > this.dimensions) {
              // Truncate to target dimensions
              finalEmbedding = embeddings.slice(0, this.dimensions);
            } else {
              // Pad with zeros to reach target dimensions
              finalEmbedding = [...embeddings, ...new Array(this.dimensions - embeddings.length).fill(0)];
            }
          }
          this.cache.set(normalizedText, finalEmbedding);
          return finalEmbedding;
        }
        throw new Error("Empty or null embedding returned from provider");
      } catch (err: any) {
        const errMsg = err.message || "";
        const lowerMsg = errMsg.toLowerCase();
        
        let isAuthError = lowerMsg.includes("api key") || 
                          lowerMsg.includes("apikey") || 
                          lowerMsg.includes("auth") || 
                          lowerMsg.includes("key not found") || 
                          lowerMsg.includes("key not valid") || 
                          lowerMsg.includes("api_key_invalid") || 
                          lowerMsg.includes("api_key_service_blocked");
                            
        if (err.errorDetails && Array.isArray(err.errorDetails)) {
          for (const detail of err.errorDetails) {
            const reason = (detail.reason || "").toLowerCase();
            const message = (detail.message || "").toLowerCase();
            if (reason.includes("key") || message.includes("key") || reason.includes("auth")) {
              isAuthError = true;
              break;
            }
          }
        }
                            
        if (isAuthError) {
          console.warn(`Embedding authentication failed immediately: ${errMsg}. Skipping retries.`);
          break;
        }

        attempt++;
        console.error(`Embedding failed (Attempt ${attempt}/${retries}) for text "${text.substring(0, 40)}...":`, errMsg);
        
        if (attempt >= retries) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    // 5. Safety fallback vector to prevent breaking execution in production
    console.warn(`Using fallback vector for text: "${text.substring(0, 40)}..."`);
    const fallbackVector = new Array(this.dimensions).fill(0).map((_, i) => Math.sin(i * 99) * 0.1);
    this.cache.set(normalizedText, fallbackVector);
    return fallbackVector;
  }

  /**
   * Generates embedding vectors for a batch of text strings, utilizing the cache where possible.
   */
  public async getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    
    // Map each query to its embedding promise
    const promises = texts.map((t) => this.getEmbedding(t));
    return await Promise.all(promises);
  }

  /**
   * Clears the embedding cache.
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Returns cache size.
   */
  public cacheSize(): number {
    return this.cache.size;
  }
}
