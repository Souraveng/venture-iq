import { NextResponse } from "next/server";
import { invokePlanningOnly } from "@/lib/founder-intelligence/orchestrator";

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

    // Execute only Phase 0 and Phase 1 to generate the planning data
    const { state: finalState, trace } = await invokePlanningOnly({ idea, userEmail });

    const pipeline = finalState.pipeline || {};

    return NextResponse.json({
      success: true,
      data: {
        playbook: pipeline.playbook,
        opportunity: pipeline.opportunity,
      },
      trace,
    });
  } catch (error) {
    console.error("Pipeline planning error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run planning pipeline." },
      { status: 500 }
    );
  }
}
