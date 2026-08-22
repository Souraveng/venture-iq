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

    // Query Founder profile from Azure PostgreSQL
    let founder = await prisma.founder.findUnique({
      where: { email: emailClean },
    });

    // Auto-create or fetch from User if not found
    if (!founder) {
      const dbUser = await prisma.user.findUnique({
        where: { email: emailClean },
      });

      founder = await prisma.founder.create({
        data: {
          email: emailClean,
          fullName: dbUser?.name || "",
          avatarUrl: dbUser?.image || "",
          roleTitle: "",
          location: "",
          linkedinUrl: "",
          commitment: "",
          equityStake: "",
          startupName: "",
          aboutQuote: "",
          aboutText: "",
          domainExpertise: [],
          keySkills: [],
          teamSize: "",
          verificationBadge: "",
          background: [],
        },
      });
    }

    if (!founder) {
      return NextResponse.json(
        { success: false, error: "No founder profile found in database." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: founder,
    });
  } catch (error) {
    console.error("GET /api/founder/profile Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch founder profile from database." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { email, ...updateData } = body;

    const targetEmail = (email || "himanshu25b@gmail.com").toLowerCase().trim();

    // Upsert Founder Profile in Azure PostgreSQL
    const existing = await prisma.founder.findFirst({
      where: {
        email: targetEmail,
      },
    });

    let updatedFounder;
    if (existing) {
      updatedFounder = await prisma.founder.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      updatedFounder = await prisma.founder.create({
        data: {
          email: targetEmail,
          fullName: updateData.fullName || "Himanshu",
          ...updateData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Founder profile saved successfully to PostgreSQL database!",
      data: updatedFounder,
    });
  } catch (error) {
    console.error("POST /api/founder/profile Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update founder profile in database." },
      { status: 500 }
    );
  }
}
