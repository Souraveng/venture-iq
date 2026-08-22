import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invokeValidationPipeline } from "@/lib/founder-intelligence/orchestrator";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    let validations;
    if (email) {
      validations = await prisma.validation.findMany({
        where: { userEmail: email },
        orderBy: { createdAt: "desc" },
      });
    } else {
      validations = await prisma.validation.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      success: true,
      data: validations,
    });
  } catch (error) {
    console.error("Database fetch error (validations):", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch validations from database." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { idea, userEmail } = body;

    if (!idea) {
      return NextResponse.json(
        { success: false, error: "Idea concept is required." },
        { status: 400 }
      );
    }

    // Execute the full 10-node LangGraph pipeline with observability
    const { state: finalState, trace } = await invokeValidationPipeline({ idea, userEmail });

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

    // Optionally you could log the trace to an external service or file here
    console.log(`Pipeline trace for validation ${validation.id} completed with status: ${trace.status}`);

    return NextResponse.json({
      success: true,
      data: validation,
      reports: reportsArray,
      scorecard: scorecard,
      synthesis: pipeline.synthesis,
      trace, // Optional: return trace for debugging
    });
  } catch (error) {
    console.error("Pipeline error (validations):", error);
    return NextResponse.json(
      { success: false, error: "Failed to run validation pipeline." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Validation ID is required." },
        { status: 400 }
      );
    }

    await prisma.validation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Validation deleted successfully.",
    });
  } catch (error) {
    console.error("Database delete error (validations):", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete validation from database." },
      { status: 500 }
    );
  }
}

