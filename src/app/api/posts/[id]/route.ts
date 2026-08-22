import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { content, mediaUrl, tags, userEmail } = (await req.json()) as any;

    if (!userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized: userEmail required" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    if (post.authorEmail !== userEmail) {
      return NextResponse.json({ success: false, error: "Forbidden: You can only edit your own posts" }, { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(content && { content }),
        ...(mediaUrl !== undefined && { mediaUrl }),
        ...(tags && { tags }),
      }
    });

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get("email");

    if (!userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized: userEmail required" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    if (post.authorEmail !== userEmail) {
      return NextResponse.json({ success: false, error: "Forbidden: You can only delete your own posts" }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
