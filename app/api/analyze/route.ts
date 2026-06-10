// app/api/analyze/route.ts
import { NextResponse } from "next/server";
import { graph } from "@/lib/graph/engine";

export async function POST(req: Request) {
  const body = await req.json();
  
  const initialState = {
    mode: body.mode,
    userInput: body.data,
    researchPlan: [],
    marketIntel: {},
    financialIntel: {},
    finalReport: {}
  };

  try {
    const result = await graph.invoke(initialState);
    return NextResponse.json(result);
  } catch (error: any) {
    // THIS WILL PRINT THE REAL ERROR IN YOUR TERMINAL
    console.error("DEBUG ERROR:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack // Added stack trace for debugging
    }, { status: 500 });

  }
}