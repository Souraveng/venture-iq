import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/teams/invites — returns pending team invitations for the current user
export async function GET(req: NextRequest) {
  try {
    const userEmail = req.headers.get("x-user-email") || "";
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invites = await prisma.teamMember.findMany({
      where: {
        userEmail,
        status: "PENDING"
      },
      include: {
        team: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, invites });
  } catch (err: any) {
    console.error("Error fetching invites:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
