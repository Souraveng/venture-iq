import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { messageId, action, email, reaction } = body;

    if (!messageId || !action) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    if (action === "react") {
      if (!email || !reaction) return NextResponse.json({ success: false, error: "Missing email/reaction" }, { status: 400 });
      const currentReactions = (message.reactions as Record<string, string[]>) || {};
      const users = currentReactions[reaction] || [];
      
      if (users.includes(email)) {
        currentReactions[reaction] = users.filter(u => u !== email);
        if (currentReactions[reaction].length === 0) delete currentReactions[reaction];
      } else {
        // Remove from other reactions first (one reaction per user per message)
        for (const key of Object.keys(currentReactions)) {
          currentReactions[key] = currentReactions[key].filter(u => u !== email);
          if (currentReactions[key].length === 0) delete currentReactions[key];
        }
        currentReactions[reaction] = [...(currentReactions[reaction] || []), email];
      }
      
      const updated = await prisma.chatMessage.update({
        where: { id: messageId },
        data: { reactions: currentReactions }
      });
      return NextResponse.json({ success: true, data: updated });
    }
    
    if (action === "read") {
      const updated = await prisma.chatMessage.update({
        where: { id: messageId },
        data: { readAt: new Date() }
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "pin") {
      const updated = await prisma.chatMessage.update({
        where: { id: messageId },
        data: { isPinned: !message.isPinned }
      });
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
