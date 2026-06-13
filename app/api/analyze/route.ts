import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { graph } from "@/lib/graph/engine";
import { apiKeyStorage } from "@/lib/graph/llm";
import { activeAnalyzeRuns } from "@/lib/activeRuns";
import { getProject, saveProject } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const userApiKey = req.headers.get("x-gemini-api-key") || body.geminiApiKey || "";
  const projectId = body.projectId;

  if (projectId) {
    activeAnalyzeRuns.add(projectId);
    console.log(`[Analyze] Starting run for project ${projectId}. Active runs:`, Array.from(activeAnalyzeRuns));
  }
  
  const initialState = {
    mode: body.mode,
    userInput: body.data,
    userEmail: session.user!.email!,
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

  const cleanup = async () => {
    if (projectId) {
      activeAnalyzeRuns.delete(projectId);
      console.log(`[Analyze] Cleaning up run for project ${projectId}. Remaining active runs:`, Array.from(activeAnalyzeRuns));
      try {
        const project = await getProject(projectId);
        if (project && project.isAnalyzing) {
          project.isAnalyzing = false;
          await saveProject(project, session.user!.email!);
          console.log(`[Analyze] Database updated: isAnalyzing = false for project ${projectId}`);
        }
      } catch (dbErr) {
        console.error("Error updating project status in DB on cleanup:", dbErr);
      }
    }
  };

  req.signal.addEventListener("abort", () => {
    console.log(`[Analyze] Client connection aborted for project ${projectId}`);
    cleanup();
  });

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
                if (req.signal.aborted) {
                  console.log(`[Analyze] Stream execution stopped early for project ${projectId} due to client abort`);
                  break;
                }

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

              if (!req.signal.aborted) {
                // Stream final accumulated completion state
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ event: "complete", result: accumulatedState })}\n\n`)
                );
              }
            });
          } catch (e: any) {
            console.error("Streaming error inside graph.stream:", e);
            if (!req.signal.aborted) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ event: "error", error: e.message })}\n\n`)
              );
            }
          } finally {
            await cleanup();
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
      try {
        const result = await apiKeyStorage.run({ geminiApiKey: userApiKey }, () => graph.invoke(initialState));
        return NextResponse.json(result);
      } finally {
        await cleanup();
      }
    }
  } catch (error: any) {
    console.error("DEBUG ERROR:", error);
    await cleanup();
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
