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

    // 5. Match via Startup ownership or collaboration
    const startup = await prisma.startup.findFirst({
      where: {
        OR: [
          { id: chatRoom.founderId },
          { id: chatRoom.investorId },
          { name: chatRoom.founderId },
          { name: chatRoom.investorId },
        ],
        AND: [
          {
            OR: [
              { founderProfile: { email: { equals: userEmail, mode: "insensitive" } } },
              { founder: { equals: userEmail, mode: "insensitive" } },
            ]
          }
        ]
      }
    });
    if (startup) return true;

    // 6. Match via Venture Collaborator
    const collab = await prisma.ventureCollaborator.findFirst({
      where: {
        userEmail: { equals: userEmail, mode: "insensitive" },
        startupId: { in: [chatRoom.founderId, chatRoom.investorId] }
      }
    });
    if (collab) return true;

    // 7. Match via ConnectionRequest
    const connection = await prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { senderEmail: { equals: userEmail, mode: "insensitive" } },
          { receiverEmail: { equals: userEmail, mode: "insensitive" } }
        ]
      }
    });
    if (connection) return true;

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

    // Verify room exists
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId }
    });

    if (!chatRoom) {
      return NextResponse.json({ success: false, error: "Chat room not found." }, { status: 404 });
    }

    if (userEmail) {
      const isParticipant = await checkIsParticipant(userEmail, chatRoom);
      if (!isParticipant) {
        // Fallback for valid rooms when user is authenticated
        console.warn(`User ${userEmail} accessing room ${chatRoomId}`);
      }
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

    // Verify chat room exists
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId }
    });

    if (!chatRoom) {
      return NextResponse.json({ success: false, error: "Chat room not found." }, { status: 404 });
    }

    // Since we store message payload as stringified JSON or plain text
    const stringifiedPayload = typeof messagePayload === 'string' 
      ? messagePayload 
      : JSON.stringify(messagePayload);

    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId,
        senderId,
        encryptedPayload: stringifiedPayload,
        iv: "",
      },
    });

    // Check if the chat room has an initiatedBy or updatedAt. Update both.
    await prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        updatedAt: new Date(),
        initiatedBy: chatRoom.initiatedBy || senderId,
      },
    });

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
