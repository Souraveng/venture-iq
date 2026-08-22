import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all notifications for a specific user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Email parameter is required" }, { status: 400 });
    }

    // Fetch from database
    let notifications = await prisma.notification.findMany({
      where: { userEmail: email },
      orderBy: { timestamp: "desc" }
    });

    // Fallback: If no notifications exist for this email (e.g. first login, unseeded db), 
    // we can create some initial default notifications so the app is not empty.
    if (notifications.length === 0) {
      const defaultNotifs = [
        {
          userEmail: email,
          type: "CONNECTION_REQUEST",
          title: "Connection Request Received",
          message: "sarah@apexhorizon.com wants to connect with you on VentureIQ.",
          read: false,
          category: "connection",
          metadata: { connectionId: "conn-req-1", email: "sarah@apexhorizon.com", status: "PENDING" }
        },
        {
          userEmail: email,
          type: "CHAT_MOVEMENT",
          title: "Deal Room Unlocked",
          message: "Mutual Match! BioHelix Synthetics accepted your intro request. Chat is now active.",
          read: false,
          category: "chat",
          metadata: { startupId: "st-03", startupName: "BioHelix Synthetics", state: "MUTUAL_MATCH" }
        },
        {
          userEmail: email,
          type: "RECOMMENDATION",
          title: "New Venture Recommendation",
          message: "Recommendation Engine: NeuralFlux AI matches 90% of your investment thesis in DeepTech / AI.",
          read: false,
          category: "recommendation",
          metadata: { startupId: "st-01", startupName: "NeuralFlux AI", matchScore: 90 }
        }
      ];

      await prisma.notification.createMany({ data: defaultNotifs });
      
      notifications = await prisma.notification.findMany({
        where: { userEmail: email },
        orderBy: { timestamp: "desc" }
      });
    }

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
