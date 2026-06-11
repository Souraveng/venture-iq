// lib/graph/researcher/utils/filtering.ts
import { SearchResult, QualityScores } from "../types";

// High reputation domains
const TRUSTED_DOMAINS = [
  "worldbank.org", "imf.org", "un.org", "gov.in", "gov.uk", "gov", "edu", 
  "statista.com", "mckinsey.com", "gartner.com", "bloomberg.com", "reuters.com",
  "techcrunch.com", "venturebeat.com", "economist.com", "hbr.org", "forbes.com"
];

// Spam / SEO / Link farm patterns
const SPAM_PATTERNS = [
  /ad\./, /click\./, /doubleclick/, /affiliate/, /coupon/, /deals/, /promo/,
  /pinterest\.com/, /instagram\.com/, /facebook\.com\/sharer/, /twitter\.com\/intent/,
  /reddit\.com\/r\/.*\/comments/, /quora\.com\/unanswered/, /login/, /signup/,
  /wp-content/, /cgi-bin/, /feed/
];

/**
 * Filter out spam, social share links, and broken pages from SearchResults
 */
export function filterUrls(results: SearchResult[]): SearchResult[] {
  return results.filter((r) => {
    if (!r.url || r.url.trim() === "") return false;
    
    // Check spam patterns
    const isSpam = SPAM_PATTERNS.some((pattern) => pattern.test(r.url) || pattern.test(r.title));
    if (isSpam) {
      console.log(`Filtering out spam URL/Title: ${r.url}`);
      return false;
    }

    return true;
  });
}

/**
 * Assign quality scores to a search result based on authority, relevance, freshness, and reputation
 */
export function scoreResult(result: SearchResult, query: string, publishDate: string): QualityScores {
  const domain = result.domain.toLowerCase();
  
  // 1. Authority Score
  let authority = 50; // default baseline
  if (domain.endsWith(".gov") || domain.endsWith(".gov.in") || domain.includes(".gov.")) {
    authority = 95;
  } else if (domain.endsWith(".edu") || domain.endsWith(".ac.in")) {
    authority = 90;
  } else if (domain.endsWith(".org")) {
    authority = 75;
  } else if (TRUSTED_DOMAINS.some(td => domain.includes(td))) {
    authority = 85;
  }

  // 2. Relevance Score (based on query keyword matches in title/snippet)
  let relevance = 40; // baseline relevance
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (queryTerms.length > 0) {
    let matches = 0;
    const searchArea = `${result.title} ${result.snippet}`.toLowerCase();
    
    queryTerms.forEach((term) => {
      if (searchArea.includes(term)) {
        matches++;
      }
    });

    const matchRatio = matches / queryTerms.length;
    relevance = Math.round(40 + (matchRatio * 60)); // scales up to 100
  }

  // 3. Freshness Score
  let freshness = 50; // baseline default
  const dateStr = (publishDate || result.publishedDate || "").toLowerCase();
  if (dateStr && dateStr !== "unknown") {
    // Check years
    if (dateStr.includes("2026") || dateStr.includes("2025")) {
      freshness = 95;
    } else if (dateStr.includes("2024")) {
      freshness = 85;
    } else if (dateStr.includes("2023")) {
      freshness = 70;
    } else if (dateStr.includes("2022") || dateStr.includes("2021")) {
      freshness = 50;
    } else {
      freshness = 30; // older
    }
  }

  // 4. Domain Reputation Score
  let domainReputation = 50; // default
  if (TRUSTED_DOMAINS.some(td => domain.includes(td))) {
    domainReputation = 90;
  } else if (domain.endsWith(".gov") || domain.endsWith(".edu")) {
    domainReputation = 95;
  } else if (domain.endsWith(".org") || domain.endsWith(".net")) {
    domainReputation = 70;
  }

  // 5. Overall Score (weighted average)
  // Weights: Authority (35%), Relevance (35%), Freshness (15%), Domain Reputation (15%)
  const overallScore = Math.round(
    authority * 0.35 +
    relevance * 0.35 +
    freshness * 0.15 +
    domainReputation * 0.15
  );

  return {
    authority,
    relevance,
    freshness,
    domainReputation,
    overallScore
  };
}

/**
 * Deduplicate results by URL, Title similarity, or content similarity
 */
export function removeDuplicates<T extends { url: string; title: string }>(items: T[]): T[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const uniqueItems: T[] = [];

  for (const item of items) {
    const normUrl = item.url.toLowerCase().replace(/https?:\/\//, "").replace(/\/$/, "");
    const normTitle = item.title.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, "");

    // Skip if URL already seen
    if (seenUrls.has(normUrl)) {
      continue;
    }

    // Skip if title already seen (exact alphanumerical match)
    if (seenTitles.has(normTitle) && normTitle.length > 5) {
      continue;
    }

    seenUrls.add(normUrl);
    seenTitles.add(normTitle);
    uniqueItems.push(item);
  }

  return uniqueItems;
}
