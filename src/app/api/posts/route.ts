import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const posts = await prisma.post.findMany({
      include: { comments: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { authorEmail, authorName, authorRole, authorAvatar, content, mediaUrl, tags } = body;

    if (!authorEmail || !content) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        authorEmail,
        authorName: authorName || "Unknown",
        authorRole: authorRole || "User",
        authorAvatar: authorAvatar || "",
        content,
        mediaUrl,
        tags: tags || [],
      }
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { id, content, tags } = body;

    if (!id || !content) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        content,
        tags: tags || [],
      }
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
