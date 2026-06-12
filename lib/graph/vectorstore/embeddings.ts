// lib/graph/vectorstore/embeddings.ts
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { apiKeyStorage } from "../llm";

export class EmbeddingService {
  private cache: Map<string, number[]>;
  
  // Explicit embedding model and version to handle model updates
  public readonly modelName = "gemini-embedding-2";
  public readonly version = "gemini-embedding-2-v1";
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
    const apiKey = userKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "placeholder-key-for-build";

    // 3. Fallback mock vector if API Key is placeholder (e.g., during Next.js build time)
    if (!apiKey || apiKey === "placeholder-key-for-build") {
      // Mock a 768-dimension vector
      const mockVector = new Array(this.dimensions).fill(0).map((_, i) => Math.sin(i) * 0.1);
      this.cache.set(normalizedText, mockVector);
      return mockVector;
    }

    // 4. Retry loop with exponential backoff
    let attempt = 0;
    let delay = 1000;

    const dynamicClient = new GoogleGenerativeAIEmbeddings({
      modelName: this.modelName,
      apiKey: apiKey,
    });

    while (attempt < retries) {
      try {
        const embeddings = await dynamicClient.embedQuery(normalizedText);
        if (embeddings && embeddings.length > 0) {
          // Verify dimension correctness
          if (embeddings.length === this.dimensions) {
            this.cache.set(normalizedText, embeddings);
            return embeddings;
          }
          console.warn(`Embedding returned incorrect dimension: ${embeddings.length}. Expected ${this.dimensions}.`);
        }
        throw new Error("Empty embedding returned from Google API");
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
