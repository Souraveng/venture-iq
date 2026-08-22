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
    const founderName = startup?.founderProfile?.fullName || startup?.founder || "Primary Founder";

    // Format collaborators excluding the primary founder to avoid duplicates in UI
    const result = collaborators
      .filter((c: any) => c.userEmail?.toLowerCase() !== founderEmail?.toLowerCase())
      .map((c: any) => ({
        id: c.id,
        email: c.userEmail,
        userEmail: c.userEmail,
        role: c.role,
        status: c.status,
        invitedBy: c.invitedBy,
        createdAt: c.createdAt,
        isPrimaryFounder: false,
      }));

    return NextResponse.json({
      success: true,
      collaborators: result,
      primaryFounderEmail: founderEmail,
      primaryFounderName: founderName,
      primaryFounderAvatar: startup?.founderProfile?.avatarUrl || null,
      callerRole,
      currentUserRole: callerRole,
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
      emails?: string[] | string;
      role?: string;
    };
    const { startupId, role } = body;

    if (!startupId) {
      return NextResponse.json(
        { error: "startupId is required" },
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

    // Parse list of emails
    let rawEmails: string[] = [];
    if (Array.isArray(body.emails)) {
      rawEmails = body.emails;
    } else if (Array.isArray(body.email)) {
      rawEmails = body.email;
    } else if (typeof body.email === "string") {
      rawEmails = body.email.split(/[,;\s\n]+/);
    } else if (typeof body.emails === "string") {
      rawEmails = body.emails.split(/[,;\s\n]+/);
    }

    const emailList = Array.from(
      new Set(
        rawEmails
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.length > 0 && e.includes("@"))
      )
    );

    if (emailList.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide at least one valid email address." },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["OWNER", "EDITOR", "VIEWER"];
    const assignRole = role && validRoles.includes(role) ? role : "VIEWER";

    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      select: { name: true }
    });

    const results: any[] = [];

    for (const email of emailList) {
      try {
        // Check if invitee is the primary founder
        const isFounder = await isPrimaryFounder(email, startupId);
        if (isFounder) {
          results.push({
            email,
            status: "is_primary_founder",
            message: `${email} is the primary founder and already has full access.`
          });
          continue;
        }

        // Check if already a collaborator
        const existing = await prisma.ventureCollaborator.findFirst({
          where: {
            startupId,
            userEmail: { equals: email, mode: "insensitive" }
          },
        });

        if (existing) {
          if (existing.status === "ACTIVE") {
            results.push({ email, status: "already_active", message: `${email} is already an active collaborator.` });
            continue;
          }

          // Reset status to PENDING and update role
          const updated = await prisma.ventureCollaborator.update({
            where: { id: existing.id },
            data: {
              role: assignRole as any,
              status: "PENDING",
              invitedBy: userEmail,
            }
          });

          // Send notification
          try {
            await prisma.notification.create({
              data: {
                userEmail: email,
                type: "COLLABORATION_INVITE",
                title: "Venture Team Invite",
                message: `${userEmail} invited you as ${assignRole} to "${startup?.name || 'venture'}".`,
                category: "collaboration",
                metadata: {
                  startupId,
                  role: assignRole,
                  invitedBy: userEmail,
                },
              },
            });
          } catch (notifErr) {
            console.error("Failed to create invite notification:", notifErr);
          }

          results.push({ email, status: "re_invited", collaborator: updated });
          continue;
        }

        const collaborator = await prisma.ventureCollaborator.create({
          data: {
            startupId,
            userEmail: email,
            role: assignRole as any,
            invitedBy: userEmail,
            status: "PENDING",
          },
        });

        // Create notification
        try {
          await prisma.notification.create({
            data: {
              userEmail: email,
              type: "COLLABORATION_INVITE",
              title: "You've been added to a venture team",
              message: `${userEmail} added you as ${assignRole} to "${startup?.name || 'venture'}".`,
              category: "collaboration",
              metadata: {
                startupId,
                role: assignRole,
                invitedBy: userEmail,
              },
            },
          });
        } catch (notifErr) {
          console.error("Failed to create invite notification:", notifErr);
        }

        results.push({ email, status: "invited", collaborator });
      } catch (itemErr: any) {
        results.push({ email, status: "error", error: itemErr.message });
      }
    }

    const hasSuccess = results.some((r) => r.status === "invited" || r.status === "re_invited" || r.status === "already_active");

    return NextResponse.json({
      success: hasSuccess,
      message: `Processed ${results.length} invitation(s).`,
      results,
      collaborator: results.find((r) => r.collaborator)?.collaborator || null,
    });
  } catch (err: any) {
    console.error("Error inviting collaborator:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
