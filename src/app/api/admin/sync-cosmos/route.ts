import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vertexAiEmbed } from "@/lib/founder-intelligence/model-router";
import { upsertStartupVector } from "@/lib/matchmaking/cosmos-matchmaking";

// Dynamically build text representation from Prisma objects
function buildSemanticText(obj: any): string {
  if (!obj) return "";
  
  const baseExclude = new Set([
    'id', 'email', 'avatarUrl', 'embedding', 'investorEmbedding', 'preferredStartupEmbedding', 
    'createdAt', 'updatedAt', 'verified', 'isPublished', 'matchHistory', 'lastAutonomousRun',
    'pitchDeckUrl', 'logoUrl', 'websiteUrl', 'linkedinUrl', 'twitterUrl', 'videoFormat', 'founderId',
    'useOfFunds', 'teamRoster', 'gatedFields', 'background', 'investorReadinessScore', 'marketScore',
    'riskScore', 'moatScore', 'executionScore', 'fundingProbability', 'portfolioCompanies',
    'recommendedInvestors', 'keywords', 'analysisRuns', 'analyticsEvents', 'escalations', 'collaborators', 'handoffNotes'
  ]);
  
  const parts: string[] = [];
  
  function processObj(o: any, prefix = "") {
    for (const [key, value] of Object.entries(o)) {
      if (baseExclude.has(key)) continue;
      if (value === null || value === undefined || value === "") continue;
      
      const displayKey = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] !== 'object') {
          parts.push(`${displayKey}: ${value.join(", ")}`);
        }
      } else if (typeof value === 'object') {
         if (value instanceof Date) {
           parts.push(`${displayKey}: ${value.toISOString()}`);
         } else {
           processObj(value, displayKey);
         }
      } else {
        parts.push(`${displayKey}: ${value}`);
      }
    }
  }
  
  processObj(obj);
  return parts.join(" | ");
}

export async function POST(req: Request) {
  try {
    console.log("[Admin Sync] Fetching all startups from Prisma...");
    const startups = await prisma.startup.findMany({
      include: { founderProfile: true }
    });

    console.log(`[Admin Sync] Found ${startups.length} startups. Syncing to Cosmos DB...`);
    let synced = 0;
    
    // Process in batches of 10 to avoid rate limits
    for (let i = 0; i < startups.length; i += 10) {
      const batch = startups.slice(i, i + 10);
      
      await Promise.all(
        batch.map(async (s) => {
          let embedding = s.embedding as number[] | null;

          if (!embedding || embedding.length === 0) {
            try {
              const startupText = buildSemanticText(s);
              const [newEmb] = await vertexAiEmbed([startupText], { taskType: "RETRIEVAL_DOCUMENT", title: s.name });
              if (newEmb) {
                embedding = newEmb;
                await prisma.startup.update({
                  where: { id: s.id },
                  data: { embedding: newEmb as any }
                }).catch(() => {});
              }
            } catch (e) {
              console.warn(`Failed to embed startup ${s.id}`, e);
            }
          }

          if (embedding && embedding.length > 0) {
            await upsertStartupVector({
              id: s.id,
              name: s.name,
              category: s.category || "Uncategorized",
              embedding: embedding,
            });
            synced++;
          }
        })
      );
      
      console.log(`[Admin Sync] Processed ${Math.min(i + 10, startups.length)} / ${startups.length}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${synced} startups to Cosmos DB.`
    });
  } catch (error: any) {
    console.error("[Admin Sync] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
