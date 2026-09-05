import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const emailParam = url.searchParams.get("email");

    // Retrieve NextAuth JWT token if available
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

    // Query Investor profile
    let investor = await prisma.investor.findFirst({
      where: { email: { equals: emailClean, mode: "insensitive" } },
    });

    // Auto-create or fetch from User if not found
    if (!investor) {
      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: emailClean, mode: "insensitive" } },
      });

      investor = await prisma.investor.create({
        data: {
          email: emailClean,
          name: dbUser?.name || emailClean.split("@")[0],
          avatarUrl: dbUser?.image || null,
          investorType: "Individual Angel",
          role: "Managing Partner",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: investor,
    });
  } catch (error) {
    console.error("GET /api/investors/profile Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch investor profile from database." },
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

    if (updateData.username) {
      const isTaken = await prisma.investor.findFirst({
        where: {
          username: updateData.username,
          email: { not: targetEmail },
        }
      });
      const isTakenFounder = await prisma.founder.findFirst({
        where: {
          username: updateData.username,
          email: { not: targetEmail },
        }
      });
      if (isTaken || isTakenFounder) {
        return NextResponse.json(
          { success: false, error: "Username is already taken." },
          { status: 400 }
        );
      }
    }

    // Upsert Investor Profile into Azure PostgreSQL
    const existing = await prisma.investor.findFirst({
      where: {
        email: { equals: emailClean, mode: "insensitive" },
      },
    });

    let updatedInvestor;
    if (existing) {
      updatedInvestor = await prisma.investor.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      updatedInvestor = await prisma.investor.create({
        data: {
          email: emailClean,
          name: updateData.name || emailClean.split("@")[0],
          ...updateData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Investor profile saved successfully!",
      data: updatedInvestor,
    });
  } catch (error) {
    console.error("POST /api/investors/profile Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update investor profile in database." },
      { status: 500 }
    );
  }
}


