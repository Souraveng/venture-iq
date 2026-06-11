// lib/graph/vectorstore/retrieval.ts
import { llm } from "../llm";
import { RetrievedKnowledge, RetrievalQueryInput, CollectionName } from "./types";
import { VectorStoreClient } from "./client";
import { EmbeddingService } from "./embeddings";
import { QueryCache } from "./cache";
import { CollectionManager } from "./collections";

export class RetrievalEngine {
  private cache: QueryCache;

  constructor() {
    this.cache = new QueryCache(30); // 30 minutes TTL
  }

  /**
   * Semantically expands a query into multiple target terms to improve recall.
   */
  public async expandQuery(query: string): Promise<string[]> {
    const qLower = query.toLowerCase();
    const expansions = [query];

    // 1. Direct Rule-based Expansion for critical venture domains
    if (qLower.includes("ev") || qLower.includes("electric vehicle")) {
      expansions.push(
        "electric vehicle startup",
        "EV market size growth",
        "EV charging infrastructure",
        "EV battery swapping regulation"
      );
      return expansions;
    }
    if (qLower.includes("dairy") || qLower.includes("milk") || qLower.includes("livestock")) {
      expansions.push(
        "dairy business expansion",
        "milk processing plant technology",
        "dairy farm automation cost",
        "dairy farming regulations"
      );
      return expansions;
    }
    if (qLower.includes("farm") || qLower.includes("agriculture") || qLower.includes("crop")) {
      expansions.push(
        "profitable agriculture startups",
        "farming business yields ROI",
        "smart farming technology",
        "precision agriculture tools"
      );
      return expansions;
    }

    // 2. High-speed LLM fallback expansion for arbitrary queries
    try {
      const prompt = `Act as a semantic query expansion engine.
Expand the following venture concept query into 3 specific, targeted business and market search terms (comma-separated, no bullets, no numbers):
Query: "${query}"`;

      // Prevent calling LLM during builds or test fallbacks
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "placeholder-key-for-build") {
        return expansions;
      }

      const response = await llm.invoke(prompt);
      const content = response.content.toString();
      const terms = content
        .split(",")
        .map((term) => term.trim().replace(/^"|"$/g, ""))
        .filter((term) => term.length > 2);

      expansions.push(...terms);
    } catch (err) {
      console.error("Semantic query expansion failed. Using baseline query only.", err);
    }

    return Array.from(new Set(expansions)); // Unique strings only
  }

  /**
   * Retrieves relevant intelligence using hybrid retrieval (query expansion, vector search, metadata filtering)
   * and ranks them according to: 0.60 * similarity + 0.25 * credibility + 0.15 * freshness.
   */
  public async retrieve(
    input: RetrievalQueryInput,
    client: VectorStoreClient,
    embeddingService: EmbeddingService
  ): Promise<RetrievedKnowledge[]> {
    const { question, context, intent, filters } = input;
    const collectionsToSearch = this.determineCollectionsForIntent(intent);

    // 1. Check Query Cache
    const cacheKey = this.cache.generateKey(question, collectionsToSearch, filters);
    const cachedResults = this.cache.get(cacheKey);
    if (cachedResults) {
      console.log(`Cache Hit for query: "${question}"`);
      return cachedResults;
    }

    console.log(`Cache Miss for query: "${question}". Executing hybrid retrieval...`);

    // 2. Query Expansion
    const expandedQueries = await this.expandQuery(question);
    
    // 3. Search across all active collections for all expanded queries
    const allResults: RetrievedKnowledge[] = [];
    const collectionManager = new CollectionManager(client);

    for (const query of expandedQueries) {
      try {
        const queryVector = await embeddingService.getEmbedding(query);
        
        // Search in parallel across matching collections
        const searchPromises = collectionsToSearch.map(async (col) => {
          try {
            return await collectionManager.search(col, queryVector, 3, filters);
          } catch (err) {
            console.error(`Collection ${col} search failed for query "${query}":`, err);
            return [];
          }
        });

        const queryResults = await Promise.all(searchPromises);
        allResults.push(...queryResults.flat());
      } catch (err) {
        console.error(`Embedding generation or search failed for expanded query "${query}":`, err);
      }
    }

    // 4. Re-rank and deduplicate
    const rankedResults = this.rerankDocuments(allResults);

    // Cache the top results
    this.cache.set(cacheKey, rankedResults);

    return rankedResults;
  }

  /**
   * Re-ranks retrieved vector documents using the multi-factor scoring formula:
   * Final Score = 0.60 * Similarity + 0.25 * Credibility + 0.15 * Freshness
   */
  public rerankDocuments(docs: RetrievedKnowledge[]): RetrievedKnowledge[] {
    // 1. Calculate weighted scores
    const scored = docs.map((doc) => {
      const finalScore = Math.round(
        doc.similarityScore * 0.60 +
        doc.credibilityScore * 0.25 +
        doc.freshnessScore * 0.15
      );
      return { ...doc, finalScore };
    });

    // 2. Sort by final score descending
    const sorted = scored.sort((a, b) => b.finalScore - a.finalScore);

    // 3. Deduplicate similar/identical content
    const uniqueList: RetrievedKnowledge[] = [];
    const seenContent = new Set<string>();

    for (const item of sorted) {
      // Basic fingerprint normalization of content
      const fingerprint = item.content
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 150); // Match first 150 characters

      if (!seenContent.has(fingerprint)) {
        seenContent.add(fingerprint);
        uniqueList.push(item);
      }
    }

    return uniqueList;
  }

  /**
   * Maps intents to specific collection subsets to optimize search focus
   */
  private determineCollectionsForIntent(intent?: string): CollectionName[] {
    if (!intent) {
      return CollectionManager.COLLECTIONS;
    }

    switch (intent.toUpperCase()) {
      case "DISCOVER_OPPORTUNITIES":
        return [
          "market_intelligence",
          "customer_intelligence",
          "technology_intelligence"
        ];
      case "VALIDATE_IDEA":
        return [
          "market_intelligence",
          "competition_intelligence",
          "customer_intelligence",
          "financial_intelligence",
          "regulatory_intelligence",
          "technology_intelligence"
        ];
      case "GROW_BUSINESS":
        return [
          "market_intelligence",
          "customer_intelligence",
          "financial_intelligence",
          "venture_analysis"
        ];
      case "INVESTOR_DUE_DILIGENCE":
        return [
          "financial_intelligence",
          "competition_intelligence",
          "regulatory_intelligence",
          "venture_analysis"
        ];
      default:
        return CollectionManager.COLLECTIONS;
    }
  }

  /**
   * Expose Query Cache for external monitoring or clearing
   */
  public getCache(): QueryCache {
    return this.cache;
  }
}
