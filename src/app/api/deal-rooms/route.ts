import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { founderId, investorId } = body;

    if (!founderId || !investorId) {
      return NextResponse.json(
        { success: false, error: "founderId and investorId are required." },
        { status: 400 }
      );
    }

    // Try to find an existing room
    let chatRoom = await prisma.chatRoom.findUnique({
      where: {
        founderId_investorId: {
          founderId,
          investorId,
        },
      },
    });

    // If it doesn't exist, create it
    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          founderId,
          investorId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: chatRoom,
    });
  } catch (error) {
    console.error("Failed to get/create chat room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize deal room." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { chatRoomId, action } = body;

    if (!chatRoomId || !action) {
      return NextResponse.json(
        { success: false, error: "chatRoomId and action are required." },
        { status: 400 }
      );
    }

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json(
        { success: false, error: "Invalid action." },
        { status: 400 }
      );
    }

    const updatedRoom = await prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        status: action === "accept" ? "ACCEPTED" : "REJECTED",
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRoom,
    });
  } catch (error) {
    console.error("Failed to update chat room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update chat room." },
      { status: 500 }
    );
  }
}
