// lib/graph/researcher/services/search.ts
import { SearchResult } from "../types";

export class SearchService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || "";
  }

  /**
   * Helper to parse domain from a URL string
   */
  private extractDomain(urlStr: string): string {
    try {
      const url = new URL(urlStr);
      return url.hostname.replace("www.", "");
    } catch {
      return "unknown";
    }
  }

  /**
   * Performs search with query, retries, and exponential backoff
   */
  public async search(query: string, maxResults: number = 3, retries: number = 3): Promise<SearchResult[]> {
    if (!this.apiKey) {
      console.warn("TAVILY_API_KEY is not set. Returning empty results.");
      return [];
    }

    const includeDomainsStr = process.env.INCLUDE_DOMAINS || "";
    const includeDomains = includeDomainsStr
      ? includeDomainsStr.split(",").map((d) => d.trim()).filter(Boolean)
      : [];

    const excludeDomainsStr = process.env.EXCLUDE_DOMAINS || "";
    const excludeDomains = excludeDomainsStr
      ? excludeDomainsStr.split(",").map((d) => d.trim()).filter(Boolean)
      : [
          "quora.com", "reddit.com", "pinterest.com", "instagram.com", "facebook.com",
          "twitter.com", "linkedin.com", "youtube.com", "tiktok.com",
          "slideshare.net", "scribd.com", "medium.com", "wordpress.com", "blogspot.com"
        ];

    const searchDepth = process.env.SEARCH_DEPTH || "advanced";

    let attempt = 0;
    let delay = 1000; // start with 1s delay

    while (attempt < retries) {
      try {
        console.log(`Searching: "${query}" (Depth: ${searchDepth}, Attempt ${attempt + 1}/${retries})`);
        
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: this.apiKey,
            query: query,
            search_depth: searchDepth,
            max_results: maxResults,
            include_domains: includeDomains,
            exclude_domains: excludeDomains,
          }),
        });

        if (!response.ok) {
          throw new Error(`Tavily search API returned HTTP status ${response.status}`);
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.results)) {
          throw new Error("Invalid response format from Tavily API");
        }

        return data.results.map((r: any) => ({
          query: query,
          title: r.title || "No Title",
          url: r.url || "",
          snippet: r.content || "",
          domain: this.extractDomain(r.url || ""),
          publishedDate: r.published_date || "unknown",
        }));
      } catch (error: any) {
        attempt++;
        console.error(`Search failed for query "${query}": ${error.message || error}`);
        
        if (attempt >= retries) {
          break;
        }

        console.log(`Retrying search in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // double the delay
      }
    }

    console.warn(`All search attempts failed for query: "${query}"`);
    return [];
  }
}
