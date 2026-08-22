import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { startupId, eventType, investorEmail } = body;

    if (!startupId || !eventType) {
      return NextResponse.json(
        { success: false, error: "startupId and eventType are required." },
        { status: 400 }
      );
    }

    // Validate eventType against enum values
    const validEventTypes = ["PROFILE_VIEW", "VIDEO_VIEW", "DECK_VIEW", "FEED_IMPRESSION"];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { success: false, error: `Invalid eventType: ${eventType}` },
        { status: 400 }
      );
    }

    let investorId: string | null = null;
    if (investorEmail) {
      const dbInvestor = await prisma.investor.findUnique({
        where: { email: investorEmail },
      });
      if (dbInvestor) {
        investorId = dbInvestor.id;
      } else {
        // Fallback: use email directly if Investor profile doesn't exist yet
        investorId = investorEmail;
      }
    }

    const newEvent = await prisma.startupAnalyticsEvent.create({
      data: {
        startupId,
        eventType,
        investorId,
      },
    });

    return NextResponse.json({
      success: true,
      data: newEvent,
    });
  } catch (error) {
    console.error("Failed to create startup analytics event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log event." },
      { status: 500 }
    );
  }
}
