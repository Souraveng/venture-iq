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
 * GET /api/user/invitations
 * Get all pending venture collaboration invitations for the current user.
 */
export async function GET(req: NextRequest) {
  try {
    const userEmail = await getAuthEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitations = await prisma.ventureCollaborator.findMany({
      where: {
        userEmail: { equals: userEmail, mode: "insensitive" },
        status: "PENDING",
      },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            stage: true,
            tagline: true,
            category: true,
            founder: true,
            founderProfile: {
              select: {
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
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

/**
 * PUT /api/user/invitations
 * Accept or decline a venture collaboration invitation.
 * Body: { invitationId, status: "ACTIVE" | "REVOKED" | "DECLINED" }
 */
export async function PUT(req: NextRequest) {
  try {
    const userEmail = await getAuthEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as any;
    const { invitationId, status } = body;

    if (!invitationId || !status) {
      return NextResponse.json(
        { error: "invitationId and status are required" },
        { status: 400 }
      );
    }

    const invitation = await prisma.ventureCollaborator.findUnique({
      where: { id: invitationId },
      include: { startup: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.userEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "You are not authorized to respond to this invitation" },
        { status: 403 }
      );
    }

    const updated = await prisma.ventureCollaborator.update({
      where: { id: invitationId },
      data: {
        status: status === "ACTIVE" ? "ACTIVE" : "REVOKED",
      },
    });

    // If accepted, send confirmation notification to the inviting owner
    if (status === "ACTIVE" && invitation.invitedBy) {
      try {
        await prisma.notification.create({
          data: {
            userEmail: invitation.invitedBy,
            type: "COLLABORATION_ACCEPTED",
            title: "Invitation Accepted",
            message: `${userEmail} accepted your invitation to collaborate on "${invitation.startup?.name}".`,
            category: "collaboration",
            metadata: {
              startupId: invitation.startupId,
              collaboratorEmail: userEmail,
              role: invitation.role,
            },
          },
        });
      } catch (notifErr) {
        console.warn("Failed to notify inviter of acceptance:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      collaborator: updated,
      startupId: updated.startupId,
    });
  } catch (err: any) {
    console.error("Error updating invitation status:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
