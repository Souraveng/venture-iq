import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET pending requests for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Missing email" }, { status: 400 });
    }

    const requests = await prisma.connectionRequest.findMany({
      where: {
        OR: [
          { receiverEmail: email },
          { senderEmail: email }
        ],
        status: { in: ["PENDING", "ACCEPTED"] }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create connection request
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { senderEmail, receiverEmail } = body;

    if (!senderEmail || !receiverEmail) {
      return NextResponse.json({ success: false, error: "Missing sender or receiver email" }, { status: 400 });
    }

    // Check if already requested
    const existing = await prisma.connectionRequest.findUnique({
      where: {
        senderEmail_receiverEmail: {
          senderEmail,
          receiverEmail
        }
      }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: "Connection already exists or pending." }, { status: 400 });
    }

    const connection = await prisma.connectionRequest.create({
      data: {
        senderEmail,
        receiverEmail,
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, connection });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT accept or reject connection
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { id, status } = body;

    if (!id || !["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
    }

    const connection = await prisma.connectionRequest.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, connection });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
// DELETE - remove/disconnect a connection
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const senderEmail = searchParams.get("senderEmail");
    const receiverEmail = searchParams.get("receiverEmail");

    if (id) {
      await prisma.connectionRequest.delete({ where: { id } });
    } else if (senderEmail && receiverEmail) {
      await prisma.connectionRequest.deleteMany({
        where: {
          OR: [
            { senderEmail, receiverEmail },
            { senderEmail: receiverEmail, receiverEmail: senderEmail }
          ]
        }
      });
    } else {
      return NextResponse.json({ success: false, error: "Provide id or senderEmail+receiverEmail" }, { status: 400 });
    }

    return NextResponse.json({ success: true, action: "disconnected" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
