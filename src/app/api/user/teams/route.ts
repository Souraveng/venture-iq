import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const email = req.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ success: false, error: "Missing x-user-email header" }, { status: 401 });
    }

    const teamMemberships = await prisma.teamMember.findMany({
      where: { userEmail: email },
      include: { team: true },
    });

    const teams = teamMemberships.map(m => ({
      ...m.team,
      memberRole: m.role,
      modulePermissions: (m as any).modulePermissions,
    }));

    const user = await prisma.user.findUnique({
      where: { email },
      select: { lastActiveTeamId: true }
    });

    return NextResponse.json({ 
      success: true, 
      teams,
      lastActiveTeamId: user?.lastActiveTeamId || null
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
