// lib/graph/vectorstore/tests/vectorstore.test.ts
import { VectorStoreClient } from "../client";
import { EmbeddingService } from "../embeddings";
import { CollectionManager } from "../collections";
import { MetadataManager } from "../metadata";
import { QueryCache } from "../cache";
import { RetrievalEngine } from "../retrieval";
import { knowledgeStoreAgent } from "../node";
import { VentureStateType } from "../../state";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(` ✅ PASS: ${message}`);
  } else {
    console.error(` ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log("==========================================================");
  console.log("RUNNING VENTUREIQ RETRIEVAL LAYER TESTS...");
  console.log("==========================================================\n");

  // --- TEST 1: Embedding Service Caching & Dimensions ---
  console.log("--- 1. Testing EmbeddingService ---");
  try {
    const embeddings = new EmbeddingService();
    assert(embeddings.modelName === "gemini-embedding-2", "Embedding model name is gemini-embedding-2");
    assert(embeddings.dimensions === 768, "Embedding dimension is 768");

    const v1 = await embeddings.getEmbedding("EV startup India");
    assert(v1.length === 768, "Embedding vector length is 768");
    assert(embeddings.cacheSize() === 1, "Cache size is 1 after first query");

    // Cache hit test
    const v2 = await embeddings.getEmbedding("EV startup India");
    assert(embeddings.cacheSize() === 1, "Cache size remains 1 (cache hit)");
    assert(v1[0] === v2[0], "Cached vector equals first vector");

    // Batch processor test
    const texts = ["charging infrastructure", "battery swap", "regulatory framework"];
    const batch = await embeddings.getEmbeddingsBatch(texts);
    assert(batch.length === 3, "Batch processor embeds exactly 3 texts");
    assert(batch[0].length === 768, "First batch item length is 768");
  } catch (err: any) {
    console.error("EmbeddingService test failed:", err);
  }

  // --- TEST 2: Metadata Manager Enrichment & Zod Validation ---
  console.log("\n--- 2. Testing MetadataManager ---");
  try {
    const enriched = MetadataManager.enrich({
      industry: "electric vehicles",
      country: "united states of america",
      sourceType: "GOVT_REG",
      credibilityScore: 95.5,
      confidence: "very_high",
      publishDate: "2026-06-11T13:00:00Z",
      category: "market",
      intent: "VALIDATE_IDEA"
    });

    assert(enriched.industry === "electric vehicles", "Industry preserved");
    assert(enriched.country === "USA", "Country standardized to USA");
    assert(enriched.sourceType === "Government", "Source type standardized to Government");
    assert(enriched.credibilityScore === 95.5, "Credibility score preserved");
    assert(enriched.confidence === "VERY_HIGH", "Confidence standardized to uppercase");
    assert(enriched.publishDate === "2026-06-11", "Date standardized to YYYY-MM-DD");
    assert(enriched.category === "market", "Category preserved");
    assert(enriched.intent === "VALIDATE_IDEA", "Intent preserved");
  } catch (err: any) {
    console.error("MetadataManager test failed:", err);
  }

  // --- TEST 3: Query Cache ---
  console.log("\n--- 3. Testing QueryCache ---");
  try {
    const cache = new QueryCache(5);
    const key = cache.generateKey("EV market", ["market_intelligence"], { country: "India" });
    assert(key.includes("ev market"), "Key incorporates normalized query");
    assert(key.includes("market_intelligence"), "Key incorporates collection name");

    const mockKnowledge = [
      {
        documentId: "doc_1",
        content: "EV infrastructure growing fast",
        similarityScore: 90,
        credibilityScore: 80,
        freshnessScore: 100,
        finalScore: 89,
        metadata: {
          industry: "EV",
          country: "India",
          sourceType: "News",
          credibilityScore: 80,
          confidence: "HIGH",
          publishDate: "2026-01-01",
          category: "market"
        }
      }
    ];

    assert(cache.get(key) === null, "Cache get returns null for cold key");
    cache.set(key, mockKnowledge);
    
    const cached = cache.get(key);
    assert(cached !== null, "Cache get returns cached results");
    assert(cached![0].documentId === "doc_1", "Cached document ID matches");
    
    cache.clear();
    assert(cache.get(key) === null, "Cache returns null after clearing");
  } catch (err: any) {
    console.error("QueryCache test failed:", err);
  }

  // --- TEST 4: Collection Manager & Client ---
  console.log("\n--- 4. Testing CollectionManager & Client ---");
  try {
    const client = new VectorStoreClient();
    await client.initialize();
    
    const collections = new CollectionManager(client);
    assert(collections.isValidCollection("market_intelligence"), "market_intelligence is valid");
    assert(collections.isValidCollection("venture_analysis"), "venture_analysis is valid");
    assert(!collections.isValidCollection("random_collection"), "random_collection is invalid");

    const embedding = new Array(768).fill(0).map(() => Math.random());
    const metadata = {
      industry: "Dairy technology",
      country: "India",
      sourceType: "Academic",
      credibilityScore: 88,
      confidence: "HIGH" as const,
      publishDate: "2026-04-10",
      category: "technology"
    };

    // Upsert
    await collections.upsert(
      "technology_intelligence",
      "test_doc_999",
      "Dairy farm robotic milkers reduce labor costs by 30%.",
      metadata,
      embedding
    );

    // Search
    const searchResults = await collections.search(
      "technology_intelligence",
      embedding,
      5,
      { country: "India" }
    );
    assert(searchResults.length > 0, "Upserted document is queryable");
    assert(searchResults[0].documentId === "test_doc_999", "Document matches upserted ID");

    // Delete
    await collections.delete("technology_intelligence", "test_doc_999");
    const searchAfterDelete = await collections.search("technology_intelligence", embedding, 5);
    const hasDoc = searchAfterDelete.some(d => d.documentId === "test_doc_999");
    assert(!hasDoc, "Document successfully deleted");
  } catch (err: any) {
    console.error("CollectionManager & Client test failed:", err);
  }

  // --- TEST 5: Retrieval Engine Re-ranking scoring ---
  console.log("\n--- 5. Testing RetrievalEngine Re-ranking Formula ---");
  try {
    const retrieval = new RetrievalEngine();

    const mockDocs = [
      {
        documentId: "doc_a",
        content: "Doc A Content",
        similarityScore: 95, // 0.60 * 95 = 57
        credibilityScore: 20, // 0.25 * 20 = 5
        freshnessScore: 50,  // 0.15 * 50 = 7.5
        finalScore: 0,
        metadata: {
          industry: "EV",
          country: "India",
          sourceType: "News",
          credibilityScore: 20,
          confidence: "LOW",
          publishDate: "2024-01-01",
          category: "market"
        }
      },
      {
        documentId: "doc_b",
        content: "Doc B Content",
        similarityScore: 90, // 0.60 * 90 = 54
        credibilityScore: 95, // 0.25 * 95 = 23.75
        freshnessScore: 100, // 0.15 * 100 = 15
        finalScore: 0,
        metadata: {
          industry: "EV",
          country: "India",
          sourceType: "Government",
          credibilityScore: 95,
          confidence: "VERY_HIGH",
          publishDate: "2026-05-01",
          category: "market"
        }
      }
    ];

    const reranked = retrieval.rerankDocuments(mockDocs);
    // Doc B: 54 + 23.75 + 15 = 92.75 -> 93
    // Doc A: 57 + 5 + 7.5 = 69.5 -> 70
    assert(reranked[0].documentId === "doc_b", "Document B ranked above Document A");
    assert(reranked[0].finalScore > reranked[1].finalScore, "Document B score exceeds Document A score");
  } catch (err: any) {
    console.error("RetrievalEngine re-ranking test failed:", err);
  }

  // --- TEST 6: LangGraph Node Integration ---
  console.log("\n--- 6. Testing LangGraph Node (knowledgeStoreAgent) ---");
  try {
    const mockState: Partial<VentureStateType> = {
      userInput: { idea: "Build an EV charging startup in India" },
      ventureContext: {
        intent: "VALIDATE_IDEA",
        goal: "Build an EV charging startup in India",
        secondary_goals: [],
        resources: [],
        skills: [],
        constraints: [],
        existing_business: { description: "none", industry: "none", years_active: "none" },
        startup_idea: { description: "EV charging network", target_audience: "none", value_proposition: "none" },
        location: { country: "India", state: "", district: "", city: "", village: "", region: "", location_status: "AVAILABLE" },
        financial_context: { budget: "200000", available_capital: "", revenue: "", profit: "", funding_stage: "" },
        timeline: "Immediate",
        critical_missing_information: [],
        confidence: {
          intent: "HIGH",
          goal: "HIGH",
          resources: "HIGH",
          skills: "HIGH",
          constraints: "HIGH",
          location: "HIGH",
          financial_context: "HIGH",
          timeline: "HIGH",
          existing_business: "HIGH",
          startup_idea: "HIGH"
        },
        reasoning: "Unit test reasoning"
      },
      evidence: [
        {
          id: "ev_1",
          query: "EV startup",
          title: "Indian EV Boom",
          url: "https://example.com/ev-boom",
          sourceType: "Government",
          publishDate: "2026-01-01",
          content: "India EV segment will grow 10x by 2030.",
          authorityScore: 90,
          freshnessScore: 100,
          relevanceScore: 95,
          overallScore: 92
        }
      ],
      validatedFacts: [
        {
          id: "fact_1",
          statement: "EV battery swap policy is active in India",
          consensusValue: "active",
          confidence: "HIGH",
          credibilityScore: 85,
          agreementScore: 90,
          supportingSources: ["ev_1"],
          conflictingSources: []
        }
      ],
      facts: [
        {
          id: "fact_1",
          category: "market",
          statement: "EV battery swap policy is active in India",
          sourceId: "ev_1",
          confidence: "HIGH"
        }
      ]
    };

    const outputStateUpdate = await knowledgeStoreAgent(mockState as VentureStateType);
    assert(outputStateUpdate !== undefined, "Node executes without error");
    assert(outputStateUpdate.retrievedKnowledge !== undefined, "Node returns retrievedKnowledge updates");
    assert(outputStateUpdate.retrievedKnowledge.length > 0, "Node successfully retrieves indexed knowledge");
  } catch (err: any) {
    console.error("LangGraph Node test failed:", err);
  }

  console.log("\n==========================================================");
  console.log(`TEST EXECUTION COMPLETED: ${passedTests}/${totalTests} ASSERTONS PASSED.`);
  console.log("==========================================================");
  
  if (passedTests !== totalTests) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution aborted with fatal error:", err);
  process.exit(1);
});
