// lib/graph/vectorstore/node.ts
import { VentureStateType } from "../state";
import { VectorStoreClient } from "./client";
import { EmbeddingService } from "./embeddings";
import { CollectionManager } from "./collections";
import { MetadataManager } from "./metadata";
import { RetrievalEngine } from "./retrieval";
import { VectorMetadata, CollectionName } from "./types";

// Singleton instance of the RetrievalEngine to preserve query cache across steps if the runner is kept alive
const retrievalEngine = new RetrievalEngine();

export async function knowledgeStoreAgent(state: VentureStateType) {
  console.log("--- Agent: Knowledge Base & RAG Indexer ---");

  const validatedFacts = state.validatedFacts || [];
  const evidenceList = state.evidence || [];
  const ventureContext = state.ventureContext;

  const client = new VectorStoreClient();
  await client.initialize(); // Establish connection or enable local fallback

  const embeddingService = new EmbeddingService();
  const collectionManager = new CollectionManager(client);

  // 1. Indexing Phase: Store Validated Facts
  console.log(`Indexing ${validatedFacts.length} validated facts into vector database...`);
  
  // Cache evidence mappings for fast metadata lookup
  const evidenceMap = new Map(evidenceList.map((e) => [e.id, e]));

  for (const fact of validatedFacts) {
    const originalFact = state.facts?.find((f) => f.id === fact.id);
    const category = originalFact?.category || "market";
    
    // Construct collection name matching CollectionName type
    const categoryName = `${category}_intelligence`;
    const collectionName: CollectionName = collectionManager.isValidCollection(categoryName)
      ? categoryName
      : "market_intelligence";

    // Lookup primary source details to enrich metadata
    const primarySourceId = fact.supportingSources[0];
    const sourceEv = primarySourceId ? evidenceMap.get(primarySourceId) : null;

    const industry = ventureContext?.startup_idea?.description && ventureContext.startup_idea.description !== "none"
      ? ventureContext.startup_idea.description.substring(0, 50)
      : ventureContext?.existing_business?.description && ventureContext.existing_business.description !== "none"
        ? ventureContext.existing_business.description.substring(0, 50)
        : "unknown";

    const rawMetadata: Partial<VectorMetadata> = {
      industry: industry,
      country: ventureContext?.location?.country || "unknown",
      sourceType: sourceEv?.sourceType || "unknown",
      credibilityScore: fact.credibilityScore,
      confidence: fact.confidence,
      publishDate: sourceEv?.publishDate || "unknown",
      category: category,
      intent: ventureContext?.intent,
      userEmail: state.userEmail || "test@ventureiq.io",
    };

    try {
      const vector = await embeddingService.getEmbedding(fact.statement);
      await collectionManager.upsert(
        collectionName,
        fact.id,
        fact.statement,
        rawMetadata,
        vector
      );
      console.log(`Successfully indexed fact ${fact.id} into ${collectionName}`);
    } catch (err) {
      console.error(`Failed to index fact ${fact.id}:`, err);
    }
  }

  // 2. Indexing Phase: Store Validated Raw Evidence snippets
  console.log(`Indexing ${evidenceList.length} evidence sources...`);
  for (const ev of evidenceList) {
    // Only index high-quality evidence
    if (ev.overallScore < 40) {
      console.log(`Skipping low-score evidence: ${ev.id} (Score: ${ev.overallScore})`);
      continue;
    }

    const industry = ventureContext?.startup_idea?.description && ventureContext.startup_idea.description !== "none"
      ? ventureContext.startup_idea.description.substring(0, 50)
      : "unknown";

    const rawMetadata: Partial<VectorMetadata> = {
      industry: industry,
      country: ventureContext?.location?.country || "unknown",
      sourceType: ev.sourceType,
      credibilityScore: ev.overallScore,
      confidence: "HIGH",
      publishDate: ev.publishDate,
      category: "market",
      intent: ventureContext?.intent,
      userEmail: state.userEmail || "test@ventureiq.io",
    };

    try {
      // Index first 1500 characters of scraped content as sample snippet
      const snippet = ev.normalizedContent?.substring(0, 1500) || ev.content.substring(0, 1500) || ev.title;
      const vector = await embeddingService.getEmbedding(snippet);
      await collectionManager.upsert(
        "market_intelligence",
        ev.id,
        snippet,
        rawMetadata,
        vector
      );
    } catch (err) {
      console.error(`Failed to index evidence document ${ev.id}:`, err);
    }
  }

  // 3. Retrieval Phase: Query and Retrieve Relevant Knowledge
  const primaryGoal = ventureContext?.goal || state.userInput?.idea || "venture business opportunity";
  console.log(`Executing RAG Retrieval for goal/query: "${primaryGoal}" sandboxed by user: ${state.userEmail || "test@ventureiq.io"}`);

  let retrievedList: any[] = [];
  try {
    retrievedList = await retrievalEngine.retrieve(
      {
        question: primaryGoal,
        intent: ventureContext?.intent,
        context: ventureContext?.startup_idea?.description !== "none" ? ventureContext?.startup_idea?.description : undefined,
        filters: {
          userEmail: state.userEmail || "test@ventureiq.io",
        },
      },
      client,
      embeddingService
    );
  } catch (err) {
    console.error("Retrieval Engine execution failed:", err);
  }

  // Limit output results to top 5
  const finalRetrievalList = retrievedList.slice(0, 5);

  console.log(`Successfully retrieved and ranked ${finalRetrievalList.length} knowledge segments.`);
  finalRetrievalList.forEach((d, idx) => {
    console.log(`[RAG Rank ${idx + 1}] Score: ${d.finalScore}/100 | Source: ${d.metadata.sourceType} | Text: "${d.content.substring(0, 80)}..."`);
  });

  return {
    retrievedKnowledge: finalRetrievalList,
    finalReport: {
      ...state.finalReport,
      retrievedKnowledgeCount: finalRetrievalList.length,
    }
  };
}
