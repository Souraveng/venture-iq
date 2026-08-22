import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const investorEmail = searchParams.get("investorEmail");
    const teamId = searchParams.get("teamId");

    if (!investorEmail) {
      return NextResponse.json({ success: false, error: "investorEmail is required." }, { status: 400 });
    }

    let queryInvestorIds: string[] = [];

    if (teamId && teamId !== "null" && teamId !== "undefined") {
      // Team Workspace mode: verify user is an active member of this team
      const member = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userEmail: { equals: investorEmail, mode: "insensitive" },
          status: "ACTIVE"
        }
      });

      if (!member) {
        return NextResponse.json({ success: false, error: "Unauthorized access to team workspace." }, { status: 403 });
      }

      // Collect team identifier keys
      queryInvestorIds = [teamId, `team:${teamId}`];
    } else {
      // Personal Workspace mode: user's personal Investor ID / email
      const investor = await prisma.investor.findFirst({
        where: { email: { equals: investorEmail, mode: "insensitive" } }
      });
      const user = await prisma.user.findFirst({
        where: { email: { equals: investorEmail, mode: "insensitive" } }
      });

      queryInvestorIds = [
        investorEmail,
        ...(investor ? [investor.id] : []),
        ...(user ? [user.id] : [])
      ];
    }

    const interactions = await prisma.dealInteraction.findMany({
      where: {
        investorId: { in: queryInvestorIds },
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
