import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");
    const identifier = searchParams.get("identifier");

    if (!email && !username && !identifier) {
      return NextResponse.json({ success: false, error: "Email, username, or identifier is required" }, { status: 400 });
    }

    const searchCriteria = identifier 
      ? { OR: [{ email: identifier }, { username: identifier }] }
      : email 
        ? { email }
        : { username: username as string };

    // 1. Try to find Investor
    const investor = await prisma.investor.findFirst({
      where: searchCriteria,
    });

    if (investor) {
      return NextResponse.json({
        success: true,
        type: "investor",
        data: {
          name: investor.name,
          tagline: investor.role || "Investor",
          logoUrl: investor.avatarUrl || null,
          category: investor.focusSectors?.[0] || "General",
          stage: investor.preferredStages?.[0] || "All Stages",
          gatedFields: JSON.stringify({}),
          firm: investor.firm,
          details: `Checks: ${investor.checkSize || "Flexible"}`
        }
      });
    }

    // 2. Try to find Founder
    const founder = await prisma.founder.findFirst({
      where: searchCriteria,
      include: {
        startups: true,
      }
    });

    if (founder) {
      const startup = founder.startups?.[0];
      return NextResponse.json({
        success: true,
        type: "founder",
        data: {
          name: founder.fullName || "Founder",
          tagline: founder.roleTitle || "Founder",
          logoUrl: founder.avatarUrl || null,
          category: startup?.category || "Technology",
          stage: startup?.stage || "Early Stage",
          gatedFields: JSON.stringify({}),
          startupName: startup?.name || founder.startupName || "Stealth Startup",
          details: startup?.tagline || founder.aboutText || "Building something new"
        }
      });
    }

    // If not found in either
    return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Error fetching public profile:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
