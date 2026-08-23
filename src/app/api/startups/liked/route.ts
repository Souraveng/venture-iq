import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const teamId = searchParams.get("teamId");

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized: User email required" }, { status: 401 });
    }

    let queryInvestorIds: string[] = [];

    if (teamId && teamId !== "null" && teamId !== "undefined") {
      queryInvestorIds = [teamId, `team:${teamId}`];
    } else {
      const dbInvestor = await prisma.investor.findFirst({
        where: { email: { equals: email, mode: "insensitive" } }
      });
      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } }
      });

      queryInvestorIds = [
        email,
        ...(dbInvestor ? [dbInvestor.id] : []),
        ...(dbUser ? [dbUser.id] : [])
      ];
    }

    // Fetch interactions where the user or team liked/shortlisted/requested intro/matched
    const interactions = await prisma.dealInteraction.findMany({
      where: {
        investorId: { in: queryInvestorIds },
        state: {
          in: ["EXPLORED", "SHORTLISTED", "INTRO_REQUESTED", "MUTUAL_MATCH"]
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    const startupIds = interactions.map(i => i.startupId);
    
    const startupsData = await prisma.startup.findMany({
      where: {
        id: { in: startupIds }
      },
      include: {
        founderProfile: true
      }
    });

    // Map them together
    const startups = startupsData.map(startup => {
      const interaction = interactions.find(i => i.startupId === startup.id);
      return {
        ...startup,
        interactionState: interaction?.state
      };
    });

    return NextResponse.json({
      success: true,
      data: startups
    });

  } catch (error: any) {
    console.error("Failed to fetch liked startups:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pipeline." },
      { status: 500 }
    );
  }
}
