import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const email = req.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ success: false, error: "Missing x-user-email header" }, { status: 401 });
    }

    const { activeTeamId } = (await req.json()) as any;

    await prisma.user.update({
      where: { email },
      data: {
        lastActiveTeamId: activeTeamId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving user preferences:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
