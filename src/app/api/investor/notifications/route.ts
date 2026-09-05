import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all notifications for a specific user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    const portal = searchParams.get("portal");

    if (!email) {
      return NextResponse.json({ success: false, error: "Email parameter is required" }, { status: 400 });
    }

    let whereClause: any = { userEmail: email };

    if (portal === "founder") {
      whereClause.type = { notIn: ["TEAM_INVITE"] };
    } else if (portal === "investor") {
      whereClause.type = { notIn: ["COLLABORATION_ACCEPTED", "COLLABORATION_INVITE"] };
    }

    // Fetch from database — return real data only, no fake seeds
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" }
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT update notification status (e.g., mark as read, accept/reject metadata)
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { id, read, markAll, email, metadata } = body;

    if (markAll) {
      if (!email) {
        return NextResponse.json({ success: false, error: "Email is required to mark all as read" }, { status: 400 });
      }
      await prisma.notification.updateMany({
        where: { userEmail: email },
        data: { read: true }
      });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Notification ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (read !== undefined) updateData.read = read;
    if (metadata !== undefined) updateData.metadata = metadata;

    const updated = await prisma.notification.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error: any) {
    console.error("Notifications PUT error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE a notification
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Notification ID is required" }, { status: 400 });
    }

    await prisma.notification.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Notifications DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

