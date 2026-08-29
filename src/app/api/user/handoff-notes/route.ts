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
 * GET /api/user/handoff-notes
 * Returns all active (OPEN) handoff notes assigned to the logged-in user.
 */
export async function GET(req: NextRequest) {
  try {
    const userEmail = await getAuthEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await prisma.handoffNote.findMany({
      where: {
        assignedTo: userEmail,
        status: "OPEN",
      },
      include: {
        startup: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, notes });
  } catch (err: any) {
    console.error("Error fetching user handoff notes:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/handoff-notes
 * Allows marking a handoff note status as ACKNOWLEDGED or RESOLVED.
 * Body: { noteId, status: "ACKNOWLEDGED" | "RESOLVED" }
 */
export async function PATCH(req: NextRequest) {
  try {
    const userEmail = await getAuthEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { noteId, status } = body as { noteId: string; status: string };

    if (!noteId || !status) {
      return NextResponse.json({ error: "noteId and status are required" }, { status: 400 });
    }

    if (status !== "ACKNOWLEDGED" && status !== "RESOLVED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const note = await prisma.handoffNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json({ error: "Handoff note not found" }, { status: 404 });
    }

    if (note.assignedTo && note.assignedTo !== userEmail && note.createdBy !== userEmail) {
      return NextResponse.json({ error: "Forbidden: You are not authorized to update this handoff note" }, { status: 403 });
    }

    const updated = await prisma.handoffNote.update({
      where: { id: noteId },
      data: { status },
    });

    return NextResponse.json({ success: true, note: updated });
  } catch (err: any) {
    console.error("Error updating handoff note:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/user/handoff-notes
 * Allows creating a handoff note for a startup and assigning to a teammate.
 * Body: { startupId, title, context, pendingActions, keyDecisions, assignedTo }
 */
export async function POST(req: NextRequest) {
  try {
    const userEmail = await getAuthEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as any;
    const { startupId, title, context, pendingActions, keyDecisions, assignedTo } = body;

    if (!startupId || !title || !context) {
      return NextResponse.json({ error: "startupId, title, and context are required" }, { status: 400 });
    }

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

    if (assignedTo && assignedTo !== userEmail) {
      try {
        await prisma.notification.create({
          data: {
            userEmail: assignedTo,
            type: "HANDOFF_NOTE",
            title: `New Handoff Note: ${title}`,
            message: `${userEmail} assigned a handoff note to you.`,
            category: "collaboration",
            metadata: { noteId: note.id, startupId },
          },
        });
      } catch (notifErr) {
        console.warn("Failed to create handoff notification:", notifErr);
      }
    }

    return NextResponse.json({ success: true, note });
  } catch (err: any) {
    console.error("Error creating handoff note:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
