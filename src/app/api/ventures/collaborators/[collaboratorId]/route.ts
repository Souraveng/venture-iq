import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserVentureRole, isPrimaryFounder } from "@/lib/permissions";

/**
 * PATCH /api/ventures/collaborators/[collaboratorId]
 * Update a collaborator's role or status.
 * Body: { role?: string, status?: string }
 * Role update requires OWNER role on the venture.
 * Status update requires being the invitee (userEmail).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ collaboratorId: string }> }
) {
  try {
    const userEmail = req.headers.get("x-user-email");
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collaboratorId } = await params;
    const body = await req.json();
    const { role, status } = body as { role?: string; status?: string };

    // Find the collaborator
    // @ts-ignore - Prisma client out of sync
    const collaborator = await prisma.ventureCollaborator.findUnique({
      where: { id: collaboratorId },
    });
    if (!collaborator) {
      return NextResponse.json(
        { error: "Collaborator not found" },
        { status: 404 }
      );
    }

    // 1. Handle Status Update (Accept/Decline Invite)
    if (status) {
      if (collaborator.userEmail !== userEmail) {
        return NextResponse.json(
          { error: "Only the invited user can accept or decline this invitation" },
          { status: 403 }
        );
      }

      if (status !== "ACTIVE" && status !== "REVOKED") {
        return NextResponse.json(
          { error: "Invalid status. Must be ACTIVE or REVOKED" },
          { status: 400 }
        );
      }

      // @ts-ignore - Prisma client out of sync
      const updated = await prisma.ventureCollaborator.update({
        where: { id: collaboratorId },
        data: { status: status as any },
      });
      return NextResponse.json({ success: true, collaborator: updated });
    }

    // 2. Handle Role Update
    if (role) {
    const callerRole = await getUserVentureRole(
      userEmail,
      collaborator.startupId
    );
    if (callerRole !== "OWNER") {
      return NextResponse.json(
        { error: "Only venture owners can change roles" },
        { status: 403 }
      );
    }

    // Cannot change the primary founder's role
    const targetIsPrimaryFounder = await isPrimaryFounder(
      collaborator.userEmail,
      collaborator.startupId
    );
    if (targetIsPrimaryFounder) {
      return NextResponse.json(
        {
          error:
            "Cannot change the primary founder's role. They always have Owner access.",
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["OWNER", "EDITOR", "VIEWER"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be OWNER, EDITOR, or VIEWER" },
        { status: 400 }
      );
    }

    // @ts-ignore - Prisma client out of sync
    const updated = await prisma.ventureCollaborator.update({
      where: { id: collaboratorId },
      data: { role: role as any },
    });

    return NextResponse.json({ success: true, collaborator: updated });
    }

    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  } catch (err: any) {
    console.error("Error updating collaborator:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ventures/collaborators/[collaboratorId]
 * Remove a collaborator from a venture.
 * Requires OWNER role (or self-removal).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ collaboratorId: string }> }
) {
  try {
    const userEmail = req.headers.get("x-user-email");
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collaboratorId } = await params;

    // Find the collaborator
    // @ts-ignore - Prisma client out of sync
    const collaborator = await prisma.ventureCollaborator.findUnique({
      where: { id: collaboratorId },
    });
    if (!collaborator) {
      return NextResponse.json(
        { error: "Collaborator not found" },
        { status: 404 }
      );
    }

    // Cannot remove the primary founder
    const targetIsPrimaryFounder = await isPrimaryFounder(
      collaborator.userEmail,
      collaborator.startupId
    );
    if (targetIsPrimaryFounder) {
      return NextResponse.json(
        {
          error:
            "Cannot remove the primary founder from the venture. They always have access.",
        },
        { status: 400 }
      );
    }

    // Allow self-removal (leaving the venture)
    const isSelfRemoval = collaborator.userEmail === userEmail;

    if (!isSelfRemoval) {
      // Only OWNER can remove others
      const callerRole = await getUserVentureRole(
        userEmail,
        collaborator.startupId
      );
      if (callerRole !== "OWNER") {
        return NextResponse.json(
          { error: "Only venture owners can remove collaborators" },
          { status: 403 }
        );
      }
    }

    // @ts-ignore - Prisma client out of sync
    await prisma.ventureCollaborator.delete({
      where: { id: collaboratorId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error removing collaborator:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
