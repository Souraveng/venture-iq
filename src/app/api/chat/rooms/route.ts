import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/chat/rooms
// Returns all chat rooms for the logged-in user
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch rooms where user is either founder or investor
    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { founderId: user.id },
          { investorId: user.id },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });

    // Populate participant information dynamically
    const populatedRooms = await Promise.all(
      rooms.map(async (room) => {
        const otherParticipantId = room.founderId === user.id ? room.investorId : room.founderId;
        const otherUser = await prisma.user.findUnique({
          where: { id: otherParticipantId },
          select: { id: true, name: true, email: true, image: true, role: true },
        });

        return {
          ...room,
          participant: otherUser,
        };
      })
    );

    return NextResponse.json(populatedRooms);
  } catch (error) {
    console.error("Failed to fetch chat rooms:", error);
    return NextResponse.json({ error: "Failed to fetch chat rooms" }, { status: 500 });
  }
}

// POST /api/chat/rooms
// Creates a new chat room between the logged-in user and target user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { targetUserId } = (await req.json()) as any;
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine roles (who is founder and who is investor)
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const founderId = user.role === "founder" ? user.id : targetUser.id;
    const investorId = user.role === "investor" ? user.id : targetUser.id;

    // Create or find existing room
    const room = await prisma.chatRoom.upsert({
      where: {
        founderId_investorId: {
          founderId,
          investorId,
        },
      },
      update: {},
      create: {
        founderId,
        investorId,
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Failed to create chat room:", error);
    return NextResponse.json({ error: "Failed to create chat room" }, { status: 500 });
  }
}
