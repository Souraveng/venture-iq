import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invokeExecutionFromPlan } from "@/lib/founder-intelligence/orchestrator";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { idea, userEmail, playbook, opportunity } = body;

    if (!idea || !playbook || !opportunity) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for resuming pipeline." },
        { status: 400 }
      );
    }

    // Execute the remaining phases (Phase 2 to 5) with the confirmed plan
    const { state: finalState, trace } = await invokeExecutionFromPlan(
      { idea, userEmail },
      { playbook, opportunity }
    );

    const pipeline = finalState.pipeline || {};
    const scorecard = pipeline.scorecard;
    const financialCalc = pipeline.financialAnalysis?.calculations;
    const report = pipeline.report;

    // Extract dashboard tabs as the reports array for DB storage
    const dashboardTabs = report?.dashboardTabs || {};
    const reportsArray = Object.values(dashboardTabs);

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

    return NextResponse.json({
      success: true,
      data: validation,
      reports: reportsArray,
      scorecard: scorecard,
      synthesis: pipeline.synthesis,
      trace,
    });
  } catch (error) {
    console.error("Pipeline resume error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resume validation pipeline." },
      { status: 500 }
    );
  }
}
