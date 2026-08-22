import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as any;
    const { authorEmail, authorName, authorAvatar, content } = body;

    if (!authorEmail || !content) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        authorEmail,
        authorName: authorName || "Unknown",
        authorAvatar: authorAvatar || "",
        content
      }
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to add comment" }, { status: 500 });
  }
}
