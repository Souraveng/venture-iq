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

    const fNorm = founderId.trim();
    const iNorm = investorId.trim();

    // Collect all alias identifiers for founderId & investorId
    const founderAliases = new Set<string>([fNorm, fNorm.toLowerCase()]);
    const investorAliases = new Set<string>([iNorm, iNorm.toLowerCase()]);

    // Check if founderId is a startup ID or startup Name
    const startup = await prisma.startup.findFirst({
      where: {
        OR: [
          { id: fNorm },
          { name: { equals: fNorm, mode: "insensitive" } },
          { id: iNorm },
          { name: { equals: iNorm, mode: "insensitive" } },
        ],
      },
      include: { founderProfile: true },
    });

    if (startup) {
      founderAliases.add(startup.id);
      founderAliases.add(startup.name);
      if (startup.founderProfile?.email) {
        founderAliases.add(startup.founderProfile.email.toLowerCase());
      }
      if (startup.founder) {
        founderAliases.add(startup.founder);
      }
    }

    // Check if investor is an Investor model or User model
    const investor = await prisma.investor.findFirst({
      where: {
        OR: [
          { email: { in: Array.from(investorAliases), mode: "insensitive" } },
          { name: { in: Array.from(investorAliases), mode: "insensitive" } },
          { id: { in: Array.from(investorAliases) } },
        ],
      },
    });

    if (investor) {
      investorAliases.add(investor.id);
      investorAliases.add(investor.email.toLowerCase());
      investorAliases.add(investor.name);
    }

    const fArray = Array.from(founderAliases);
    const iArray = Array.from(investorAliases);

    // Try to find an existing room matching any combination of aliases
    let chatRoom = await prisma.chatRoom.findFirst({
      where: {
        OR: [
          { founderId: { in: fArray }, investorId: { in: iArray } },
          { founderId: { in: iArray }, investorId: { in: fArray } },
        ],
      },
    });

    // If it doesn't exist, create it using canonical IDs
    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          founderId: startup ? startup.id : fNorm,
          investorId: investor ? investor.email.toLowerCase() : iNorm,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: chatRoom,
    });
  } catch (error: any) {
    console.error("Failed to get/create chat room:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize deal room." },
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
