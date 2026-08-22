import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface Negotiation {
  id: string;
  name?: string;
  startupName: string;
  investorFirm: string;
  roundStage: string;
  proposedValuation: string;
  checkAmount: string;
  termSheetStatus: "Draft" | "Under Review" | "Term Sheet Signed" | "Completed";
  lastUpdated: string;
}

export async function GET() {
  try {
    const negotiations = await prisma.negotiation.findMany();
    const formatted = negotiations.map((n: any) => ({
      ...n,
      termSheetStatus: n.termSheetStatus as Negotiation["termSheetStatus"],
    }));
    return NextResponse.json({
      success: true,
      data: formatted,
      count: formatted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database fetch error (negotiations):", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch negotiations from database." },
      { status: 500 }
    );
  }
}
