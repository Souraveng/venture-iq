import { NextResponse } from "next/server";
import { invokeValidationPipeline } from "@/lib/founder-intelligence/orchestrator";

// Force Next.js to stream the response dynamically
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idea = searchParams.get("idea");
  const userEmail = searchParams.get("userEmail") || undefined;

  if (!idea) {
    return new NextResponse("Missing 'idea' parameter", { status: 400 });
  }

  // Create a TransformStream to handle SSE formatting
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Start a heartbeat timer to prevent HTTP timeouts on proxies
  const heartbeatTimer = setInterval(async () => {
    try {
      await writer.write(encoder.encode(":\n\n")); // SSE comment heartbeat
    } catch (e) {
      clearInterval(heartbeatTimer);
    }
  }, 10000);

  // Helper to push SSE messages
  const sendEvent = async (event: string, data: any) => {
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(payload));
    } catch (e) {
      console.error("Error writing to stream:", e);
    }
  };

  // Start the pipeline execution asynchronously
  (async () => {
    try {
      // Announce stream start
      await sendEvent("pipeline_started", { timestamp: Date.now() });

      // Run the pipeline and pass a callback to receive real-time node events
      const { state, trace } = await invokeValidationPipeline(
        { idea, userEmail },
        {
          signal: req.signal,
          onNodeEvent: async (nodeEvent) => {
            await sendEvent("node_event", {
              ...nodeEvent,
              nodeId: nodeEvent.nodeId || nodeEvent.node,
            });
          }
        }
      );

      const pipeline = state.pipeline || {};
      const scorecard = pipeline.scorecard;
      const financialCalc = pipeline.financialAnalysis?.calculations;
      const report = pipeline.report;
      
      const dashboardTabs = report?.dashboardTabs || {};
      const reportsArray = Object.values(dashboardTabs);
      
      const { prisma } = await import("@/lib/prisma");

      const validation = await prisma.validation.create({
        data: {
          idea,
          marketViability: Math.round(pipeline.marketAnalysis?.marketScore || 70),
          technicalFeasibility: Math.round(pipeline.riskAnalysis?.riskScore || 65),
          financialPlanning: financialCalc ? `${financialCalc.runwayMonths} Months` : "20 Months",
          overallGrade: scorecard?.grade || "B",
          userEmail: userEmail || null,
          reports: reportsArray as any,
        },
      });
      
      await sendEvent("pipeline_completed", { 
        success: true, 
        traceStatus: trace.status,
        data: validation
      });

    } catch (error: any) {
      console.error("Pipeline streaming error:", error);
      await sendEvent("pipeline_error", { error: error.message || "Unknown error occurred" });
    } finally {
      clearInterval(heartbeatTimer);
      try {
        await writer.close();
      } catch (e) {
        // Ignore errors if the stream was already closed or aborted by the client
      }
    }
  })();

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
}
