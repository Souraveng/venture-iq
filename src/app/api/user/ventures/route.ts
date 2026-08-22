import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function getAuthEmail(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) return session.user.email;
  return req.headers.get("x-user-email");
}

/**
 * GET /api/user/ventures
 * Get all ventures (startups) the current user has access to.
 * This includes ventures they founded and ventures they are collaborating on.
 */
export async function GET(req: NextRequest) {
  try {
    const userEmail = await getAuthEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user to get their name
    const user = await prisma.user.findUnique({ where: { email: userEmail } });

    // Find startups they own: either by founderProfile email, OR by user name match
    const ownStartups = await prisma.startup.findMany({
      where: {
        OR: [
          { founderProfile: { email: { equals: userEmail, mode: 'insensitive' as any } } },
          ...(user?.name ? [{ founder: { equals: user.name, mode: 'insensitive' as any } }] : [])
        ]
      },
      select: {
        id: true,
        name: true,
        verified: true,
      }
    });

    // Find startups they are collaborating on
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
