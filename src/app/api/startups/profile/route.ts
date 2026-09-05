import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const emailParam = url.searchParams.get("email");

    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    const targetEmail = emailParam || token?.email;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: "Email parameter or active session is required." },
        { status: 401 }
      );
    }

    const emailClean = targetEmail.toLowerCase().trim();

    // Query Founder first
    let founder = await prisma.founder.findFirst({
      where: { email: { equals: emailClean, mode: "insensitive" } },
    });

    if (!founder) {
      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: emailClean, mode: "insensitive" } },
      });

      founder = await prisma.founder.create({
        data: {
          email: emailClean,
          fullName: dbUser?.name || emailClean.split("@")[0],
          avatarUrl: dbUser?.image || "",
          roleTitle: "Founder",
        },
      });
    }

    // Query Startup profile
    let startup = await prisma.startup.findFirst({
      where: {
        OR: [
          { founderId: founder.id },
          { founderProfile: { email: { equals: emailClean, mode: "insensitive" } } },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      data: startup || null,
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
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    const body = (await req.json()) as any;
    const { email, ...updateData } = body;

    const targetEmail = email || token?.email;
    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: "Email or active session is required." },
        { status: 401 }
      );
    }

    const emailClean = targetEmail.toLowerCase().trim();

    // Find or create Founder
    let founder = await prisma.founder.findFirst({
      where: { email: { equals: emailClean, mode: "insensitive" } },
    });

    if (!founder) {
      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: emailClean, mode: "insensitive" } },
      });

      founder = await prisma.founder.create({
        data: {
          email: emailClean,
          fullName: dbUser?.name || emailClean.split("@")[0],
          avatarUrl: dbUser?.image || "",
          roleTitle: "Founder",
        },
      });
    }

    // Find existing startup
    const existing = await prisma.startup.findFirst({
      where: {
        OR: [
          { founderId: founder.id },
          { founderProfile: { email: { equals: emailClean, mode: "insensitive" } } },
        ],
      },
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
          category: updateData.category || "Tech",
          stage: updateData.stage || "Pre-Seed",
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
      message: "Startup profile saved successfully!",
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


