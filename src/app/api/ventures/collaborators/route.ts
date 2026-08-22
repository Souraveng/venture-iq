import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserVentureRole, isPrimaryFounder } from "@/lib/permissions";

/**
 * GET /api/ventures/collaborators?startupId=xxx[&checkRole=true]
 * Lists all collaborators for a venture. If checkRole=true, also returns current user's role.
 */
export async function GET(req: NextRequest) {
  try {
    const userEmail = req.headers.get("x-user-email");
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
    // @ts-ignore - Prisma client out of sync
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
      },
    });

    const primaryFounderEmail = startup?.founderProfile?.email || null;

    const response: any = {
      success: true,
      collaborators,
      primaryFounderEmail,
      primaryFounderName: startup?.founderProfile?.fullName || null,
      primaryFounderAvatar: startup?.founderProfile?.avatarUrl || null,
    };

    if (checkRole) {
      response.currentUserRole = callerRole;
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Error fetching collaborators:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ventures/collaborators
 * Invite a new collaborator to a venture.
 * Body: { startupId, email, role }
 * Requires OWNER role on the venture.
 */
export async function POST(req: NextRequest) {
  try {
    const userEmail = req.headers.get("x-user-email");
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { startupId, email, role } = body as {
      startupId: string;
      email: string;
      role?: string;
    };

    if (!startupId || !email) {
      return NextResponse.json(
        { error: "startupId and email are required" },
        { status: 400 }
      );
    }

    // Only OWNERs can invite
    const callerRole = await getUserVentureRole(userEmail, startupId);
    if (callerRole !== "OWNER") {
      return NextResponse.json(
        { error: "Only venture owners can invite collaborators" },
        { status: 403 }
      );
    }

    // Cannot invite yourself
    if (email === userEmail) {
      return NextResponse.json(
        { error: "You cannot invite yourself" },
        { status: 400 }
      );
    }

    // Check that the invitee has a Venture IQ account
    const invitee = await prisma.user.findUnique({
      where: { email },
    });
    if (!invitee) {
      return NextResponse.json(
        {
          error:
            "This email is not registered on Venture IQ. Only existing users can be invited.",
        },
        { status: 400 }
      );
    }

    // Check if already a collaborator
    // @ts-ignore - Prisma client out of sync
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

    // @ts-ignore - Prisma client out of sync
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
