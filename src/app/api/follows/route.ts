import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) return NextResponse.json({ success: false, error: "Missing email" }, { status: 400 });

    const following = await prisma.follow.findMany({ where: { followerEmail: email }, select: { followingEmail: true } });
    const followingEmails = following.map((f: any) => f.followingEmail);

    const recentPostAuthors = await prisma.post.findMany({
      where: { authorEmail: { notIn: [...followingEmails, email] } },
      select: { authorEmail: true, authorName: true, authorRole: true, authorAvatar: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const seen = new Set<string>();
    const suggestions = recentPostAuthors.filter((p: any) => {
      if (seen.has(p.authorEmail)) return false;
      seen.add(p.authorEmail);
      return true;
    }).slice(0, 5);

    return NextResponse.json({ success: true, following: followingEmails, suggestions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { followerEmail, followingEmail } = body;
    if (!followerEmail || !followingEmail) return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

    const existing = await prisma.follow.findUnique({ where: { followerEmail_followingEmail: { followerEmail, followingEmail } } });
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, action: "unfollowed" });
    }
    const follow = await prisma.follow.create({ data: { followerEmail, followingEmail } });
    return NextResponse.json({ success: true, action: "followed", follow });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
