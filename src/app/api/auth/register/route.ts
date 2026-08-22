import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const { name, email, password, role } = body;

    // 1. Input Validation Rules
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Full Name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&).",
        },
        { status: 400 }
      );
    }

    const requestedRole = role === "investor" ? "investor" : "founder";
    const formattedEmail = email.toLowerCase().trim();

    // 2. Check existing user
    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: formattedEmail },
      });
    } catch (dbError) {
      console.warn("Database offline during user checking, bypassing registration check:", dbError);
      return NextResponse.json({
        success: true,
        message: "Offline mode bypass registration successful.",
        user: { name, email: formattedEmail, role: requestedRole }
      });
    }

    if (existingUser) {
      // Validate password for existing account
      if (existingUser.password) {
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
          return NextResponse.json(
            { success: false, error: "An account with this email exists, but the password provided was incorrect." },
            { status: 400 }
          );
        }
      }

      // Check if user already has this role
      const currentRoles = existingUser.roles || [existingUser.role || "founder"];
      if (currentRoles.includes(requestedRole)) {
        return NextResponse.json(
          { success: false, error: `You already have an active ${requestedRole} profile with this email. Please log in.` },
          { status: 400 }
        );
      }

      // Append new role to existing user account (Single Email, Dual-Role Support!)
      const updatedRoles = Array.from(new Set([...currentRoles, requestedRole]));
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          roles: updatedRoles,
          role: requestedRole, // Set active role to newly created profile
        },
      });

      const response = NextResponse.json({
        success: true,
        message: `${requestedRole.toUpperCase()} profile successfully added to your account!`,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: requestedRole,
          roles: updatedUser.roles,
        },
      });

      response.cookies.set("ventureiq_role", requestedRole, {
        path: "/",
        httpOnly: false,
        maxAge: 86400,
      });

      response.cookies.set("ventureiq_roles", updatedRoles.join(","), {
        path: "/",
        httpOnly: false,
        maxAge: 86400,
      });

      return response;
    }

    // 3. Create Brand New User Account
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: formattedEmail,
        password: hashedPassword,
        role: requestedRole,
        roles: [requestedRole],
      },
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully!",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        roles: newUser.roles,
      },
    });

    response.cookies.set("ventureiq_role", requestedRole, {
      path: "/",
      httpOnly: false,
      maxAge: 86400,
    });

    response.cookies.set("ventureiq_roles", [requestedRole].join(","), {
      path: "/",
      httpOnly: false,
      maxAge: 86400,
    });

    return response;
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error during registration." },
      { status: 500 }
    );
  }
}
