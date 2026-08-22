import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface Investor {
  id: string;
  name: string;
  firm: string;
  role: string;
  focusSectors: string[];
  checkSize: string;
  portfolioCount: number;
  verified: boolean;
  location: string;
}

export async function GET() {
  try {
    const investors = await prisma.investor.findMany();
    return NextResponse.json({
      success: true,
      data: investors,
      count: investors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database fetch error (investors):", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch investors from database." },
      { status: 500 }
    );
  }
}
