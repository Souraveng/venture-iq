import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startupName = searchParams.get("startupName");

    if (!startupName) {
      return NextResponse.json({ success: false, error: "startupName is required." }, { status: 400 });
    }

    const startup = await prisma.startup.findFirst({
      where: { name: startupName }
    });

    if (!startup) {
      return NextResponse.json({ success: true, data: [] });
    }

    const interactions = await prisma.dealInteraction.findMany({
      where: {
        startupId: startup.id,
        state: {
          in: ["INTRO_REQUESTED", "MUTUAL_MATCH"],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (interactions.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 2. We need investor details. Since there's no foreign key relation
    // mapped in Prisma for investorId right now, we fetch manually.
    const investorIds = interactions.map((i) => i.investorId);
    
    // In our mock, the investorId is "" which might not exist in the DB.
    // Let's see if we have them, otherwise provide mock data.
    const investors = await prisma.investor.findMany({
      where: {
        id: {
          in: investorIds,
        },
      },
    });

    // Map investor objects by ID for quick lookup
    const investorMap: Record<string, any> = {};
    investors.forEach(inv => {
      investorMap[inv.id] = inv;
    });

    // 3. Assemble the response
    const enrichedData = interactions.map((interaction) => {
      const inv = investorMap[interaction.investorId] || {
        // Fallback mock investor if "" is not in DB
        name: "Demo Investor",
        firm: "Demo Ventures",
        avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250",
        checkSize: "$500K - $1M",
        location: "Global",
        trustScore: "9.9/10"
      };

      return {
        id: interaction.id,
        investorId: interaction.investorId,
        startupId: interaction.startupId,
        state: interaction.state,
        createdAt: interaction.createdAt,
        updatedAt: interaction.updatedAt,
        investor: {
          name: inv.name,
          firm: inv.firm,
          avatarUrl: inv.avatarUrl,
          checkSize: inv.checkSize,
          location: inv.location,
          trustScore: inv.trustScore,
          email: inv.email,
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedData,
    });
  } catch (error) {
    console.error("Failed to fetch founder interactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch requests." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { interactionId, action } = body;

    if (!interactionId || !action) {
      return NextResponse.json(
        { success: false, error: "interactionId and action are required." },
        { status: 400 }
      );
    }

    let newState: any;
    if (action === "accept") {
      newState = "MUTUAL_MATCH";
    } else if (action === "reject") {
      newState = "PASSED"; // Or a specific state like FOUNDER_REJECTED
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action." },
        { status: 400 }
      );
    }

    const updatedInteraction = await prisma.dealInteraction.update({
      where: {
        id: interactionId,
      },
      data: {
        state: newState,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedInteraction,
    });
  } catch (error) {
    console.error("Failed to update interaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update request." },
      { status: 500 }
    );
  }
}
