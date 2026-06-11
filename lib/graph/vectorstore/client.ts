// lib/graph/vectorstore/client.ts
import { ChromaClient } from "chromadb";
import { VectorMetadata, RetrievedKnowledge } from "./types";

// Mathematical helper functions for local Cosine Similarity fallback
function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
}

function magnitude(a: number[]): number {
  return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

interface LocalDoc {
  id: string;
  content: string;
  metadata: VectorMetadata;
  embedding: number[];
}

export class VectorStoreClient {
  private chroma: ChromaClient | null = null;
  private isUsingFallback = false;
  // Local in-memory collections fallback
  private static localDb: Map<string, LocalDoc[]> = new Map();

  constructor() {
    const chromaUrl = process.env.CHROMADB_URL || "http://localhost:8000";
    try {
      this.chroma = new ChromaClient({ path: chromaUrl });
      console.log(`Connecting to ChromaDB client at: ${chromaUrl}`);
    } catch (err) {
      console.warn("Could not instantiate ChromaClient. Falling back to local in-memory store.");
      this.isUsingFallback = true;
    }
  }

  /**
   * Pings the ChromaDB endpoint. If it fails, fallback is enabled.
   */
  public async initialize(): Promise<void> {
    if (this.isUsingFallback || !this.chroma) {
      this.enableFallback();
      return;
    }

    try {
      // Direct health check
      const version = await this.chroma.version();
      console.log(`Successfully connected to ChromaDB server (version: ${version})`);
    } catch (err) {
      console.warn("ChromaDB server connection failed. Enabling resilient in-memory vector store fallback.");
      this.enableFallback();
    }
  }

  private enableFallback() {
    this.isUsingFallback = true;
    this.chroma = null;
  }

  /**
   * Checks if using fallback
   */
  public usingFallback(): boolean {
    return this.isUsingFallback;
  }

  /**
   * Inserts or updates a document with its metadata and embedding vector
   */
  public async upsert(
    collectionName: string,
    id: string,
    content: string,
    metadata: VectorMetadata,
    embedding: number[]
  ): Promise<void> {
    if (this.isUsingFallback) {
      if (!VectorStoreClient.localDb.has(collectionName)) {
        VectorStoreClient.localDb.set(collectionName, []);
      }
      
      const list = VectorStoreClient.localDb.get(collectionName)!;
      // Remove if duplicate ID exists (acts as upsert)
      const filtered = list.filter(d => d.id !== id);
      filtered.push({ id, content, metadata, embedding });
      VectorStoreClient.localDb.set(collectionName, filtered);
      return;
    }

    try {
      const collection = await this.chroma!.getOrCreateCollection({ name: collectionName });
      await collection.upsert({
        ids: [id],
        embeddings: [embedding],
        metadatas: [metadata as any],
        documents: [content],
      });
    } catch (err) {
      console.error(`ChromaDB upsert failed for ${collectionName}. Falling back to in-memory store.`, err);
      this.enableFallback();
      await this.upsert(collectionName, id, content, metadata, embedding);
    }
  }

  /**
   * Deletes a document by ID from a specific collection
   */
  public async delete(collectionName: string, id: string): Promise<void> {
    if (this.isUsingFallback) {
      if (VectorStoreClient.localDb.has(collectionName)) {
        const list = VectorStoreClient.localDb.get(collectionName)!;
        const filtered = list.filter(d => d.id !== id);
        VectorStoreClient.localDb.set(collectionName, filtered);
      }
      return;
    }

    try {
      const collection = await this.chroma!.getOrCreateCollection({ name: collectionName });
      await collection.delete({ ids: [id] });
    } catch (err) {
      console.error(`ChromaDB delete failed for ${collectionName}. Falling back to in-memory store.`, err);
      this.enableFallback();
      await this.delete(collectionName, id);
    }
  }

  /**
   * Drops a collection entirely
   */
  public async dropCollection(collectionName: string): Promise<void> {
    if (this.isUsingFallback) {
      VectorStoreClient.localDb.delete(collectionName);
      return;
    }

    try {
      await this.chroma!.deleteCollection({ name: collectionName });
    } catch (err) {
      console.error(`ChromaDB deleteCollection failed for ${collectionName}. Falling back to in-memory store.`, err);
      this.enableFallback();
      await this.dropCollection(collectionName);
    }
  }

  /**
   * Queries the vector store with metadata filtering and cosine similarity
   */
  public async query(
    collectionName: string,
    queryEmbedding: number[],
    limit: number = 3,
    filters?: Partial<VectorMetadata>
  ): Promise<RetrievedKnowledge[]> {
    if (this.isUsingFallback) {
      const docs = VectorStoreClient.localDb.get(collectionName) || [];
      
      // 1. Filter by metadata if applicable
      let filteredDocs = docs;
      if (filters) {
        filteredDocs = docs.filter((d) => {
          for (const key in filters) {
            const filterVal = (filters as any)[key];
            if (filterVal !== undefined && (d.metadata as any)[key] !== filterVal) {
              return false;
            }
          }
          return true;
        });
      }

      // 2. Score similarity using Cosine Similarity
      const scored = filteredDocs.map((d) => {
        const sim = cosineSimilarity(queryEmbedding, d.embedding);
        
        // Normalize similarity score from -1..1 to 0..100
        const similarityScore = Math.round(((sim + 1) / 2) * 100);
        
        return {
          documentId: d.id,
          content: d.content,
          similarityScore,
          credibilityScore: d.metadata.credibilityScore,
          freshnessScore: this.calculateFreshness(d.metadata.publishDate),
          finalScore: 0, // Computed by ranking engine
          metadata: d.metadata,
        };
      });

      // Sort by similarity score temporarily
      return scored.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit);
    }

    try {
      const collection = await this.chroma!.getOrCreateCollection({ name: collectionName });
      
      // Map filters to ChromaDB's where format
      const where: Record<string, any> = {};
      if (filters) {
        for (const key in filters) {
          const filterVal = (filters as any)[key];
          if (filterVal !== undefined) {
            where[key] = filterVal;
          }
        }
      }

      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: Object.keys(where).length > 0 ? where : undefined,
      });

      if (!results || !results.ids || results.ids[0].length === 0) {
        return [];
      }

      const list: RetrievedKnowledge[] = [];
      const ids = results.ids[0];
      const documents = results.documents[0];
      const metadatas = results.metadatas[0];
      const distances = results.distances ? results.distances[0] : [];

      for (let i = 0; i < ids.length; i++) {
        const rawMetadata = metadatas[i] as any;
        const metadata: VectorMetadata = {
          industry: rawMetadata.industry || "unknown",
          country: rawMetadata.country || "unknown",
          sourceType: rawMetadata.sourceType || "unknown",
          credibilityScore: Number(rawMetadata.credibilityScore) || 50,
          confidence: rawMetadata.confidence || "MEDIUM",
          publishDate: rawMetadata.publishDate || "unknown",
          category: rawMetadata.category || "unknown",
          intent: rawMetadata.intent,
        };

        // If extra keys were passed in, bring them along
        for (const key in rawMetadata) {
          if (!(key in metadata)) {
            metadata[key] = rawMetadata[key];
          }
        }

        // ChromaDB distances represent L2 distance (lower is closer)
        // Convert to similarity score from 0 to 100
        let similarityScore = 70;
        if (distances[i] !== undefined && distances[i] !== null) {
          const distance = distances[i] as number;
          // Map distance to 0..100 similarity. L2 distance can range from 0 to 2 for normalized vectors.
          // similarity = 1 - distance/2
          const sim = 1 - (distance / 2);
          similarityScore = Math.round(Math.max(0, Math.min(100, sim * 100)));
        }

        list.push({
          documentId: ids[i],
          content: documents[i] || "",
          similarityScore,
          credibilityScore: metadata.credibilityScore,
          freshnessScore: this.calculateFreshness(metadata.publishDate),
          finalScore: 0, // Computed by ranking engine
          metadata,
        });
      }

      return list;
    } catch (err) {
      console.error(`ChromaDB query failed for ${collectionName}. Falling back to in-memory store.`, err);
      this.enableFallback();
      return this.query(collectionName, queryEmbedding, limit, filters);
    }
  }

  /**
   * Computes freshness score out of 100 based on age
   */
  private calculateFreshness(dateStr: string): number {
    if (!dateStr || dateStr === "unknown") return 50;
    
    try {
      const parts = dateStr.split("-");
      const year = parseInt(parts[0]);
      if (isNaN(year)) return 50;
      
      const currentYear = new Date().getFullYear();
      let ageYears = currentYear - year;
      
      // Calculate month age if month is available
      let ageMonths = ageYears * 12;
      if (parts[1]) {
        const month = parseInt(parts[1]);
        if (!isNaN(month)) {
          const currentMonth = new Date().getMonth() + 1; // 1-indexed
          ageMonths += (currentMonth - month);
        }
      }

      if (ageMonths <= 6) return 100; // 0-6 months
      if (ageMonths <= 12) return 80; // 6-12 months
      if (ageMonths <= 24) return 50; // 1-2 years
      return 20;                     // Older than 2 years
    } catch {
      return 50;
    }
  }
}
