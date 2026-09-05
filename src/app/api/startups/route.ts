import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { vertexAiEmbed } from "@/lib/founder-intelligence/model-router";

// Helper function to build startup text for embedding
function buildStartupEmbeddingText(startup: any, body: any): string {
  return [
    `Startup: ${startup.name}`,
    `Category: ${startup.category || ""}`,
    `Industry: ${startup.businessModel || startup.industry || ""}`,
    `Stage: ${startup.stage || ""}`,
    `Tagline: ${startup.tagline || ""}`,
    `Problem: ${body.coreProblem || body.problemText || startup.problemText || ""}`,
    `Solution: ${body.proposedSolution || body.solutionText || startup.solutionText || ""}`
  ].filter(Boolean).join(". ");
}

export interface Startup {
  id: string;
  name: string;
  tagline: string;
  category: string;
  stage: string;
  valuation: string;
  targetAmount: string;
  raisedAmount: string;
  founder: string;
  location: string;
  traction: string;
  pitchDeckUrl: string;
  verified: boolean;
  videoFormat?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const startup = await prisma.startup.findUnique({
        where: { id },
        include: {
          founderProfile: true
        }
      });

      if (!startup) {
        return NextResponse.json({
          success: false,
          error: "Startup not found."
        }, { status: 404 });
      }

      // Find the investor to fetch the real deal interaction state
      let investorId = "";
      const dbInvestor = await prisma.investor.findFirst();
      if (dbInvestor) {
        investorId = dbInvestor.id;
      }

      const interaction = await prisma.dealInteraction.findUnique({
        where: {
          investorId_startupId: {
            investorId,
            startupId: id
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          ...startup,
          interactionState: interaction ? interaction.state : null
        }
      });
    }

    const founder = searchParams.get("founder");
    const founderEmail = searchParams.get("founderEmail");

    const whereClause: any = {};
    if (founder) {
      whereClause.founder = { equals: founder, mode: 'insensitive' as any };
    } else if (founderEmail) {
      const user = await prisma.user.findUnique({ where: { email: founderEmail } });
      const founderProfiles = await prisma.founder.findMany({
        where: {
          OR: [
            { email: { equals: founderEmail, mode: 'insensitive' as any } },
            ...(user?.name ? [{ fullName: { equals: user.name, mode: 'insensitive' as any } }] : [])
          ]
        }
      });
      whereClause.founderId = { in: founderProfiles.map(f => f.id) };
    } else {
      whereClause.isPublished = true;
    }

    const startups = await prisma.startup.findMany({
      where: whereClause,
      include: {
        founderProfile: true
      }
    });
    
    // The frontend collaboration page expects `data.startups` when searching by `founderEmail`, but currently returns `data: startups` for other cases. Let's make it compatible with the frontend which expects `data.startups`. Or wait, the frontend does: `const data = await res.json(); setVentures(data.startups);`.
    // Wait, the frontend code is:
    // const res = await fetch("/api/startups?founderEmail=" + encodeURIComponent(userEmail));
    // const data = (await res.json()) as any;
    // if (data.startups && data.startups.length > 0) { ... }
    // Let's modify the response to include `startups: startups` alongside `data: startups`.
    
    return NextResponse.json({
      success: true,
      data: startups,
      startups: startups,
      count: startups.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database fetch error (startups):", error);
    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { id, founder, name, tagline, targetAmount, valuation, category, location, traction, roundType, stage, isPublished, introVideoUrl, ...rest } = body;

    // Strict founder profile resolution: prefer email match over name match
    // This prevents creating duplicate profiles when the user's display name has typos
    const founderEmail = body.founderEmail; // passed from frontend with session email
    let founderProfile = null;
    
    // 1. Try to find by email first (most reliable)
    if (founderEmail) {
      founderProfile = await prisma.founder.findUnique({
        where: { email: founderEmail }
      });
    }
    
    // 2. Fallback: find by name (case-insensitive)
    if (!founderProfile && founder) {
      founderProfile = await prisma.founder.findFirst({
        where: { fullName: { equals: founder, mode: 'insensitive' as any } }
      });
    }
    
    // 3. Create new profile only if neither match exists — and always set email
    if (!founderProfile) {
      founderProfile = await prisma.founder.create({
        data: {
          fullName: founder,
          email: founderEmail || null,
          introVideoUrl: introVideoUrl || "https://vimeo.com/123456789",
          startupName: name,
        }
      });
    } else {
      // Update existing profile if needed
      const updateData: any = {};
      if (introVideoUrl) updateData.introVideoUrl = introVideoUrl;
      // Ensure email is always set if available
      if (founderEmail && !founderProfile.email) updateData.email = founderEmail;
      if (Object.keys(updateData).length > 0) {
        founderProfile = await prisma.founder.update({
          where: { id: founderProfile.id },
          data: updateData
        });
      }
    }

    const data = {
      name: name || "",
      tagline: tagline || "",
      targetAmount: targetAmount || "",
      valuation: valuation || "",
      category: category || "",
      location: location || "",
      traction: traction || "",
      stage: roundType || stage || "",
      raisedAmount: rest.raisedAmount || "",
      pitchDeckUrl: rest.pitchDeckUrl || "#",
      isPublished: isPublished ?? false,
      founder, // Added back for backwards compatibility with legacy queries
      ...rest
    };

    let startup;

    if (id) {
      startup = await prisma.startup.upsert({
        where: { id },
        update: { ...data, founderId: founderProfile.id },
        create: { id, ...data, founderId: founderProfile.id },
      });
    } else {
      const existing = await prisma.startup.findFirst({
        where: {
          OR: [
            { founder: { equals: founder, mode: 'insensitive' } },
            { name: { equals: name, mode: 'insensitive' } }
          ]
        }
      });

      if (existing) {
        startup = await prisma.startup.update({
          where: { id: existing.id },
          data: { ...data, founderId: founderProfile.id }
        });
      } else {
        startup = await prisma.startup.create({
          data: { ...data, founderId: founderProfile.id }
        });
      }
    }

    // Generate and persist vector embedding via Vertex AI (gemini-embedding-2) in the background
    try {
      const textToEmbed = buildStartupEmbeddingText(startup, body);
      vertexAiEmbed([textToEmbed], { taskType: "RETRIEVAL_DOCUMENT", title: body.name || startup.name || "Startup Profile" })
        .then(async (embeddings) => {
          if (embeddings && embeddings[0]) {
            const embStr = `[${embeddings[0].join(",")}]`;
            await prisma.$executeRaw`UPDATE "Startup" SET embedding = ${embStr}::vector WHERE id = ${startup.id}`;
          }
        })
        .catch((err) => {
          console.warn("[Vertex AI Embedding] Failed to generate/store embedding for startup:", startup.id, err);
        });
    } catch (e) {
      console.warn("Failed to trigger Vertex AI embedding:", e);
    }

    return NextResponse.json({
      success: true,
      data: startup,
    });
  } catch (error: any) {
    console.error("Database save error (startups):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required." }, { status: 400 });
    }

    await prisma.startup.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database delete error (startups):", error);
    return NextResponse.json({ success: false, error: "Failed to delete startup." }, { status: 500 });
  }
}
