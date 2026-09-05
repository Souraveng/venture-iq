import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { safeRedirectUrl } from "@/lib/url";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const targetRole = url.searchParams.get("role");
    const callbackUrl = url.searchParams.get("callbackUrl") || "/";

    if (!targetRole || (targetRole !== "founder" && targetRole !== "investor")) {
      return NextResponse.redirect(safeRedirectUrl(req, "/login-role"));
    }

    // Get the JWT token directly
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });

    if (!token || !token.email) {
      return NextResponse.redirect(safeRedirectUrl(req, `/login/${targetRole}`));
    }

    const currentRoles = (token.roles as string[]) || [(token.role as string) || "founder"];

    // If the user doesn't have the target role in their roles array, redirect to login page for that role
    if (!currentRoles.includes(targetRole)) {
      return NextResponse.redirect(
        safeRedirectUrl(req, `/login/${targetRole}`, { error: "role_mismatch" })
      );
    }

    // Update the active role in the database
    try {
      await prisma.user.update({
        where: { email: token.email },
        data: { role: targetRole },
      });
    } catch (error) {
      console.warn("Failed to update role in DB, continuing anyway:", error);
    }

    // Redirect to the callback URL using safe URL construction
    const response = NextResponse.redirect(safeRedirectUrl(req, callbackUrl));
    
    // Set the active role cookie to ensure proxy.ts picks it up immediately
    response.cookies.set("ventureiq_role", targetRole, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;

  } catch (error) {
    console.error("Error in switch-role endpoint:", error);
    return NextResponse.redirect(safeRedirectUrl(req, "/login-role", { error: "switch_failed" }));
  }
}


