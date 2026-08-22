import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DiligenceInputSnapshot } from "@/lib/intelligence/contracts";
import { DILIGENCE_RUNTIME_VERSION, diligenceWorkerPlan } from "@/lib/intelligence/contracts";
import { diligenceGraph } from "@/lib/intelligence/orchestrator";
import { getInvestorIdentity } from "@/lib/intelligence/investor-auth";

interface RouteContext {
  params: Promise<{ analysisId: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  const investor = await getInvestorIdentity(req);
  if (!investor) {
    return NextResponse.json({ success: false, error: "Investor authentication is required." }, { status: 401 });
  }

  try {
    const { analysisId } = await context.params;
    const run = await prisma.analysisRun.findFirst({
      where: { id: analysisId, investorEmail: investor.email },
      include: { evidence: { where: { sourceType: "STARTUP_PROFILE" }, take: 1 } },
    });

    if (!run) {
      return NextResponse.json({ success: false, error: "Diligence run not found." }, { status: 404 });
    }
    if (run.status === "RUNNING") {
      return NextResponse.json({ success: false, error: "This diligence run is already in progress." }, { status: 409 });
    }

    let scenarioOverrides;
    try {
      const body = (await req.json()) as any;
      scenarioOverrides = body.scenarioOverrides;
    } catch (e) {
      // no body
    }

    const input = run.inputSnapshot as unknown as DiligenceInputSnapshot;
    if (scenarioOverrides) {
      input.scenarioOverrides = scenarioOverrides;
    }
    const evidenceRefs = run.evidence[0] ? [run.evidence[0].id] : [];
    const now = new Date();

    await prisma.analysisRun.update({
      where: { id: run.id },
      data: {
        status: "RUNNING",
        startedAt: run.startedAt ?? now,
        errorMessage: null,
      },
    });

    // Start background execution
    const runAsync = async () => {
      try {
        const initialState = {
          input,
          result: {
            findings: [],
            scorecards: [],
            recommendations: [],
            completedWorkerIds: [],
          } as import("@/lib/intelligence/contracts").EngineAnalysisResult
        };

        const events = await diligenceGraph.streamEvents(initialState, { version: "v2" });
        let analysisResult = initialState.result;
        
        let currentPlan = diligenceWorkerPlan.map((w) => ({ id: w.id, status: "PENDING_EVIDENCE" }));

        for await (const event of events) {
          const isWorkerNode = diligenceWorkerPlan.some(w => w.id === event.name);
          if (isWorkerNode) {
            if (event.event === "on_chain_start") {
              currentPlan = currentPlan.map(p => p.id === event.name ? { ...p, status: "RUNNING" } : p);
              await prisma.analysisRun.update({
                where: { id: run.id },
                data: { sharedState: { executionPlan: currentPlan } as any }
              });
            } else if (event.event === "on_chain_end") {
              currentPlan = currentPlan.map(p => p.id === event.name ? { ...p, status: "COMPLETED" } : p);
              await prisma.analysisRun.update({
                where: { id: run.id },
                data: { sharedState: { executionPlan: currentPlan } as any }
              });
              if (event.data?.output?.result) {
                analysisResult = event.data.output.result;
              }
            }
          }
        }

        const completedWorkerIds = new Set(analysisResult.completedWorkerIds);
        await prisma.analysisRun.update({
          where: { id: run.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            runtimeVersion: DILIGENCE_RUNTIME_VERSION,
            sharedState: {
              runtimeVersion: DILIGENCE_RUNTIME_VERSION,
              executionPlan: diligenceWorkerPlan.map((worker) => ({
                id: worker.id,
                status: completedWorkerIds.has(worker.id) ? "COMPLETED" : "PENDING_EVIDENCE",
              })),
              dataReadiness: input.missingFields.length === 0 ? "READY_FOR_VERIFICATION" : "AWAITING_EVIDENCE",
            } as any,
            findings: { deleteMany: {}, create: analysisResult.findings.map((item) => ({ ...item, evidenceRefs })) },
            scorecards: {
              deleteMany: {},
              create: analysisResult.scorecards.map((scorecard) => ({
                ...scorecard,
                weights: scorecard.weights as any,
                components: scorecard.components as any,
              })),
            },
            recommendations: { deleteMany: {}, create: analysisResult.recommendations.map((item) => ({ ...item, evidenceRefs })) },
          },
        });
      } catch (error) {
        console.error("Pipeline background execution error:", error);
        await prisma.analysisRun.update({
          where: { id: run.id },
          data: { status: "FAILED", errorMessage: "An error occurred during pipeline execution." }
        });
      }
    };

    // Fire and forget
    runAsync();

    return NextResponse.json({ success: true, message: "Execution started in background" });
  } catch (error) {
    console.error("POST /api/investor/analyses/[analysisId]/execute error:", error);
    return NextResponse.json({ success: false, error: "Unable to execute foundational diligence." }, { status: 500 });
  }
}
