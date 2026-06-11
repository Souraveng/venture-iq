// lib/graph/vectorstore/cache.ts
import { RetrievedKnowledge, CacheEntry } from "./types";

export class QueryCache {
  private static cache: Map<string, CacheEntry> = new Map();
  private ttlMs: number;

  constructor(ttlMinutes: number = 30) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  /**
   * Generates a unique cache key based on the query, active collections, and filters.
   */
  public generateKey(
    query: string,
    collections: string[],
    filters?: Record<string, any>
  ): string {
    const sortedCollections = [...collections].sort().join(",");
    const filterString = filters ? JSON.stringify(filters) : "";
    return `${query.trim().toLowerCase()}|cols:${sortedCollections}|filters:${filterString}`;
  }

  /**
   * Retrieves results from the cache if they exist and are not expired.
   */
  public get(key: string): RetrievedKnowledge[] | null {
    const entry = QueryCache.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttlMs;
    if (isExpired) {
      QueryCache.cache.delete(key);
      return null;
    }

    return entry.results;
  }

  /**
   * Caches the retrieval results.
   */
  public set(key: string, results: RetrievedKnowledge[]): void {
    QueryCache.cache.set(key, {
      key,
      results,
      timestamp: Date.now(),
    });
  }

  /**
   * Clears all entries from the query cache.
   */
  public clear(): void {
    QueryCache.cache.clear();
  }

  /**
   * Returns the current size of the cache.
   */
  public size(): number {
    return QueryCache.cache.size;
  }
}
