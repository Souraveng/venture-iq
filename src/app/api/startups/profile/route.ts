import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const emailParam = url.searchParams.get("email");

    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET || "V4dzUUwcvodMYbvndczt0K4JC3wD38zbJ5hJq9yVzLA=",
    });

    const targetEmail =
      emailParam ||
      token?.email ||
      "himanshu25b@gmail.com";

    const emailClean = targetEmail.toLowerCase().trim();

    // Query Founder first to get founderId
    const founder = await prisma.founder.findUnique({
      where: { email: emailClean },
    });

    if (!founder) {
      return NextResponse.json(
        { success: false, error: "No founder profile found for this email." },
        { status: 404 }
      );
    }

    // Query Startup profile from Azure PostgreSQL
    let startup = await prisma.startup.findFirst({
      where: { founderId: founder.id },
    });

    if (!startup) {
      return NextResponse.json(
        { success: false, error: "No startup profile found for this founder." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: startup,
    });
  } catch (error) {
    console.error("GET /api/startups/profile Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch startup profile from database." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { email, ...updateData } = body;

    const targetEmail = (email || "himanshu25b@gmail.com").toLowerCase().trim();

    // Find Founder
    const founder = await prisma.founder.findUnique({
      where: { email: targetEmail },
    });

    if (!founder) {
      return NextResponse.json(
        { success: false, error: "Founder profile not found." },
        { status: 404 }
      );
    }

    // Find existing startup
    const existing = await prisma.startup.findFirst({
      where: { founderId: founder.id },
    });

    let updatedStartup;
    if (existing) {
      updatedStartup = await prisma.startup.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      updatedStartup = await prisma.startup.create({
        data: {
          founderId: founder.id,
          founder: founder.fullName,
          name: updateData.name || "My Startup",
          tagline: updateData.tagline || "",
          category: updateData.category || "",
          stage: updateData.stage || "Idea",
          valuation: updateData.valuation || "0",
          targetAmount: updateData.targetAmount || "0",
          raisedAmount: updateData.raisedAmount || "0",
          location: updateData.location || "",
          traction: updateData.traction || "",
          ...updateData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Startup profile saved successfully to PostgreSQL database!",
      data: updatedStartup,
    });
  } catch (error) {
    console.error("POST /api/startups/profile Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update startup profile in database." },
      { status: 500 }
    );
  }
}
