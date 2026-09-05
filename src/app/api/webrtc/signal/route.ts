import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { chatRoomId, senderEmail, receiverEmail, type, payload } = body;

    if (!chatRoomId || !senderEmail || !receiverEmail || !type || !payload) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const signal = await prisma.webRTCSignal.create({
      data: {
        chatRoomId,
        senderEmail,
        receiverEmail,
        type,
        payload,
      }
    });

    return NextResponse.json({ success: true, signal });
  } catch (error: any) {
    console.error("[WebRTC Signal POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// SSE Endpoint for receiving signals
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatRoomId = searchParams.get("room");
  const receiverEmail = searchParams.get("email");

  if (!chatRoomId || !receiverEmail) {
    return NextResponse.json({ success: false, error: "room and email are required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // 1. Send any unprocessed signals (from the last 60 seconds to avoid stale signals)
      const oneMinuteAgo = new Date(Date.now() - 60000);
      try {
        const missedSignals = await prisma.webRTCSignal.findMany({
          where: {
            chatRoomId,
            receiverEmail,
            createdAt: { gte: oneMinuteAgo }
          },
          orderBy: { createdAt: "asc" }
        });

        for (const signal of missedSignals) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(signal)}\n\n`));
        }

        let lastCheckTime = new Date();

        // 2. Poll for new signals every 1 second
        const intervalId = setInterval(async () => {
          try {
            const newSignals = await prisma.webRTCSignal.findMany({
              where: {
                chatRoomId,
                receiverEmail,
                createdAt: { gt: lastCheckTime }
              },
              orderBy: { createdAt: "asc" }
            });

            if (newSignals.length > 0) {
              lastCheckTime = newSignals[newSignals.length - 1].createdAt;
              for (const signal of newSignals) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(signal)}\n\n`));
              }
            }
          } catch (err) {
            console.error("[WebRTC SSE Polling Error]", err);
          }
        }, 1000);

        // Keep connection alive with heartbeat
        const heartbeatId = setInterval(() => {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        }, 15000);

        // Cleanup on disconnect
        req.signal.addEventListener("abort", () => {
          clearInterval(intervalId);
          clearInterval(heartbeatId);
          controller.close();
        });
      } catch (err) {
        console.error("[WebRTC SSE setup error]", err);
        controller.error(err);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    }
  });
}
