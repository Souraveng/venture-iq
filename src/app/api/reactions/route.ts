import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_REACTIONS = ["fire", "insight", "vibe", "launch", "love"];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const userEmail = searchParams.get("userEmail");
    if (!postId) return NextResponse.json({ success: false, error: "Missing postId" }, { status: 400 });

    const all = await prisma.postReaction.findMany({ where: { postId } });
    const counts: Record<string, number> = {};
    for (const r of all) counts[r.reaction] = (counts[r.reaction] || 0) + 1;
    const myReaction = userEmail ? (all.find((r: any) => r.userEmail === userEmail)?.reaction || null) : null;

    return NextResponse.json({ success: true, counts, myReaction });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { postId, userEmail, reaction } = body;
    if (!postId || !userEmail || !reaction) return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    if (!VALID_REACTIONS.includes(reaction)) return NextResponse.json({ success: false, error: "Invalid reaction" }, { status: 400 });

    const existing = await prisma.postReaction.findUnique({ where: { postId_userEmail: { postId, userEmail } } });
    if (existing) {
      if (existing.reaction === reaction) {
        await prisma.postReaction.delete({ where: { id: existing.id } });
        return NextResponse.json({ success: true, action: "removed" });
      }
      await prisma.postReaction.update({ where: { id: existing.id }, data: { reaction } });
      return NextResponse.json({ success: true, action: "changed", reaction });
    }
    await prisma.postReaction.create({ data: { postId, userEmail, reaction } });
    return NextResponse.json({ success: true, action: "added", reaction });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
