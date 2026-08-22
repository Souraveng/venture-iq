import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const investorEmail = searchParams.get("investorEmail");

    if (!investorEmail) {
      return NextResponse.json({ success: false, error: "investorEmail is required." }, { status: 400 });
    }

    const investor = await prisma.investor.findFirst({
      where: { email: investorEmail }
    });

    if (!investor) {
      return NextResponse.json({ success: true, data: [] });
    }

    const interactions = await prisma.dealInteraction.findMany({
      where: {
        investorId: investor.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (interactions.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const startupIds = interactions.map((i) => i.startupId);
    
    const startups = await prisma.startup.findMany({
      where: {
        id: {
          in: startupIds,
        },
      },
      include: {
        founderProfile: true,
      },
    });

    const startupMap: Record<string, any> = {};
    startups.forEach(s => {
      startupMap[s.id] = s;
    });

    const enrichedData = interactions.map((interaction) => {
      const st = startupMap[interaction.startupId];
      const hasStartup = !!st;

      return {
        id: interaction.id,
        investorId: interaction.investorId,
        startupId: interaction.startupId,
        state: interaction.state,
        createdAt: interaction.createdAt,
        updatedAt: interaction.updatedAt,
        startup: {
          name: hasStartup ? st.name : "Unknown Startup",
          category: hasStartup ? st.category : "Unknown",
          founder: hasStartup ? (st.founder || "Founder") : "Unknown",
          stage: hasStartup ? (st.stage || "Pre-Seed") : "Unknown",
          founderEmail: hasStartup ? st.founderProfile?.email : null,
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedData,
    });
  } catch (error) {
    console.error("Failed to fetch investor interactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch requests." },
      { status: 500 }
    );
  }
}
