import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get("userEmail") || "";
    const now = new Date();

    const stories = await prisma.story.findMany({
      where: { expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });

    const byAuthor: Record<string, any> = {};
    for (const s of stories) {
      if (!byAuthor[s.authorEmail]) {
        byAuthor[s.authorEmail] = {
          authorEmail: s.authorEmail, authorName: s.authorName,
          authorAvatar: s.authorAvatar || "", authorRole: s.authorRole,
          hasNew: false, stories: [],
        };
      }
      byAuthor[s.authorEmail].stories.push(s);
      if (userEmail && !s.viewedBy.includes(userEmail)) byAuthor[s.authorEmail].hasNew = true;
    }

    return NextResponse.json({ success: true, stories: Object.values(byAuthor) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { authorEmail, authorName, authorAvatar, authorRole, mediaUrl, text } = body;
    if (!authorEmail || (!mediaUrl && !text)) return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const story = await prisma.story.create({
      data: { authorEmail, authorName: authorName || "User", authorAvatar: authorAvatar || null, authorRole: authorRole || "Founder", mediaUrl: mediaUrl || null, text: text || null, expiresAt },
    });
    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
