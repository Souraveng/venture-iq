import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/ventures
 * Get all ventures (startups) the current user has access to.
 * This includes ventures they founded and ventures they are collaborating on.
 */
export async function GET(req: NextRequest) {
  try {
    const userEmail = req.headers.get("x-user-email");
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's profile to get their own startups
    const founder = await prisma.founder.findUnique({
      where: { email: userEmail },
      include: {
        startups: {
          select: {
            id: true,
            name: true,
            verified: true,
          },
        },
      },
    });

    // Find startups they are collaborating on
    // @ts-ignore - Prisma client out of sync
    const collaborations = await prisma.ventureCollaborator.findMany({
      where: {
        userEmail,
        status: "ACTIVE",
      },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            verified: true,
          },
        },
      },
    });

    const ownStartups = founder?.startups || [];
    const collabStartups = collaborations.map((c: any) => c.startup);

    // Merge and deduplicate just in case
    const allVenturesMap = new Map();
    ownStartups.forEach((s) => allVenturesMap.set(s.id, { ...s, role: "OWNER" }));
    collabStartups.forEach((s: any) => {
      if (!allVenturesMap.has(s.id)) {
        allVenturesMap.set(s.id, { ...s, role: collaborations.find((c: any) => c.startupId === s.id)?.role || "VIEWER" });
      }
    });

    const ventures = Array.from(allVenturesMap.values());

    return NextResponse.json({ success: true, ventures });
  } catch (err: any) {
    console.error("Error fetching user ventures:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
