import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/invitations
 * Get all pending venture collaboration invitations for the current user.
 */
export async function GET(req: NextRequest) {
  try {
    const userEmail = req.headers.get("x-user-email");
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore - Prisma client out of sync
    const invitations = await prisma.ventureCollaborator.findMany({
      where: {
        userEmail,
        status: "PENDING",
      },
      include: {
        startup: {
          select: {
            name: true,
            stage: true,
            tagline: true,
            founderProfile: {
              select: {
                fullName: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, invitations });
  } catch (err: any) {
    console.error("Error fetching invitations:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
