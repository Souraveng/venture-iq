// lib/graph/vectorstore/examples.ts
import { VectorStoreClient } from "./client";
import { EmbeddingService } from "./embeddings";
import { CollectionManager } from "./collections";
import { RetrievalEngine } from "./retrieval";
import { VectorMetadata } from "./types";

export async function runExamples() {
  console.log("================================================================================");
  console.log("VENTUREIQ RETRIEVAL INTELLIGENCE LAYER - EXAMPLE QUERIES & RESULTS");
  console.log("================================================================================\n");

  // Initialize Client, Embeddings, Collections, and Retrieval Engine
  const client = new VectorStoreClient();
  await client.initialize();

  const embeddings = new EmbeddingService();
  const collections = new CollectionManager(client);
  const retrieval = new RetrievalEngine();

  console.log(`Vector Store Fallback Mode Active? ${client.usingFallback()}\n`);

  // 1. Prepare and index sample validated facts across different categories
  console.log("--- Step 1: Ingesting and Enriching Validated Venture Facts ---");
  
  const sampleFacts = [
    {
      id: "fact_001",
      collection: "market_intelligence" as const,
      content: "The Indian EV market size is expected to reach $142 billion by 2030, registering a CAGR of 49%.",
      metadata: {
        industry: "EV Charging & Manufacturing",
        country: "India",
        sourceType: "Government",
        credibilityScore: 95,
        confidence: "VERY_HIGH" as const,
        publishDate: "2026-02-10",
        category: "market"
      }
    },
    {
      id: "fact_002",
      collection: "market_intelligence" as const,
      content: "Indian EV charging station market projected to expand significantly, driven by FAME government subsidies.",
      metadata: {
        industry: "EV Charging Infrastructure",
        country: "India",
        sourceType: "News",
        credibilityScore: 75,
        confidence: "HIGH" as const,
        publishDate: "2025-11-20",
        category: "market"
      }
    },
    {
      id: "fact_003",
      collection: "financial_intelligence" as const,
      content: "Average capital cost for deploying a public DC fast charger (50kW) in India ranges from ₹8 Lakhs to ₹15 Lakhs.",
      metadata: {
        industry: "EV Charging Infrastructure",
        country: "India",
        sourceType: "Industry Report",
        credibilityScore: 90,
        confidence: "HIGH" as const,
        publishDate: "2026-03-01",
        category: "financial"
      }
    },
    {
      id: "fact_004",
      collection: "regulatory_intelligence" as const,
      content: "The Ministry of Power allows charging of electric vehicles as a service without requiring a transmission license.",
      metadata: {
        industry: "EV Charging & Power Distribution",
        country: "India",
        sourceType: "Government",
        credibilityScore: 98,
        confidence: "VERY_HIGH" as const,
        publishDate: "2024-05-15", // older fact to test freshness decay
        category: "regulatory"
      }
    },
    {
      id: "fact_005",
      collection: "competition_intelligence" as const,
      content: "Tata Power currently dominates the public charging station market in India with over 4,000 public chargers.",
      metadata: {
        industry: "EV Charging Competitors",
        country: "India",
        sourceType: "Industry Report",
        credibilityScore: 88,
        confidence: "HIGH" as const,
        publishDate: "2026-01-15",
        category: "competition"
      }
    }
  ];

  for (const fact of sampleFacts) {
    const vector = await embeddings.getEmbedding(fact.content);
    await collections.upsert(
      fact.collection,
      fact.id,
      fact.content,
      fact.metadata,
      vector
    );
    console.log(`Indexed [${fact.id}] into [${fact.collection}]`);
  }
  console.log("All sample facts indexed.\n");

  // 2. Query expansion demonstration
  console.log("--- Step 2: Demonstrating Semantic Query Expansion ---");
  const query = "EV startup";
  const expanded = await retrieval.expandQuery(query);
  console.log(`Original Query: "${query}"`);
  console.log(`Expanded Queries:`, expanded, "\n");

  // 3. Retrieval execution with multi-factor scoring
  console.log("--- Step 3: Executing RAG Retrieval & Multi-Factor Re-ranking ---");
  console.log("Formula: 0.60 * Similarity + 0.25 * Credibility + 0.15 * Freshness\n");

  const queryInput = {
    question: "Tam for electric vehicle charging infrastructure in India",
    intent: "VALIDATE_IDEA"
  };

  console.log(`Querying: "${queryInput.question}" with intent "${queryInput.intent}"`);
  const results = await retrieval.retrieve(queryInput, client, embeddings);

  results.forEach((res, index) => {
    console.log(`\n[RANK ${index + 1}] Document ID: ${res.documentId}`);
    console.log(`Content: "${res.content}"`);
    console.log(`Scores -> Similarity: ${res.similarityScore} | Credibility: ${res.credibilityScore} | Freshness: ${res.freshnessScore} | FINAL SCORE: ${res.finalScore}`);
    console.log(`Metadata -> Country: ${res.metadata.country} | Industry: ${res.metadata.industry} | Source: ${res.metadata.sourceType} | Date: ${res.metadata.publishDate}`);
  });

  console.log("\n================================================================================");
  console.log("DEMO FINISHED");
  console.log("================================================================================");
}

// Automatically execute if run directly in node
if (require.main === module) {
  runExamples().catch(console.error);
}
