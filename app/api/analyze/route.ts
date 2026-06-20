import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { graph } from "@/lib/graph/engine";
import { apiKeyStorage } from "@/lib/graph/llm";
import { activeAnalyzeRuns } from "@/lib/activeRuns";
import { getProject, saveProject, getUser } from "@/lib/db";

// Maximum time (ms) to allow the full agent pipeline to run.
// Override via PIPELINE_TIMEOUT_MS env variable. Default: 10 minutes.
const PIPELINE_TIMEOUT_MS = parseInt(process.env.PIPELINE_TIMEOUT_MS || "600000");

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
  const userCfToken = req.headers.get("x-cloudflare-api-token") || body.cloudflareApiToken || "";
  const userCfAccount = req.headers.get("x-cloudflare-account-id") || body.cloudflareAccountId || "";
  const userCfToken1 = req.headers.get("x-cloudflare-api-token-1") || body.cloudflareApiToken1 || "";
  const userCfAccount1 = req.headers.get("x-cloudflare-account-id-1") || body.cloudflareAccountId1 || "";
  const userCfToken2 = req.headers.get("x-cloudflare-api-token-2") || body.cloudflareApiToken2 || "";
  const userCfAccount2 = req.headers.get("x-cloudflare-account-id-2") || body.cloudflareAccountId2 || "";
  const userCfToken3 = req.headers.get("x-cloudflare-api-token-3") || body.cloudflareApiToken3 || "";
  const userCfAccount3 = req.headers.get("x-cloudflare-account-id-3") || body.cloudflareAccountId3 || "";
  const userCfToken4 = req.headers.get("x-cloudflare-api-token-4") || body.cloudflareApiToken4 || "";
  const userCfAccount4 = req.headers.get("x-cloudflare-account-id-4") || body.cloudflareAccountId4 || "";
  
  // Look up user tier from database (defaults to 'free')
  let userTier: "free" | "premium" = "free";
  try {
    const dbUser = await getUser(session.user.email!);
    if (dbUser?.tier === "premium") {
      userTier = "premium";
    }
  } catch (e) {
    console.warn("[Analyze] Could not fetch user tier, defaulting to free:", e);
  }
  console.log(`[Analyze] User tier: ${userTier}`);

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
    reportIntel: {},
    // Supervisor pattern fields
    nextAgent: "",
    supervisorCycleCount: 0,
    completedAgents: [],
    userTier,
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

  // BUG-13 FIX: Guard against cleanup() being called twice (abort listener + finally block).
  let cleanedUp = false;
  const safeCleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    await cleanup();
  };

  req.signal.addEventListener("abort", () => {
    console.log(`[Analyze] Client connection aborted for project ${projectId}`);
    safeCleanup();
  });

  try {
    if (body.stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          // BUG-2 FIX: enforce a hard timeout on the streaming pipeline.
          // Without this, a stalled LLM provider could keep the connection open indefinitely.
          let timeoutId: ReturnType<typeof setTimeout> | null = setTimeout(async () => {
            console.error(`[Analyze] Pipeline timeout after ${PIPELINE_TIMEOUT_MS}ms for project ${projectId}. Force-closing stream.`);
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ event: "error", error: `Pipeline timeout after ${PIPELINE_TIMEOUT_MS / 1000}s` })}\n\n`)
              );
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (_) {}
            await safeCleanup();
          }, PIPELINE_TIMEOUT_MS);

          const clearPipelineTimeout = () => {
            if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
          };

          try {
            await apiKeyStorage.run({ 
              geminiApiKey: userApiKey,
              cloudflareApiToken: userCfToken,
              cloudflareAccountId: userCfAccount,
              cloudflareApiToken1: userCfToken1,
              cloudflareAccountId1: userCfAccount1,
              cloudflareApiToken2: userCfToken2,
              cloudflareAccountId2: userCfAccount2,
              cloudflareApiToken3: userCfToken3,
              cloudflareAccountId3: userCfAccount3,
              cloudflareApiToken4: userCfToken4,
              cloudflareAccountId4: userCfAccount4,
              userTier,
            }, async () => {
              const stream = await graph.stream(initialState, { streamMode: "updates", recursionLimit: 100 });
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
            clearPipelineTimeout();
            await safeCleanup();
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
      // Synchronous fallback — BUG-2 FIX: wrap with a timeout race so we never hang forever.
      try {
        const pipelinePromise = apiKeyStorage.run({ 
          geminiApiKey: userApiKey,
          cloudflareApiToken: userCfToken,
          cloudflareAccountId: userCfAccount,
          cloudflareApiToken1: userCfToken1,
          cloudflareAccountId1: userCfAccount1,
          cloudflareApiToken2: userCfToken2,
          cloudflareAccountId2: userCfAccount2,
          cloudflareApiToken3: userCfToken3,
          cloudflareAccountId3: userCfAccount3,
          cloudflareApiToken4: userCfToken4,
          cloudflareAccountId4: userCfAccount4,
        }, () => graph.invoke(initialState, { recursionLimit: 100 }));

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Pipeline timeout after ${PIPELINE_TIMEOUT_MS / 1000}s`)),
            PIPELINE_TIMEOUT_MS
          )
        );

        const result = await Promise.race([pipelinePromise, timeoutPromise]);
        return NextResponse.json(result);
      } finally {
        await safeCleanup();
      }
    }
  } catch (error: any) {
    console.error("DEBUG ERROR:", error);
    await safeCleanup();
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
