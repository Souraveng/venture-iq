import { prisma } from "@/lib/prisma";

interface StartupVectorDocument {
  id: string; // The startupId from Prisma
  name: string;
  category: string;
  embedding: number[];
}

/**
 * Upsert a startup profile's semantic filter vector into PostgreSQL (Supabase pgvector).
 */
export async function upsertStartupVector(doc: StartupVectorDocument): Promise<void> {
  try {
    const embeddingStr = `[${doc.embedding.join(",")}]`;
    
    // We update the embedding using $executeRaw to cast to vector
    await prisma.$executeRaw`
      UPDATE "Startup"
      SET embedding = ${embeddingStr}::vector
      WHERE id = ${doc.id}
    `;
  } catch (err) {
    console.warn(`[PgMatchmaking] Failed to upsert startup vector: ${doc.id}`, err);
  }
}

/**
 * Perform a semantic search natively in PostgreSQL (Supabase pgvector) using cosine distance.
 */
export async function searchMatchingStartups(investorVector: number[], limit: number = 50): Promise<Array<{ id: string; score: number }>> {
  try {
    const embeddingStr = `[${investorVector.join(",")}]`;
    
    // Use pgvector's cosine distance operator (<=>)
    const results = await prisma.$queryRaw<Array<{ id: string; score: number }>>`
      SELECT id, (embedding <=> ${embeddingStr}::vector) as score
      FROM "Startup"
      WHERE embedding IS NOT NULL
      ORDER BY score ASC
      LIMIT ${limit}
    `;

    return results;
  } catch (err) {
    console.error("[PgMatchmaking] Failed to search matching startups", err);
    return [];
  }
}
