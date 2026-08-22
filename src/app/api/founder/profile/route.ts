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

    const targetEmail = emailParam || token?.email;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: "Email parameter or active session is required." },
        { status: 401 }
      );
    }

    const emailClean = targetEmail.toLowerCase().trim();

    // Query Founder profile
    let founder = await prisma.founder.findFirst({
      where: { email: { equals: emailClean, mode: "insensitive" } },
    });

    // Auto-create or fetch from User if not found
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
          location: "",
          linkedinUrl: "",
          commitment: "Full-Time",
          equityStake: "100%",
          startupName: "",
          aboutQuote: "",
          aboutText: "",
          domainExpertise: [],
          keySkills: [],
          teamSize: "1-5",
          verificationBadge: "",
          background: [],
        },
      });
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
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET || "V4dzUUwcvodMYbvndczt0K4JC3wD38zbJ5hJq9yVzLA=",
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

    // Upsert Founder Profile
    const existing = await prisma.founder.findFirst({
      where: {
        email: { equals: emailClean, mode: "insensitive" },
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
          email: emailClean,
          fullName: updateData.fullName || emailClean.split("@")[0],
          ...updateData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Founder profile saved successfully!",
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
