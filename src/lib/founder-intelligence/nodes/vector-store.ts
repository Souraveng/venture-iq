// ──────────────────────────────────────────────────────────────────────────────
// Phase 2b — Vector Store / RAG (PostgreSQL + pgvector)
// Type: 🟢 Embeddings + Supabase/PostgreSQL Vector Search
// Caches extracted facts by sector+geography for reuse across founders
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import { vertexAiEmbed } from "../model-router";
import type { ExtractedFact, PipelineNodeId } from "../contracts";

/**
 * Store facts in PostgreSQL for future reuse.
 */
export async function cacheFacts(sector: string, geography: string, facts: ExtractedFact[]): Promise<void> {
  if (facts.length === 0) return;

  // Generate embeddings for all claims
  const claims = facts.map((f) => f.claim);
  const embeddings = await vertexAiEmbed(claims, { taskType: "RETRIEVAL_DOCUMENT" });

  let uploadedCount = 0;
  for (let i = 0; i < facts.length; i++) {
    const fact = facts[i];
    const id = Buffer.from(`${sector}-${geography}-${fact.claim}`)
      .toString("base64")
      .replace(/[^a-zA-Z0-9-]/g, "");

    const embeddingStr = `[${embeddings[i].join(",")}]`;

    try {
      await prisma.$executeRaw`
        INSERT INTO "CachedFact" ("id", "sector", "geography", "claim", "value", "unit", "confidence", "sourceUrl", "embedding", "createdAt")
        VALUES (
          ${id}, 
          ${sector.toLowerCase()}, 
          ${geography.toLowerCase()}, 
          ${fact.claim}, 
          ${fact.value ?? null}, 
          ${fact.unit ?? null}, 
          ${fact.confidence}, 
          ${fact.sourceUrl ?? null}, 
          ${embeddingStr}::vector, 
          NOW()
        )
        ON CONFLICT ("id") DO UPDATE
        SET 
          "embedding" = ${embeddingStr}::vector,
          "createdAt" = NOW()
      `;
      uploadedCount++;
    } catch (err) {
      console.warn(`[VectorStore] Failed to upsert fact: ${id}`, err);
    }
  }

  console.log(`[VectorStore] Upserted ${uploadedCount} facts to PostgreSQL.`);
}

/**
 * Retrieve cached facts using Vector Search in PostgreSQL.
 */
export async function getCachedFacts(sector: string, geography: string, idea: string): Promise<ExtractedFact[]> {
  try {
    // Embed the current startup idea
    const queryEmbeddings = await vertexAiEmbed([idea], { taskType: "RETRIEVAL_QUERY" });
    const queryEmbedding = queryEmbeddings[0];

    // Calculate 3 months ago for staleness check
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // PostgreSQL Vector Search query with staleness filter
    const resources = await prisma.$queryRaw<any[]>`
      SELECT claim, value, unit, confidence, "sourceUrl", (embedding <=> ${embeddingStr}::vector) AS score
      FROM "CachedFact"
      WHERE sector = ${sector.toLowerCase()} 
        AND geography = ${geography.toLowerCase()} 
        AND "createdAt" >= ${threeMonthsAgo}
      ORDER BY score ASC
      LIMIT 15
    `;

    const retrievedFacts: ExtractedFact[] = resources.map((res: any) => ({
      claim: res.claim,
      value: res.value,
      unit: res.unit,
      confidence: res.confidence,
      sourceUrl: res.sourceUrl,
    }));

    console.log(`[VectorStore] Retrieved ${retrievedFacts.length} cached facts from PostgreSQL via vector search.`);
    return retrievedFacts;
  } catch (error: any) {
    console.error("[VectorStore] Failed to retrieve cached facts", error);
    return [];
  }
}

/**
 * LangGraph node: stores new facts into PostgreSQL.
 */
export async function runVectorStore(state: any) {
  const playbook = state.pipeline?.playbook;
  const extractedFacts: ExtractedFact[] = state.pipeline?.extractedFacts || [];
  const cachedFacts: ExtractedFact[] = state.pipeline?.cachedFacts || [];

  const sector = playbook?.sector || "general";
  const geography = playbook?.geography || "global";

  // Store newly extracted facts (from Maverick) into PostgreSQL
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
