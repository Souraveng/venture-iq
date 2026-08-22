import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { email, password, role } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Please enter your password." },
        { status: 400 }
      );
    }

    const targetRole = role === "investor" ? "investor" : "founder";

    // 1. Find user in Database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: "No account found with this email. Please sign up first." },
        { status: 401 }
      );
    }

    // 2. Compare Password Hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3. Strict Role Authorization Check
    const userRoles = user.roles || [user.role || "founder"];
    if (!userRoles.includes(targetRole)) {
      return NextResponse.json(
        {
          success: false,
          error: `Account exists, but you have not created a ${targetRole.toUpperCase()} profile yet. Please switch to the "Sign Up" tab on the ${targetRole.toUpperCase()} portal to activate it.`,
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: targetRole,
        roles: userRoles,
      },
    });

    // Set HTTP session cookie for Next.js middleware authorization
    response.cookies.set("ventureiq_role", targetRole, {
      path: "/",
      httpOnly: false,
      maxAge: 86400,
    });

    response.cookies.set("ventureiq_roles", userRoles.join(","), {
      path: "/",
      httpOnly: false,
      maxAge: 86400,
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error during login." },
      { status: 500 }
    );
  }
}
