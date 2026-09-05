import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vertexAiCallJSON, vertexAiEmbed } from "@/lib/founder-intelligence/model-router";

// Vector Cosine Similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

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

import { upsertStartupVector, searchMatchingStartups } from "@/lib/matchmaking/pg-matchmaking";

export async function POST(req: Request) {
  try {
    let { investorId, investorEmail } = (await req.json().catch(() => ({}))) as any;

    let investor;
    if (investorEmail) {
      investor = await prisma.investor.findUnique({
        where: { email: investorEmail }
      });
    } else if (investorId) {
      investor = await prisma.investor.findUnique({
        where: { id: investorId }
      });
    }

    if (!investor) {
      return NextResponse.json({ success: false, error: "Investor not found" }, { status: 404 });
    }

    // 2. Fetch past interactions for active feedback learning
    const interactions = await prisma.dealInteraction.findMany({
      where: { investorId: investor.id }
    });

    const passedStartupIds = new Set(
      interactions.filter((i) => i.state === "PASSED").map((i) => i.startupId)
    );
    const interestedStartupIds = new Set(
      interactions
        .filter((i) => ["SHORTLISTED", "INTRO_REQUESTED", "MUTUAL_MATCH"].includes(i.state))
        .map((i) => i.startupId)
    );

    // 3. Compute Investor Query Vector via Vertex AI (text-embedding-004)
    const investorQueryText = buildSemanticText(investor);

    let investorVector: number[] | null = null;
    let useVectorSearch = true;
    try {
      const [v] = await vertexAiEmbed([investorQueryText], { taskType: "RETRIEVAL_QUERY" });
      if (!v || v.length === 0) throw new Error("Empty vector");
      investorVector = v;
    } catch (embErr: any) {
      console.warn("[Matchmaking] Vertex AI unavailable, using keyword fallback:", embErr.message);
      useVectorSearch = false;
    }

    let matchIds: string[] = [];
    const scoreMap = new Map<string, number>();

    if (useVectorSearch && investorVector) {
      // 4. Rocchio Relevance Feedback optimization
      if (interestedStartupIds.size > 0 || passedStartupIds.size > 0) {
        const allIds = [...Array.from(interestedStartupIds), ...Array.from(passedStartupIds)];
        const embeddingsMap = new Map();
        if (allIds.length > 0) {
          const idList = allIds.map(id => `'${id}'`).join(',');
          const result = await prisma.$queryRawUnsafe<Array<{id: string, embedding: string}>>(`SELECT id, embedding::text FROM "Startup" WHERE id IN (${idList})`);
          result.forEach(r => embeddingsMap.set(r.id, r.embedding ? JSON.parse(r.embedding) : null));
        }

        const historicalStartups = allIds.map(id => ({ id, embedding: embeddingsMap.get(id) }));
        const interestedEmbeddings = historicalStartups.filter((s) => interestedStartupIds.has(s.id) && Array.isArray(s.embedding)).map((s) => s.embedding as number[]);
        const passedEmbeddings = historicalStartups.filter((s) => passedStartupIds.has(s.id) && Array.isArray(s.embedding)).map((s) => s.embedding as number[]);

        if (interestedEmbeddings.length > 0) {
          const len = investorVector.length;
          for (let i = 0; i < len; i++) {
            const posMean = interestedEmbeddings.reduce((acc, emb) => acc + (emb[i] || 0), 0) / interestedEmbeddings.length;
            investorVector[i] = investorVector[i] * 0.75 + posMean * 0.25;
          }
        }
        if (passedEmbeddings.length > 0) {
          const len = investorVector.length;
          for (let i = 0; i < len; i++) {
            const negMean = passedEmbeddings.reduce((acc, emb) => acc + (emb[i] || 0), 0) / passedEmbeddings.length;
            investorVector[i] = investorVector[i] - negMean * 0.15;
          }
        }
      }

      // 5. pgvector search
      const vectorMatches = await searchMatchingStartups(investorVector, 50);
      const validVectorMatches = vectorMatches.filter(m => !passedStartupIds.has(m.id));
      matchIds = validVectorMatches.map(m => m.id);
      validVectorMatches.forEach(m => scoreMap.set(m.id, m.score));
    }

    // Fallback: use keyword/sector-based DB query when vector search has no results or Vertex AI failed
    if (matchIds.length === 0) {
      const focusSectors = investor.focusSectors || [];
      const preferredStages = investor.preferredStages || [];

      // Priority 1: sector + stage match
      const priorityMatches = await prisma.startup.findMany({
        where: {
          isPublished: true,
          id: { notIn: Array.from(passedStartupIds) },
          OR: [
            ...(focusSectors.length > 0 ? focusSectors.map(s => ({ category: { contains: s, mode: 'insensitive' as any } })) : []),
            ...(preferredStages.length > 0 ? preferredStages.map(s => ({ stage: { equals: s, mode: 'insensitive' as any } })) : []),
          ]
        },
        take: 20,
        select: { id: true, category: true, stage: true }
      });

      if (priorityMatches.length > 0) {
        priorityMatches.forEach(s => {
          const sectorMatch = focusSectors.some(sec => s.category?.toLowerCase().includes(sec.toLowerCase()));
          const stageMatch = preferredStages.some(st => s.stage?.toLowerCase() === st.toLowerCase());
          const score = 0.5 + (sectorMatch ? 0.25 : 0) + (stageMatch ? 0.15 : 0);
          scoreMap.set(s.id, score);
        });
        matchIds = priorityMatches.map(s => s.id);
      } else {
        // Priority 2: any published startup
        const fallbackAll = await prisma.startup.findMany({
          where: { isPublished: true, id: { notIn: Array.from(passedStartupIds) } },
          orderBy: { id: 'desc' },
          take: 20,
          select: { id: true }
        });
        matchIds = fallbackAll.map(s => s.id);
        matchIds.forEach(id => scoreMap.set(id, 0.5));
      }
    }

    if (matchIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }


    // 6. Fetch ONLY the matched startups from Prisma
    const candidateStartups = await prisma.startup.findMany({
      where: {
        isPublished: true,
        id: { in: matchIds }
      },
      include: { founderProfile: true },
    });

    const scoredStartups = candidateStartups.map((s) => {
      const score = scoreMap.get(s.id) || 0.5;
      return {
        startup: s,
        cosineScore: Math.round(Math.max(0.4, Math.min(0.99, score)) * 100),
      };
    });

    // Sort by descending semantic similarity
    scoredStartups.sort((a, b) => b.cosineScore - a.cosineScore);

    // 7. Multi-Dimensional Synthesis via Gemini Synthesis has been removed
    const evaluatedResults: any[] = [];

    // 7. Enrich & assemble final startup feed cards
    const enrichedStartups = candidateStartups.map((s) => {
      const scoredItem = scoredStartups.find((item) => item.startup.id === s.id);
      const aiEval = evaluatedResults.find((e: any) => e.id === s.id);

      const cosineScore = scoredItem ? scoredItem.cosineScore : 75;
      const finalScore = aiEval?.overallScore || cosineScore;

      return {
        ...s,
        matchScore: finalScore,
        aiSummary: aiEval?.aiSummary || s.aiSummary || `Matches your thesis in ${s.category || 'deeptech'} and ${s.stage || 'early'} stage innovation.`,
        matchBreakdown: aiEval?.matchBreakdown || {
          thesis: cosineScore,
          sector: investor.focusSectors?.includes(s.category) ? 95 : 80,
          stage: investor.preferredStages?.includes(s.stage) ? 90 : 75,
          ticketSize: 85,
          traction: 80,
        },
      };
    });

    // Sort by highest match score
    enrichedStartups.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return NextResponse.json({
      success: true,
      data: enrichedStartups,
    });
  } catch (error: any) {
    console.error("Matchmaking API error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process matchmaking." }, { status: 500 });
  }
}

