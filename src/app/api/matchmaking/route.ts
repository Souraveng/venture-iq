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

    // 1. Fetch past interactions for active feedback learning
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

    // 2. Fetch published startups from PostgreSQL (excluding explicitly passed deals)
    const startups = await prisma.startup.findMany({
      where: {
        isPublished: true,
        id: { notIn: Array.from(passedStartupIds) }
      },
      include: { founderProfile: true },
    });

    if (startups.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // 3. Compute Investor Query Vector via Vertex AI (gemini-embedding-2)
    const investorQueryText = [
      `Investment Thesis: ${investor.thesis || "High-growth tech startups"}`,
      `Focus Sectors: ${(investor.focusSectors || []).join(", ")}`,
      `Preferred Stages: ${(investor.preferredStages || []).join(", ")}`,
      `Check Size: ${investor.checkSize || investor.minCheckSize || "$50k - $250k"}`,
    ].join(". ");

    let investorVector: number[];
    try {
      const [v] = await vertexAiEmbed([investorQueryText]);
      if (!v || v.length === 0) {
        throw new Error("Empty vector returned from Vertex AI Embedding service.");
      }
      investorVector = v;
    } catch (embErr: any) {
      console.error("[Matchmaking API] Vertex AI Embedding error:", embErr);
      return NextResponse.json({
        success: false,
        error: "Unable to connect to Google Vertex AI Matchmaker service. " + (embErr.message || "")
      }, { status: 503 });
    }

    // 4. Optimize Vector via Rocchio Relevance Feedback (using interested vs passed deals)
    if (interestedStartupIds.size > 0 || passedStartupIds.size > 0) {
      const historicalStartups = await prisma.startup.findMany({
        where: { id: { in: [...Array.from(interestedStartupIds), ...Array.from(passedStartupIds)] } },
        select: { id: true, embedding: true }
      });

      const interestedEmbeddings = historicalStartups
        .filter((s) => interestedStartupIds.has(s.id) && Array.isArray(s.embedding))
        .map((s) => s.embedding as number[]);

      const passedEmbeddings = historicalStartups
        .filter((s) => passedStartupIds.has(s.id) && Array.isArray(s.embedding))
        .map((s) => s.embedding as number[]);

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

    // 5. Rank Startups by Cosine Similarity using gemini-embedding-2 vectors
    const scoredStartups = await Promise.all(
      startups.map(async (s) => {
        let embedding = s.embedding as number[] | null;

        // If startup doesn't have an embedding yet, generate & cache on-the-fly
        if (!embedding || embedding.length === 0) {
          try {
            const startupText = [
              `Startup: ${s.name}`,
              `Category: ${s.category}`,
              `Stage: ${s.stage}`,
              `Tagline: ${s.tagline}`,
              `Problem: ${s.problemText || ""}`,
              `Solution: ${s.solutionText || ""}`,
            ].filter(Boolean).join(". ");

            const [newEmb] = await vertexAiEmbed([startupText]);
            if (newEmb) {
              embedding = newEmb;
              await prisma.startup.update({
                where: { id: s.id },
                data: { embedding: newEmb as any }
              }).catch(() => {});
            }
          } catch (e) {
            // Non-blocking for single item
          }
        }

        const cosineSim = (embedding && embedding.length > 0)
          ? cosineSimilarity(investorVector, embedding)
          : 0.5;

        return {
          startup: s,
          cosineScore: Math.round(Math.max(0.4, Math.min(0.99, cosineSim)) * 100)
        };
      })
    );

    // Sort by descending semantic similarity
    scoredStartups.sort((a, b) => b.cosineScore - a.cosineScore);
    const candidateStartups = scoredStartups.map(item => item.startup);

    // 6. Multi-Dimensional Synthesis via Gemini 3.7 Flash
    const promptPayload = candidateStartups.slice(0, 8).map((s) => ({
      id: s.id,
      name: s.name,
      tagline: s.tagline,
      category: s.category,
      industry: s.industry,
      stage: s.stage,
      valuation: s.valuation || s.fixedValuation || "Undisclosed",
      targetAmount: s.targetAmount || "Undisclosed",
      traction: s.traction || s.arrMrr || "Early stage",
    }));

    const synthesisPrompt = `You are a high-speed Venture Capital Matchmaking Agent.
Evaluate the following startup candidates against this investor's profile:
- Investor Thesis: "${investor.thesis || "General high-growth technology startups"}"
- Focus Sectors: ${JSON.stringify(investor.focusSectors || [])}
- Preferred Stages: ${JSON.stringify(investor.preferredStages || [])}
- Check Size: "${investor.checkSize || investor.minCheckSize + ' - ' + investor.maxCheckSize || '$50K - $250K'}"
${interestedStartupIds.size > 0 ? `- Note: Investor has previously shown interest in ${interestedStartupIds.size} similar deals.` : ''}

Startup Candidates:
${JSON.stringify(promptPayload, null, 2)}

For each startup, provide:
1. overallScore (0-100 based on thesis, sector, stage, and ticket fit)
2. aiSummary (A concise 1-sentence explanation of why this startup matches the investor's thesis)
3. matchBreakdown:
   - thesis (0-100)
   - sector (0-100)
   - stage (0-100)
   - ticketSize (0-100)
   - traction (0-100)
`;

    let evaluatedResults: any[] = [];
    try {
      const aiResponse = await vertexAiCallJSON<Array<{
        id: string;
        overallScore: number;
        aiSummary: string;
        matchBreakdown: {
          thesis: number;
          sector: number;
          stage: number;
          ticketSize: number;
          traction: number;
        };
      }>>({
        model: "financial", // Uses Gemini 3.7 Flash for low-latency structured output
        messages: [{ role: "user", content: synthesisPrompt }],
        temperature: 0.2,
        guidedJson: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              overallScore: { type: "number", minimum: 0, maximum: 100 },
              aiSummary: { type: "string" },
              matchBreakdown: {
                type: "object",
                properties: {
                  thesis: { type: "number" },
                  sector: { type: "number" },
                  stage: { type: "number" },
                  ticketSize: { type: "number" },
                  traction: { type: "number" },
                },
                required: ["thesis", "sector", "stage", "ticketSize", "traction"],
              },
            },
            required: ["id", "overallScore", "aiSummary", "matchBreakdown"],
          },
        },
      });

      if (Array.isArray(aiResponse) && aiResponse.length > 0) {
        evaluatedResults = aiResponse;
      }
    } catch (aiError: any) {
      console.error("[Matchmaking API] Gemini 3.7 Flash synthesis error:", aiError);
      return NextResponse.json({
        success: false,
        error: "Unable to connect to Google Vertex AI Gemini 3.7 Flash scoring agent."
      }, { status: 503 });
    }

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

