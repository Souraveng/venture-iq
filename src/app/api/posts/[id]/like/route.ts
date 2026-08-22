import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as any;
    const userEmail = body.userEmail;

    if (!userEmail) {
      return NextResponse.json({ success: false, error: "User email required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const hasLiked = post.likedBy.includes(userEmail);
    const updatedLikedBy = hasLiked 
      ? post.likedBy.filter(email => email !== userEmail)
      : [...post.likedBy, userEmail];

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        likedBy: updatedLikedBy,
        likes: updatedLikedBy.length
      }
    });

    return NextResponse.json({ success: true, likes: updatedPost.likes, liked: !hasLiked });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to like post" }, { status: 500 });
  }
}
