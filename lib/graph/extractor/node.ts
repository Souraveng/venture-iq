// lib/graph/extractor/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { StructuredKnowledgeSchema } from "./schema";
import { FACT_EXTRACTION_PROMPT } from "./prompt";
import { Fact, Entity, Relationship, Claim, StructuredKnowledge } from "./types";

export async function factExtractionAgent(state: VentureStateType) {
  console.log("--- Agent: Fact Extraction & Knowledge Structuring ---");

  const evidenceList = state.evidence || [];
  const ventureContext = state.ventureContext;

  if (evidenceList.length === 0) {
    console.warn("No evidence gathered to extract facts from! Skipping.");
    return {
      facts: [],
      entities: [],
      relationships: [],
    };
  }

  const allFacts: Fact[] = [];
  const allEntities: Entity[] = [];
  const allRelationships: Relationship[] = [];
  const allClaims: Claim[] = [];

  const structuredLlm = llm.withStructuredOutput(StructuredKnowledgeSchema);

  // Process each evidence document
  for (const ev of evidenceList) {
    console.log(`Extracting knowledge from evidence source: ${ev.title} (${ev.url})`);

    try {
      const docText = ev.normalizedContent || ev.content || "";
      if (docText.trim() === "") continue;

      // Format prompt
      const prompt = FACT_EXTRACTION_PROMPT
        .replace("{ventureContext}", JSON.stringify(ventureContext || {}))
        .replace("{evidenceId}", ev.id)
        .replace("{evidenceTitle}", ev.title)
        .replace("{evidenceSource}", ev.sourceType)
        .replace("{evidenceUrl}", ev.url)
        .replace("{evidenceContent}", docText.substring(0, 10000)); // Truncate to safe limit

      const result = (await structuredLlm.invoke(prompt)) as StructuredKnowledge;
      if (!result || !result.facts || !result.entities || !result.relationships) {
        throw new Error("Invalid or empty structured knowledge received from LLM");
      }

      console.log(`Extracted: ${result.facts?.length || 0} facts, ${result.entities?.length || 0} entities, ${result.relationships?.length || 0} relationships`);

      // Ensure each item has the correct source ID
      if (result.facts) {
        result.facts.forEach(f => {
          const statementStr = f.statement || f.text || f.fact || f.content || "";
          if (statementStr && typeof statementStr === "string") {
            f.statement = statementStr.trim();
            f.sourceId = ev.id;
            allFacts.push(f);
          } else {
            console.warn(`[Extractor] Skipping fact with empty or missing statement:`, f);
          }
        });
      }
      if (result.entities) {
        result.entities.forEach(e => {
          e.sourceId = ev.id;
          allEntities.push(e);
        });
      }
      if (result.relationships) {
        result.relationships.forEach(r => {
          allRelationships.push(r);
        });
      }
      if (result.claims) {
        result.claims.forEach(c => {
          c.sourceId = ev.id;
          allClaims.push(c);
        });
      }
    } catch (error) {
      console.error(`Knowledge extraction failed for evidence ${ev.id}:`, error);
      throw error;
    }
  }

  // Deduplicate Entities by normalized ID
  const uniqueEntitiesMap = new Map<string, Entity>();
  allEntities.forEach(ent => {
    // Generate normalized entity ID if not present or malformed
    const normId = ent.id || `ent-${ent.name.toLowerCase().trim().replace(/[^a-z0-9]/g, "-")}`;
    ent.id = normId;
    if (!uniqueEntitiesMap.has(normId)) {
      uniqueEntitiesMap.set(normId, ent);
    }
  });
  const uniqueEntities = Array.from(uniqueEntitiesMap.values());

  // Filter Relationships to make sure they connect existing entities
  const entityIds = new Set(uniqueEntities.map(e => e.id));
  const validRelationships = allRelationships.filter(rel => {
    return entityIds.has(rel.sourceEntityId) && entityIds.has(rel.targetEntityId);
  });

  // Deduplicate Relationships (sourceEntityId + relationType + targetEntityId)
  const uniqueRelsMap = new Map<string, Relationship>();
  validRelationships.forEach(rel => {
    const key = `${rel.sourceEntityId}_${rel.relationType}_${rel.targetEntityId}`;
    if (!uniqueRelsMap.has(key)) {
      uniqueRelsMap.set(key, rel);
    }
  });
  const uniqueRelationships = Array.from(uniqueRelsMap.values());

  // Deduplicate Facts by statement similarity (exact or normalized text)
  const uniqueFactsMap = new Map<string, Fact>();
  allFacts.forEach(fact => {
    const key = fact.statement.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (!uniqueFactsMap.has(key)) {
      uniqueFactsMap.set(key, fact);
    }
  });
  const uniqueFacts = Array.from(uniqueFactsMap.values());

  console.log(`Total structured knowledge database compiled:`);
  console.log(`- Unique Facts: ${uniqueFacts.length}`);
  console.log(`- Unique Entities: ${uniqueEntities.length}`);
  console.log(`- Unique Relationships: ${uniqueRelationships.length}`);

  return {
    facts: uniqueFacts,
    entities: uniqueEntities,
    relationships: uniqueRelationships,
    finalReport: {
      ...state.finalReport,
      extractedFactsCount: uniqueFacts.length,
      extractedEntitiesCount: uniqueEntities.length,
    }
  };
}
