// lib/graph/researcher/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { SearchService } from "./services/search";
import { ScrapeService } from "./services/scrape";
import { filterUrls, scoreResult, removeDuplicates } from "./utils/filtering";
import { normalizeContent } from "./utils/cleaning";
import { EvidenceExtractionSchema } from "./schema";
import { Evidence, SearchResult, EvidenceExtraction } from "./types";

export async function evidenceResearchAgent(state: VentureStateType) {
  console.log("--- Agent: Evidence Acquisition Researcher ---");

  const searchQueries = state.researchPlan || [];
  if (searchQueries.length === 0) {
    console.warn("No queries planned! Skipping evidence acquisition.");
    return {
      evidence: [],
      marketIntel: { rawResearch: "No search queries planned." }
    };
  }

  const searchService = new SearchService();
  const scrapeService = new ScrapeService();

  // 1. Search Phase: Execute searches for the top 3 queries in parallel
  const activeQueries = searchQueries.slice(0, 3);
  console.log(`Executing Tavily searches for queries:`, activeQueries);

  const searchResultArrays = await Promise.all(
    activeQueries.map((q) => searchService.search(q, 3))
  );

  // Flatten and filter URLs
  const allSearchResults = searchResultArrays.flat();
  const cleanSearchResults = filterUrls(allSearchResults);
  const uniqueSearchResults = removeDuplicates(cleanSearchResults);

  console.log(`Discovered ${uniqueSearchResults.length} unique, clean URLs after deduplication.`);

  // Offline fallback
  if (uniqueSearchResults.length === 0) {
    console.log("No search results found (offline or missing API key). Continuing with empty search results.");
  }

  // 2. Scraping & Metadata Extraction Phase
  // Limit to top 3 URLs, scrape them in PARALLEL to minimize wait time (BUG-K FIX)
  const targetResults = uniqueSearchResults.slice(0, 3);

  // Scrape all URLs simultaneously — each is an independent HTTP call
  const rawContents = await Promise.all(
    targetResults.map((result) => scrapeService.scrape(result.url))
  );

  const evidenceList: Evidence[] = [];

  for (let i = 0; i < targetResults.length; i++) {
    const result = targetResults[i];
    const rawContent = rawContents[i];

    console.log(`Processing evidence source: ${result.url}`);

    try {
      if (!rawContent || rawContent.trim() === "") {
        console.warn(`Scraped empty content for: ${result.url}. Using search snippet fallback.`);
      }

      const contentToProcess = rawContent || result.snippet || "No content available.";

      // Normalize currencies and percentages in content
      const normalizedContent = normalizeContent(contentToProcess);

      // Extract metadata & scores via Gemini
      const structuredLlm = llm.withStructuredOutput(EvidenceExtractionSchema);

      const extractionPrompt = `You are a document evaluator and metadata extractor for VentureIQ.
Analyze the following source webpage details:
URL: ${result.url}
Title: ${result.title}
Snippet: ${result.snippet}

Scraped Content (truncated):
${contentToProcess.substring(0, 8000)}

Perform the following:
1. Classify the document type (Government, Academic, Industry Report, Company Filing, Investor Report, News, Professional Blog, or Unknown).
2. Extract source metadata (author, country, industry, publishing date YYYY-MM-DD if available).
3. Evaluate quality scores (authority, relevance to query "${result.query}", freshness, domain reputation, and overall score out of 100).
4. Output your analysis according to the schema.`;

      const extraction = (await structuredLlm.invoke(extractionPrompt)) as EvidenceExtraction;

      // Safely access metadata with optional chaining to avoid crashes when metadata is undefined
      const source = extraction?.metadata?.source ?? "unknown";
      const docType = extraction?.metadata?.documentType ?? "Unknown";
      console.log(`Scored Source: ${source} | Document Type: ${docType}`);
      console.log(`Scores: Authority=${extraction.scores.authority}, Overall=${extraction.scores.overallScore}`);

      evidenceList.push({
        id: `ev-${Math.random().toString(36).substring(2, 11)}`,
        query: result.query,
        title: extraction.metadata.title || result.title,
        url: result.url,
        sourceType: extraction.metadata.documentType,
        publishDate: extraction.metadata.publishDate,
        content: contentToProcess,
        normalizedContent: normalizedContent,
        authorityScore: extraction.scores.authority,
        freshnessScore: extraction.scores.freshness,
        relevanceScore: extraction.scores.relevance,
        overallScore: extraction.scores.overallScore,
        metadata: extraction.metadata,
      });
    } catch (error: any) {
      console.error(`Error processing evidence for URL ${result.url}:`, error);

      // Robust fallback scoring to prevent failing the entire pipeline
      const fallbackScores = scoreResult(result, result.query, result.publishedDate);
      
      evidenceList.push({
        id: `ev-fallback-${Math.random().toString(36).substring(2, 11)}`,
        query: result.query,
        title: result.title,
        url: result.url,
        sourceType: "Unknown",
        publishDate: result.publishedDate || "unknown",
        content: result.snippet || "No content available.",
        normalizedContent: normalizeContent(result.snippet || ""),
        authorityScore: fallbackScores.authority,
        freshnessScore: fallbackScores.freshness,
        relevanceScore: fallbackScores.relevance,
        overallScore: fallbackScores.overallScore,
        metadata: {
          title: result.title,
          source: result.domain,
          domain: result.domain,
          author: "unknown",
          publishDate: result.publishedDate || "unknown",
          country: "unknown",
          industry: "unknown",
          documentType: "Unknown",
        },
      });
    }
  }

  // 3. Compile Combined Market Intelligence String for the Analyst
  const combinedResearchSummary = evidenceList
    .map(
      (ev) =>
        `Source: ${ev.metadata?.source || ev.url}\nURL: ${ev.url}\nType: ${ev.sourceType}\nQuality Score: ${ev.overallScore}/100\nContent:\n${(ev.normalizedContent || ev.content).substring(0, 3000)}\n\n`
    )
    .join("\n=================================\n\n");

  return {
    evidence: evidenceList,
    marketIntel: {
      rawResearch: combinedResearchSummary,
      evidenceSummary: `${evidenceList.length} evidence sources successfully collected and verified.`
    },
    finalReport: {
      ...state.finalReport,
      evidenceCount: evidenceList.length,
    }
  };
}
