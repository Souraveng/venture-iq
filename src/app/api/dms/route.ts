import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user1 = searchParams.get("user1");
    const user2 = searchParams.get("user2");

    if (!user1 || !user2) {
      return NextResponse.json({ success: false, error: "Missing participants" }, { status: 400 });
    }

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderEmail: user1, receiverEmail: user2 },
          { senderEmail: user2, receiverEmail: user1 },
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error("Failed to fetch DMs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as any;
    const { senderEmail, receiverEmail, text } = data;

    if (!senderEmail || !receiverEmail || !text) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const newMessage = await prisma.directMessage.create({
      data: {
        senderEmail,
        receiverEmail,
        text
      }
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error("Failed to send DM:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
