import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserVentureRole, isPrimaryFounder } from "@/lib/permissions";

/**
 * Helper: Extract authenticated user email from session (preferred) or header (fallback).
 */
async function getAuthEmail(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) return session.user.email;
  // Fallback: x-user-email header (for backward compatibility)
  return req.headers.get("x-user-email");
}

/**
 * GET /api/ventures/collaborators?startupId=xxx[&checkRole=true]
 * Lists all collaborators for a venture. If checkRole=true, also returns current user's role.
 */
export async function GET(req: NextRequest) {
  try {
    const userEmail = await getAuthEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get("startupId");
    const checkRole = searchParams.get("checkRole") === "true";

    if (!startupId) {
      return NextResponse.json(
        { error: "startupId is required" },
        { status: 400 }
      );
    }

    // Verify the requesting user has access to this venture
    const callerRole = await getUserVentureRole(userEmail, startupId);
    if (!callerRole) {
      return NextResponse.json(
        { error: "You do not have access to this venture" },
        { status: 403 }
      );
    }

    // Fetch all collaborators
    const collaborators = await prisma.ventureCollaborator.findMany({
      where: { startupId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    // Also include the primary founder (they may not have a VentureCollaborator row)
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      select: {
        founderProfile: {
          select: { email: true, fullName: true, avatarUrl: true },
        },
        founder: true,
      },
    });

    const founderEmail =
      startup?.founderProfile?.email ||
      (startup?.founder ? `${startup.founder.toLowerCase().replace(/\s+/g, '')}@ventureiq.internal` : null);

    const result = collaborators.map((c: any) => ({
      id: c.id,
      email: c.userEmail,
      role: c.role,
      status: c.status,
      invitedBy: c.invitedBy,
      createdAt: c.createdAt,
      isPrimaryFounder: c.userEmail === founderEmail,
    }));

    // If primary founder has no collaborator row, prepend them
    if (founderEmail && !result.some((r: any) => r.email === founderEmail)) {
      result.unshift({
        id: "primary-founder",
        email: founderEmail,
        role: "OWNER",
        status: "ACTIVE",
        invitedBy: "system",
        createdAt: new Date().toISOString(),
        isPrimaryFounder: true,
      });
    }

    return NextResponse.json({
      success: true,
      collaborators: result,
      callerRole,
    });
  } catch (err: any) {
    console.error("Error fetching collaborators:", err);
    return NextResponse.json(
      { error: "Failed to fetch collaborators" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ventures/collaborators
 * Invite a collaborator to a venture.
 * Body: { startupId, email, role: "OWNER" | "EDITOR" | "VIEWER" }
 * Caller must be OWNER of the venture.
 */
export async function POST(req: NextRequest) {
  try {
    const userEmail = await getAuthEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      startupId?: string;
      email?: string;
      role?: string;
    };
    const { startupId, email, role } = body;

    if (!startupId || !email) {
      return NextResponse.json(
        { error: "startupId and email are required" },
        { status: 400 }
      );
    }

    // Caller must be an OWNER
    const callerRole = await getUserVentureRole(userEmail, startupId);
    if (callerRole !== "OWNER") {
      return NextResponse.json(
        { error: "Only venture owners can invite collaborators" },
        { status: 403 }
      );
    }

    // Check if the user being invited exists in the system
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          error:
            "This email is not registered on Venture IQ. Only existing users can be invited.",
        },
        { status: 400 }
      );
    }

    // Check if already a collaborator
    const existing = await prisma.ventureCollaborator.findUnique({
      where: { startupId_userEmail: { startupId, userEmail: email } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This user is already a collaborator on this venture" },
        { status: 400 }
      );
    }

    // Check if invitee is the primary founder (they don't need an invite)
    const isFounder = await isPrimaryFounder(email, startupId);
    if (isFounder) {
      return NextResponse.json(
        {
          error:
            "This user is the primary founder and already has full access",
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["OWNER", "EDITOR", "VIEWER"];
    const assignRole = role && validRoles.includes(role) ? role : "VIEWER";

    const collaborator = await prisma.ventureCollaborator.create({
      data: {
        startupId,
        userEmail: email,
        role: assignRole as any,
        invitedBy: userEmail,
        status: "PENDING", // Wait for the invitee to accept
      },
    });

    // Create a notification for the invitee
    try {
      await prisma.notification.create({
        data: {
          userEmail: email,
          type: "COLLABORATION_INVITE",
          title: "You've been added to a venture team",
          message: `${userEmail} added you as ${assignRole} to their venture.`,
          category: "collaboration",
          metadata: {
            startupId,
            role: assignRole,
            invitedBy: userEmail,
          },
        },
      });
    } catch (notifErr) {
      // Don't fail the invite if notification creation fails
      console.error("Failed to create invite notification:", notifErr);
    }

    return NextResponse.json({ success: true, collaborator });
  } catch (err: any) {
    console.error("Error inviting collaborator:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
