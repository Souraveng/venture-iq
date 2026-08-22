import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { startupId, investorEmail, eventType, metadata } = body;

    if (!startupId || !eventType) {
      return NextResponse.json(
        { success: false, error: "startupId and eventType are required." },
        { status: 400 }
      );
    }

    let investorId = body.investorId;
    if (!investorId && investorEmail) {
      const investor = await prisma.investor.findUnique({
        where: { email: investorEmail },
        select: { id: true }
      });
      investorId = investor?.id;
    }

    if (!investorId) {
      return NextResponse.json(
        { success: false, error: "Valid investor not found." },
        { status: 404 }
      );
    }

    // Append to lightweight events table
    const event = await prisma.investorActivityEvent.create({
      data: {
        investorId,
        startupId,
        eventType,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: event.id },
    });
  } catch (error: any) {
    console.error("[Investor Event Tracking Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log event" },
      { status: 500 }
    );
  }
}
