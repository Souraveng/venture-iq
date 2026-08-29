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
      secret: process.env.NEXTAUTH_SECRET || "V4dzUUwcvodMYbvndczt0K4JC3wD38zbJ5hJq9yVzLA=",
    });

    const targetEmail =
      emailParam ||
      token?.email ||
      "himanshu25b@gmail.com";

    const emailClean = targetEmail.toLowerCase().trim();

    // Query Investor profile from Azure PostgreSQL
    let investor = await prisma.investor.findUnique({
      where: { email: emailClean },
    });

    // Auto-create or fetch from User if not found
    if (!investor) {
      const dbUser = await prisma.user.findUnique({
        where: { email: emailClean },
      });

      if (dbUser) {
        investor = await prisma.investor.create({
          data: {
            email: emailClean,
            name: dbUser.name || "Venture Partner",
            avatarUrl: dbUser.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
            investorType: "Individual Angel",
            role: "Managing Partner",
          },
        });
      }
    }

    // Fallback if no specific record found
    if (!investor) {
      investor = await prisma.investor.findFirst({
        where: {
          name: { contains: "Himanshu", mode: "insensitive" }
        }
      });
    }

    // Ultimate fallback to any investor
    if (!investor) {
      investor = await prisma.investor.findFirst();
    }

    if (!investor) {
      return NextResponse.json(
        { success: false, error: "No investor profile found in database." },
        { status: 404 }
      );
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
    const body = (await req.json()) as any;
    const { email, ...updateData } = body;

    const targetEmail = (email || "himanshu25b@gmail.com").toLowerCase().trim();

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
        OR: [
          { email: targetEmail },
          { name: { contains: "Himanshu", mode: "insensitive" } },
        ],
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
          email: targetEmail,
          name: updateData.name || "Himanshu",
          ...updateData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Investor profile saved successfully to PostgreSQL database!",
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
