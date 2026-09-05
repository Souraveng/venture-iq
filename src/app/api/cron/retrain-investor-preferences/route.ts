import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vertexAiEmbed } from "@/lib/founder-intelligence/model-router";

// Weights for implicit and explicit behavioral signals
const EVENT_WEIGHTS: Record<string, number> = {
  // High positive intent
  SHORTLISTED: 6.0,
  INTRO_REQUESTED: 7.0,
  VIEW_SPECS: 4.0,
  VIEW_DECK: 4.0,
  VIDEO_WATCHED_10S: 3.5,
  DWELL_HIGH: 2.5,
  
  // Negative / Disinterest intent
  SKIP_FAST: -2.0,
  PASSED: -5.0,
};

export async function POST(req: Request) {
  try {
    // Optional secret key check for Vercel Cron or Cloud Tasks
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In development allow without secret
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Find all investors with activity in the last 24h
    const recentEvents = await prisma.investorActivityEvent.findMany({
      where: { createdAt: { gte: oneDayAgo } },
      orderBy: { createdAt: "desc" },
    });

    const recentInteractions = await prisma.dealInteraction.findMany({
      where: { updatedAt: { gte: oneDayAgo } },
    });

    const activeInvestorIds = Array.from(
      new Set([
        ...recentEvents.map((e) => e.investorId),
        ...recentInteractions.map((i) => i.investorId),
      ])
    );

    if (activeInvestorIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No investor activity recorded in the past 24 hours. No retraining required.",
        updatedCount: 0,
      });
    }

    let updatedCount = 0;
    const updateSummaries: any[] = [];

    // 2. Process each investor's daily behavior
    for (const investorId of activeInvestorIds) {
      const investor = await prisma.investor.findUnique({
        where: { id: investorId },
      });

      if (!investor) continue;

      const investorEvents = recentEvents.filter((e) => e.investorId === investorId);
      const investorInteractions = recentInteractions.filter((i) => i.investorId === investorId);

      // Map startup ID -> cumulative engagement weight
      const startupWeights = new Map<string, number>();

      for (const ev of investorEvents) {
        const weight = EVENT_WEIGHTS[ev.eventType] || 1.0;
        startupWeights.set(ev.startupId, (startupWeights.get(ev.startupId) || 0) + weight);
      }

      for (const inter of investorInteractions) {
        const weight = EVENT_WEIGHTS[inter.state] || 0;
        startupWeights.set(inter.startupId, (startupWeights.get(inter.startupId) || 0) + weight);
      }

      if (startupWeights.size === 0) continue;

      // 3. Fetch startup embeddings
      const startupsRaw = await prisma.startup.findMany({
        where: { id: { in: Array.from(startupWeights.keys()) } },
        select: { id: true, name: true, category: true },
      });
      const embeddingsRaw = await prisma.$queryRaw<Array<{id: string, embedding: string}>>`SELECT id, embedding::text FROM "Startup" WHERE id IN (${prisma.startup.fields.id})`; // Using raw is a bit tricky for IN clause, let's use Prisma.join
      
      const embeddingsMap = new Map();
      if (startupWeights.size > 0) {
        const idsArray = Array.from(startupWeights.keys());
        const idList = idsArray.map(id => `'${id}'`).join(',');
        const result = await prisma.$queryRawUnsafe<Array<{id: string, embedding: string}>>(`SELECT id, embedding::text FROM "Startup" WHERE id IN (${idList})`);
        result.forEach(r => embeddingsMap.set(r.id, r.embedding ? JSON.parse(r.embedding) : null));
      }

      const startups = startupsRaw.map(s => ({ ...s, embedding: embeddingsMap.get(s.id) }));

      const positiveVectors: { vec: number[]; weight: number }[] = [];
      const negativeVectors: { vec: number[]; weight: number }[] = [];

      for (const s of startups) {
        if (!Array.isArray(s.embedding) || s.embedding.length === 0) continue;
        const totalWeight = startupWeights.get(s.id) || 0;

        if (totalWeight > 0) {
          positiveVectors.push({ vec: s.embedding as number[], weight: totalWeight });
        } else if (totalWeight < 0) {
          negativeVectors.push({ vec: s.embedding as number[], weight: Math.abs(totalWeight) });
        }
      }

      // Ensure investor base vector exists
      let currentVector = Array.isArray(investor.investorEmbedding)
        ? (investor.investorEmbedding as number[])
        : null;

      if (!currentVector || currentVector.length === 0) {
        const queryText = `Thesis: ${investor.thesis || ""}. Focus: ${(investor.focusSectors || []).join(", ")}. Stages: ${(investor.preferredStages || []).join(", ")}`;
        const [generated] = await vertexAiEmbed([queryText], { taskType: "RETRIEVAL_QUERY" });
        currentVector = generated;
      }

      if (!currentVector) continue;

      const vectorLen = currentVector.length;
      const updatedVector = [...currentVector];

      // 4. Calculate Weighted Positive Centroid
      if (positiveVectors.length > 0) {
        const totalPosWeight = positiveVectors.reduce((acc, p) => acc + p.weight, 0);
        for (let i = 0; i < vectorLen; i++) {
          const weightedSum = positiveVectors.reduce((acc, p) => acc + p.vec[i] * p.weight, 0);
          const posMean = weightedSum / totalPosWeight;
          // Apply slight adaptive drift (15% daily learning rate)
          updatedVector[i] = updatedVector[i] * 0.85 + posMean * 0.15;
        }
      }

      // 5. Subtract Negative Repulsion Centroid
      if (negativeVectors.length > 0) {
        const totalNegWeight = negativeVectors.reduce((acc, n) => acc + n.weight, 0);
        for (let i = 0; i < vectorLen; i++) {
          const weightedSum = negativeVectors.reduce((acc, n) => acc + n.vec[i] * n.weight, 0);
          const negMean = weightedSum / totalNegWeight;
          // Subtract negative direction (8% repulsion rate)
          updatedVector[i] = updatedVector[i] - negMean * 0.08;
        }
      }

      // 6. Save updated preference vector back to database
      const embStr = `[${updatedVector.join(",")}]`;
      await prisma.$executeRaw`
        UPDATE "Investor" 
        SET "investorEmbedding" = ${embStr}::vector, "activityScore" = ${Math.min(100, (investor.activityScore || 50) + positiveVectors.length * 2)}
        WHERE id = ${investor.id}
      `;

      updatedCount++;
      updateSummaries.push({
        investorEmail: investor.email,
        positiveSignals: positiveVectors.length,
        negativeSignals: negativeVectors.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Nightly retraining completed successfully. Updated ${updatedCount} investor preference vectors.`,
      updatedCount,
      details: updateSummaries,
    });
  } catch (error: any) {
    console.error("[Nightly Retraining Cron Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrain preferences" },
      { status: 500 }
    );
  }
}

// Allow manual GET trigger in development for easy testing
export async function GET(req: Request) {
  return POST(req);
}
