import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({ select: { tags: true }, orderBy: { createdAt: "desc" }, take: 500 });
    const counts: Record<string, number> = {};
    for (const p of posts) { for (const tag of p.tags) { counts[tag] = (counts[tag] || 0) + 1; } }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));
    return NextResponse.json({ success: true, tags: sorted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
