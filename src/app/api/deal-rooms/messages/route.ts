import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all messages for a specific chat room
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatRoomId = searchParams.get("chatRoomId");
    const userEmail = searchParams.get("email");

    if (!chatRoomId || !userEmail) {
      return NextResponse.json(
        { success: false, error: "chatRoomId and email are required for authorization." },
        { status: 400 }
      );
    }

    // Verify user is participant
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId }
    });

    if (!chatRoom) {
      return NextResponse.json({ success: false, error: "Chat room not found." }, { status: 404 });
    }

    // Since chatRoom has founderId and investorId, we need to verify userEmail belongs to one of them.
    // For robust security, we fetch the investor and founder to match the IDs
    const investor = await prisma.investor.findUnique({ where: { email: userEmail } });
    const startup = await prisma.startup.findFirst({ where: { founderProfile: { email: userEmail } } });
    const founder = await prisma.founder.findUnique({ where: { email: userEmail } });

    const isInvestor = (investor && chatRoom.investorId === investor.id) || chatRoom.investorId === userEmail;
    const isFounder = (founder && chatRoom.founderId === founder.id) || 
                      (startup && (chatRoom.founderId === startup.founderId || chatRoom.founderId === startup.id)) || 
                      chatRoom.founderId === userEmail;

    if (!isInvestor && !isFounder) {
      return NextResponse.json({ success: false, error: "Unauthorized to access this chat room." }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: chatRoomId,
      },
      orderBy: {
        createdAt: "asc", // Oldest first
      },
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages." },
      { status: 500 }
    );
  }
}

// POST a new message to a chat room
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { chatRoomId, senderId, messagePayload } = body;

    if (!chatRoomId || !senderId || !messagePayload) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Verify sender is participant
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId }
    });

    if (!chatRoom) {
      return NextResponse.json({ success: false, error: "Chat room not found." }, { status: 404 });
    }

    const investor = await prisma.investor.findUnique({ where: { email: senderId } });
    const startup = await prisma.startup.findFirst({ where: { founderProfile: { email: senderId } } });
    const founder = await prisma.founder.findUnique({ where: { email: senderId } });

    const isInvestor = (investor && chatRoom.investorId === investor.id) || chatRoom.investorId === senderId;
    const isFounder = (founder && chatRoom.founderId === founder.id) || 
                      (startup && (chatRoom.founderId === startup.founderId || chatRoom.founderId === startup.id)) || 
                      chatRoom.founderId === senderId;

    if (!isInvestor && !isFounder) {
      return NextResponse.json({ success: false, error: "Unauthorized: You are not a participant in this chat room." }, { status: 403 });
    }

    // Since we aren't doing real E2E encryption yet, we store the payload as JSON string
    const stringifiedPayload = typeof messagePayload === 'string' 
      ? messagePayload 
      : JSON.stringify(messagePayload);

    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId,
        senderId,
        encryptedPayload: stringifiedPayload,
        iv: "demo-iv-no-encrypt",
      },
    });

    // Check if the chat room has an initiatedBy. If not, set it.
    const room = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
    });

    if (room && !room.initiatedBy) {
      await prisma.chatRoom.update({
        where: { id: chatRoomId },
        data: { initiatedBy: senderId },
      });
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message." },
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

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { encryptedPayload }
    });

    return NextResponse.json({
      success: true,
      data: updatedMessage
    });
  } catch (error: any) {
    console.error("Failed to update message:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
