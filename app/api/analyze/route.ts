// app/api/analyze/route.ts
import { NextResponse } from "next/server";
import { graph } from "@/lib/graph/engine";
import { apiKeyStorage } from "@/lib/graph/llm";

export async function POST(req: Request) {
  const body = await req.json();
  const userApiKey = req.headers.get("x-gemini-api-key") || body.geminiApiKey || "";
  
  const initialState = {
    mode: body.mode,
    userInput: body.data,
    researchPlan: [],
    marketIntel: {},
    competitorIntel: {},
    swotIntel: {},
    riskIntel: {},
    financialIntel: {},
    finalReport: {},
    roadmapIntel: {},
    decisionReport: {},
    reportIntel: {}
  };

  try {
    if (body.stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            await apiKeyStorage.run({ geminiApiKey: userApiKey }, async () => {
              const stream = await graph.stream(initialState, { streamMode: "updates" });
              const accumulatedState: Record<string, any> = { ...initialState };

              for await (const chunk of stream) {
                const nodeName = Object.keys(chunk)[0];
                const nodeData = (chunk as any)[nodeName];

                // Accumulate state updates (respecting researchPlan append reducer)
                for (const [key, val] of Object.entries(nodeData)) {
                  if (key === "researchPlan") {
                    accumulatedState.researchPlan = [
                      ...(accumulatedState.researchPlan || []),
                      ...(val as string[] || [])
                    ];
                  } else {
                    accumulatedState[key] = val;
                  }
                }

                // Stream the node completion event
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ event: "node_complete", node: nodeName, data: nodeData })}\n\n`)
                );
              }

              // Stream final accumulated completion state
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ event: "complete", result: accumulatedState })}\n\n`)
              );
            });
          } catch (e: any) {
            console.error("Streaming error inside graph.stream:", e);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ event: "error", error: e.message })}\n\n`)
            );
          } finally {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        }
      });

      return new NextResponse(customReadable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }
      });
    } else {
      // Synchronous fallback
      const result = await apiKeyStorage.run({ geminiApiKey: userApiKey }, () => graph.invoke(initialState));
      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error("DEBUG ERROR:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}