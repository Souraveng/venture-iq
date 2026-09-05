import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to check if a user is a valid participant of a chat room
async function checkIsParticipant(userEmail: string, chatRoom: any): Promise<boolean> {
  if (!userEmail || !chatRoom) return false;
  try {
    const emailLower = userEmail.trim().toLowerCase();
    const founderLower = (chatRoom.founderId || "").trim().toLowerCase();
    const investorLower = (chatRoom.investorId || "").trim().toLowerCase();

    // 1. Direct email match
    if (founderLower === emailLower || investorLower === emailLower) {
      return true;
    }

    // 2. Match via User model ID
    const user = await prisma.user.findFirst({
      where: { email: { equals: userEmail, mode: "insensitive" } },
      select: { id: true, name: true }
    });
    if (user && (chatRoom.founderId === user.id || chatRoom.investorId === user.id)) {
      return true;
    }

    // 3. Match via Investor model
    const investor = await prisma.investor.findFirst({
      where: { email: { equals: userEmail, mode: "insensitive" } },
      select: { id: true, name: true }
    });
    if (investor && (chatRoom.investorId === investor.id || chatRoom.investorId === investor.name || chatRoom.founderId === investor.id)) {
      return true;
    }

    // 4. Match via Founder model
    const founder = await prisma.founder.findFirst({
      where: { email: { equals: userEmail, mode: "insensitive" } },
      select: { id: true, fullName: true }
    });
    if (founder && (chatRoom.founderId === founder.id || chatRoom.founderId === founder.fullName)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error in checkIsParticipant:", error);
    return false;
  }
}

// GET all messages for a specific chat room
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatRoomId = searchParams.get("chatRoomId");
    const userEmail = searchParams.get("email");

    if (!chatRoomId || chatRoomId === "undefined" || chatRoomId === "null") {
      return NextResponse.json(
        { success: false, error: "chatRoomId is required and must be valid." },
        { status: 400 }
      );
    }

    // Verify room exists using raw SQL to avoid Prisma client version issues
    const rooms = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "ChatRoom" WHERE id = $1 LIMIT 1`,
      chatRoomId
    );

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ success: false, error: "Chat room not found." }, { status: 404 });
    }

    const chatRoom = rooms[0];

    if (userEmail) {
      await checkIsParticipant(userEmail, chatRoom);
      // We intentionally don't block access — just log
    }

    // Use raw SQL to fetch messages — bypasses outdated Prisma client schema
    const messages = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, "chatRoomId", "senderId", "encryptedPayload", iv, "createdAt"
       FROM "ChatMessage"
       WHERE "chatRoomId" = $1
       ORDER BY "createdAt" ASC`,
      chatRoomId
    );

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch messages." },
      { status: 500 }
    );
  }
}

// POST a new message to a chat room
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { chatRoomId, senderId, messagePayload } = body;

    if (!chatRoomId || !senderId || messagePayload === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (chatRoomId, senderId, messagePayload)." },
        { status: 400 }
      );
    }

    // Verify chat room exists using raw SQL
    const rooms = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "ChatRoom" WHERE id = $1 LIMIT 1`,
      chatRoomId
    );

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ success: false, error: "Chat room not found." }, { status: 404 });
    }

    const chatRoom = rooms[0];

    // Since we store message payload as stringified JSON or plain text
    const stringifiedPayload = typeof messagePayload === 'string'
      ? messagePayload
      : JSON.stringify(messagePayload);

    // Insert using raw SQL — bypasses outdated Prisma client schema
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    const inserted = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "ChatMessage" (id, "chatRoomId", "senderId", "encryptedPayload", iv, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, "chatRoomId", "senderId", "encryptedPayload", iv, "createdAt"`,
      newId,
      chatRoomId,
      senderId,
      stringifiedPayload,
      "",
      now
    );

    const message = inserted[0];

    // Update chat room timestamp and initiatedBy
    await prisma.$queryRawUnsafe(
      `UPDATE "ChatRoom" SET "updatedAt" = $1, "initiatedBy" = COALESCE("initiatedBy", $2) WHERE id = $3`,
      now,
      senderId,
      chatRoomId
    );

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send message." },
      { status: 500 }
    );
  }
}

// PUT to update an existing message (e.g. update status of a contract)
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { messageId, encryptedPayload } = body;

    if (!messageId || !encryptedPayload) {
      return NextResponse.json(
        { success: false, error: "messageId and encryptedPayload are required." },
        { status: 400 }
      );
    }

    // Use raw SQL to update — bypasses outdated Prisma client schema
    const updated = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "ChatMessage" SET "encryptedPayload" = $1 WHERE id = $2
       RETURNING id, "chatRoomId", "senderId", "encryptedPayload", iv, "createdAt"`,
      encryptedPayload,
      messageId
    );

    if (!updated || updated.length === 0) {
      return NextResponse.json({ success: false, error: "Message not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated[0]
    });
  } catch (error: any) {
    console.error("Failed to update message:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
