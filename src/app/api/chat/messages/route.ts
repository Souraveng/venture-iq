import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/chat/messages?roomId=xyz
// Fetches the encrypted message history of a room
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId param" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user is a participant in this room
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || (room.founderId !== user.id && room.investorId !== user.id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Retrieve messages
    const messages = await prisma.chatMessage.findMany({
      where: { chatRoomId: roomId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/chat/messages
// Stores a new encrypted message sent by a user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatRoomId, encryptedPayload, iv } = (await req.json()) as any;

    if (!chatRoomId || !encryptedPayload || !iv) {
      return NextResponse.json({ error: "Missing required payload fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify participation
    const room = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
    });

    if (!room || (room.founderId !== user.id && room.investorId !== user.id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Save encrypted message and update room timestamp
    const [message] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          chatRoomId,
          senderId: user.id,
          encryptedPayload,
          iv,
        },
      }),
      prisma.chatRoom.update({
        where: { id: chatRoomId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json(message);
  } catch (error) {
    console.error("Failed to save message:", error);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}
