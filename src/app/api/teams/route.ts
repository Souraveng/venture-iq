import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userEmail = req.headers.get("x-user-email") || "investor@ventureiq.com"; // Default for testing if not set
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { userEmail }
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
    const userEmail = req.headers.get("x-user-email") || "investor@ventureiq.com"; // Default for testing
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Enforce single team per user
    const existingTeam = await prisma.teamMember.findFirst({
      where: { userEmail }
    });

    if (existingTeam) {
      return NextResponse.json({ success: false, error: "You can only belong to one team." }, { status: 400 });
    }

    const body = (await req.json()) as any;
    const { name, description } = body;

    const team = await prisma.team.create({
      data: {
        name,
        description,
        members: {
          create: {
            userEmail,
            role: "OWNER"
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
