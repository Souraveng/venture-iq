import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/teams/search-users?q=email@example.com&type=investor
// Searches for users by email, filtered by role (investor/founder)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const teamType = searchParams.get("type") || "investor"; // "investor" or "founder"

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        email: { contains: query, mode: "insensitive" },
        roles: { has: teamType }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: 10
    });

    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    console.error("Error searching users:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
