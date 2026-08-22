// ──────────────────────────────────────────────────────────────────────────────
// Phase 2b — Vector Store / RAG (Azure Cosmos DB NoSQL)
// Type: 🟢 Embeddings + Cosmos DB Vector Search
// Caches extracted facts by sector+geography for reuse across founders
// ──────────────────────────────────────────────────────────────────────────────

import { CosmosClient } from "@azure/cosmos";
import { vertexAiEmbed } from "../model-router";
import type { ExtractedFact, PipelineNodeId } from "../contracts";

const NV_EMBED_DIMENSIONS = 1024;

interface FactDocument {
  id: string; // Unique claim ID
  sector: string;
  geography: string;
  claim: string;
  value?: number;
  unit?: string;
  confidence: "high" | "medium" | "low";
  sourceUrl?: string;
  embedding: number[];
  createdAt: string; // ISO string for staleness tracking
}

function getCosmosClient() {
  const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
  const key = process.env.AZURE_COSMOS_KEY;
  const dbName = process.env.AZURE_COSMOS_DB_NAME || "FounderIntelligence";
  const containerName = process.env.AZURE_COSMOS_CONTAINER_NAME || "FactsVectorStore";

  if (!endpoint || !key) {
    throw new Error("[VectorStore] Missing Cosmos DB credentials (AZURE_COSMOS_ENDPOINT / AZURE_COSMOS_KEY).");
  }

  const client = new CosmosClient({ endpoint, key });
  return { client, dbName, containerName };
}

/**
 * Ensure database and container with Vector Policy exist.
 */
async function ensureContainerExists(client: CosmosClient, dbName: string, containerName: string) {
  const { database } = await client.databases.createIfNotExists({ id: dbName });

  const vectorEmbeddingPolicy = {
    vectorEmbeddings: [
      {
        path: "/embedding",
        dataType: "float32",
        distanceFunction: "cosine",
        dimensions: NV_EMBED_DIMENSIONS,
      },
    ],
  };

  const indexingPolicy = {
    vectorIndexes: [
      {
        path: "/embedding",
        type: "quantizedFlat",
      },
    ],
  };

  await database.containers.createIfNotExists({
    id: containerName,
    partitionKey: { paths: ["/sector"] },
    vectorEmbeddingPolicy: vectorEmbeddingPolicy as any,
    indexingPolicy: indexingPolicy as any,
  });

  return database.container(containerName);
}

/**
 * Store facts in Cosmos DB for future reuse.
 */
export async function cacheFacts(sector: string, geography: string, facts: ExtractedFact[]): Promise<void> {
  if (facts.length === 0) return;

  const { client, dbName, containerName } = getCosmosClient();
  const container = await ensureContainerExists(client, dbName, containerName);

  // Generate embeddings for all claims
  const claims = facts.map((f) => f.claim);
  const embeddings = await vertexAiEmbed(claims, { taskType: "RETRIEVAL_DOCUMENT" });

  let uploadedCount = 0;
  for (let i = 0; i < facts.length; i++) {
    const fact = facts[i];
    const id = Buffer.from(`${sector}-${geography}-${fact.claim}`)
      .toString("base64")
      .replace(/[^a-zA-Z0-9-]/g, "");

    const doc: FactDocument = {
      id,
      sector: sector.toLowerCase(),
      geography: geography.toLowerCase(),
      claim: fact.claim,
      value: fact.value,
      unit: fact.unit,
      confidence: fact.confidence,
      sourceUrl: fact.sourceUrl,
      embedding: embeddings[i],
      createdAt: new Date().toISOString(),
    };

    try {
      await container.items.upsert(doc);
      uploadedCount++;
    } catch (err) {
      console.warn(`[VectorStore] Failed to upsert fact: ${id}`, err);
    }
  }

  console.log(`[VectorStore] Upserted ${uploadedCount} facts to Cosmos DB.`);
}

/**
 * Retrieve cached facts using Vector Search in Cosmos DB NoSQL.
 */
export async function getCachedFacts(sector: string, geography: string, idea: string): Promise<ExtractedFact[]> {
  const { client, dbName, containerName } = getCosmosClient();
  const database = client.database(dbName);
  const container = database.container(containerName);

  try {
    // Check if container exists, if it doesn't we return empty
    await container.read();
  } catch (error: any) {
    if (error.code === 404) return [];
    throw error;
  }

  // Embed the current startup idea
  const queryEmbeddings = await vertexAiEmbed([idea], { taskType: "RETRIEVAL_QUERY" });
  const queryEmbedding = queryEmbeddings[0];

  // Calculate 3 months ago for staleness check
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Cosmos DB NoSQL Vector Search query with staleness filter
  const querySpec = {
    query: `
      SELECT TOP 15 c.claim, c["value"], c.unit, c.confidence, c.sourceUrl, VectorDistance(c.embedding, @queryVector) AS score
      FROM c
      WHERE c.sector = @sector 
        AND c.geography = @geography 
        AND c.createdAt >= @cutoffDate
      ORDER BY VectorDistance(c.embedding, @queryVector)
    `,
    parameters: [
      { name: "@queryVector", value: queryEmbedding },
      { name: "@sector", value: sector.toLowerCase() },
      { name: "@geography", value: geography.toLowerCase() },
      { name: "@cutoffDate", value: threeMonthsAgo.toISOString() },
    ],
  };

  const { resources } = await container.items.query(querySpec).fetchAll();

  const retrievedFacts: ExtractedFact[] = resources.map((res: any) => ({
    claim: res.claim,
    value: res.value,
    unit: res.unit,
    confidence: res.confidence,
    sourceUrl: res.sourceUrl,
  }));

  console.log(`[VectorStore] Retrieved ${retrievedFacts.length} cached facts from Cosmos DB via vector search.`);
  return retrievedFacts;
}

/**
 * LangGraph node: stores new facts into Cosmos DB.
 */
export async function runVectorStore(state: any) {
  const playbook = state.pipeline?.playbook;
  const extractedFacts: ExtractedFact[] = state.pipeline?.extractedFacts || [];
  const cachedFacts: ExtractedFact[] = state.pipeline?.cachedFacts || [];

  const sector = playbook?.sector || "general";
  const geography = playbook?.geography || "global";

  // Store newly extracted facts (from Maverick) into Azure
  if (extractedFacts.length > 0) {
    // Don't block the pipeline on cache upload
    cacheFacts(sector, geography, extractedFacts).catch((err) => {
      console.error("[VectorStore] Background upload failed:", err);
    });
  }

  // Merge them for downstream nodes
  return {
    pipeline: {
      cachedFacts: [...cachedFacts, ...extractedFacts],
      completedNodes: ["vector-store"] as PipelineNodeId[],
    },
  };
}
