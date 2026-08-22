import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userEmail = req.headers.get("x-user-email") || "investor@ventureiq.com";
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { userEmail, status: "ACTIVE" }
        }
      },
      include: {
        members: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, teams });
  } catch (err: any) {
    console.error("Error fetching teams:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userEmail = req.headers.get("x-user-email") || "investor@ventureiq.com";
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as any;
    const { name, description, teamType } = body;

    // Determine the teamType based on the user's role or explicit param
    const resolvedTeamType = teamType || "INVESTOR";

    const team = await prisma.team.create({
      data: {
        name,
        description,
        teamType: resolvedTeamType,
        members: {
          create: {
            userEmail,
            role: "OWNER",
            status: "ACTIVE" // Creator is automatically active
          }
        }
      }
    });

    return NextResponse.json({ success: true, team });
  } catch (err: any) {
    console.error("Error creating team:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
