import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/client";

// GET /api/chat/keys?userId=xyz
// Fetches the public key of a user to perform encryption
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");

  if (!userId && !email) {
    return NextResponse.json({ error: "Missing userId or email param" }, { status: 400 });
  }

  try {
    // Construct conditions array dynamically to avoid passing empty {} filter objects
    const orConditions: Prisma.UserPublicKeyWhereInput[] = [];
    if (userId) {
      orConditions.push({ userId });
    }
    if (email) {
      orConditions.push({ user: { email } });
    }

    const keyRecord = await prisma.userPublicKey.findFirst({
      where: {
        OR: orConditions,
      },
      select: {
        userId: true,
        publicKey: true,
      },
    });

    if (!keyRecord) {
      return NextResponse.json({ error: "Public key not found" }, { status: 404 });
    }

    return NextResponse.json(keyRecord);
  } catch (error) {
    console.error("Failed to fetch public key:", error);
    return NextResponse.json({ error: "Failed to fetch public key" }, { status: 500 });
  }
}

// POST /api/chat/keys
// Registers or updates the public key of the logged-in user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { publicKey } = (await req.json()) as any as { publicKey?: string };
    if (!publicKey) {
      return NextResponse.json({ error: "Missing publicKey payload" }, { status: 400 });
    }

    // Find the user record first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert key record
    const keyRecord = await prisma.userPublicKey.upsert({
      where: { userId: user.id },
      update: { publicKey },
      create: {
        userId: user.id,
        publicKey,
      },
    });

    return NextResponse.json({ success: true, keyId: keyRecord.id });
  } catch (error) {
    console.error("Failed to register public key:", error);
    return NextResponse.json({ error: "Failed to register public key" }, { status: 500 });
  }
}
