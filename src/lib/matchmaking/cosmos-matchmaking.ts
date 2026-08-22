import { CosmosClient } from "@azure/cosmos";

const NV_EMBED_DIMENSIONS = 1024; // text-embedding-004 returns 1024 dimensions

interface StartupVectorDocument {
  id: string; // The startupId from Prisma
  name: string;
  category: string;
  embedding: number[];
}

function getCosmosClient() {
  const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
  const key = process.env.AZURE_COSMOS_KEY;
  const dbName = process.env.AZURE_COSMOS_DB_NAME || "FounderIntelligence";
  // Dedicated container so we don't mix with agent data
  const containerName = "StartupProfilesVectorStore"; 

  if (!endpoint || !key) {
    throw new Error("[CosmosMatchmaking] Missing Cosmos DB credentials (AZURE_COSMOS_ENDPOINT / AZURE_COSMOS_KEY).");
  }

  const client = new CosmosClient({ endpoint, key });
  return { client, dbName, containerName };
}

/**
 * Ensure database and container with Vector Policy exist.
 */
export async function ensureStartupContainerExists() {
  const { client, dbName, containerName } = getCosmosClient();
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
    partitionKey: { paths: ["/category"] },
    vectorEmbeddingPolicy: vectorEmbeddingPolicy as any,
    indexingPolicy: indexingPolicy as any,
  });

  return database.container(containerName);
}

/**
 * Upsert a startup profile's semantic filter vector into Cosmos DB.
 */
export async function upsertStartupVector(doc: StartupVectorDocument): Promise<void> {
  const container = await ensureStartupContainerExists();
  try {
    await container.items.upsert({ ...doc, category: (doc.category || "Uncategorized").toLowerCase() });
  } catch (err) {
    console.warn(`[CosmosMatchmaking] Failed to upsert startup vector: ${doc.id}`, err);
  }
}

/**
 * Perform a semantic search natively in Cosmos DB using VectorDistance.
 */
export async function searchMatchingStartups(investorVector: number[], limit: number = 50): Promise<Array<{ id: string; score: number }>> {
  const container = await ensureStartupContainerExists();

  const querySpec = {
    query: `
      SELECT TOP @limit c.id, VectorDistance(c.embedding, @queryVector) AS score
      FROM c
      ORDER BY VectorDistance(c.embedding, @queryVector)
    `,
    parameters: [
      { name: "@queryVector", value: investorVector },
      { name: "@limit", value: limit },
    ],
  };

  const { resources } = await container.items.query(querySpec).fetchAll();

  return resources.map((res: any) => ({
    id: res.id,
    score: res.score,
  }));
}
