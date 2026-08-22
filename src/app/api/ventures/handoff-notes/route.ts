import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserVentureRole } from "@/lib/permissions";

async function getAuthEmail(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) return session.user.email;
  return req.headers.get("x-user-email");
}

/**
 * GET /api/ventures/handoff-notes?startupId=xxx
 * List all handoff notes for a venture.
 */
export async function GET(req: NextRequest) {
  try {
    const userEmail = await getAuthEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get("startupId");

    if (!startupId) {
      return NextResponse.json(
        { error: "startupId is required" },
        { status: 400 }
      );
    }

    // Verify access
    const callerRole = await getUserVentureRole(userEmail, startupId);
    if (!callerRole) {
      return NextResponse.json(
        { error: "You do not have access to this venture" },
        { status: 403 }
      );
    }

    // Fetch all notes for the venture
    const notes = await prisma.handoffNote.findMany({
      where: { startupId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, notes });
  } catch (err: any) {
    console.error("Error fetching handoff notes:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ventures/handoff-notes
 * Create a handoff note (manual).
 * Body: { startupId, title, context, pendingActions?, keyDecisions?, assignedTo? }
 * Requires OWNER or EDITOR role.
 */
export async function POST(req: NextRequest) {
  try {
    const userEmail = await getAuthEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { startupId, title, context, pendingActions, keyDecisions, assignedTo } =
      body as {
        startupId: string;
        title: string;
        context: string;
        pendingActions?: string;
        keyDecisions?: string;
        assignedTo?: string;
      };

    if (!startupId || !title || !context) {
      return NextResponse.json(
        { error: "startupId, title, and context are required" },
        { status: 400 }
      );
    }

    // Check permission (OWNER or EDITOR can create)
    const callerRole = await getUserVentureRole(userEmail, startupId);
    if (!callerRole || callerRole === "VIEWER") {
      return NextResponse.json(
        { error: "You do not have permission to create handoff notes" },
        { status: 403 }
      );
    }

    // Create the handoff note
    const note = await prisma.handoffNote.create({
      data: {
        startupId,
        createdBy: userEmail,
        assignedTo: assignedTo || null,
        title,
        context,
        pendingActions: pendingActions || null,
        keyDecisions: keyDecisions || null,
        status: "OPEN",
      },
    });

    // If assigned to someone, create a notification
    if (assignedTo) {
      try {
        await prisma.notification.create({
          data: {
            userEmail: assignedTo,
            type: "HANDOFF_NOTE",
            title: "New handoff note assigned to you",
            message: `${userEmail} assigned you a handoff note: "${title}"`,
            category: "collaboration",
            metadata: {
              startupId,
              handoffNoteId: note.id,
              createdBy: userEmail,
            },
          },
        });
      } catch (notifErr) {
        console.error("Failed to create handoff notification:", notifErr);
      }
    }

    return NextResponse.json({ success: true, note });
  } catch (err: any) {
    console.error("Error creating handoff note:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
