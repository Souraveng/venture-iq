import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeRedirectUrl } from "@/lib/url";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");
    const requestedRole = roleParam === "investor" ? "investor" : "founder";

    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      console.error("No active session found in social callback");
      return NextResponse.redirect(safeRedirectUrl(req, "/login-role", { error: "unauthorized" }));
    }

    const email = session.user.email.toLowerCase().trim();
    const name = session.user.name || (requestedRole === "investor" ? "Investor" : "Founder");

    // 1. Find or create the user in the database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user with the requested role
      user = await prisma.user.create({
        data: {
          name,
          email,
          image: session.user.image || undefined,
          role: requestedRole,
          roles: [requestedRole],
        },
      });
    } else {
      // User exists. Update avatar if missing and update the roles array to ensure the requested role is present.
      const currentRoles = user.roles || [user.role || "founder"];
      const updatedRoles = currentRoles.includes(requestedRole)
        ? currentRoles
        : Array.from(new Set([...currentRoles, requestedRole]));

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          roles: updatedRoles,
          role: requestedRole, // Set active role to the newly logged in role
          image: user.image || session.user.image || undefined,
        },
      });
    }

    // 2. Ensure Founder or Investor profile exists in DB
    try {
      if (requestedRole === "founder") {
        const existingFounder = await prisma.founder.findUnique({ where: { email } });
        if (!existingFounder) {
          await prisma.founder.create({
            data: {
              email,
              fullName: name,
              avatarUrl: session.user.image || undefined,
            },
          });
        }
      } else if (requestedRole === "investor") {
        const existingInvestor = await prisma.investor.findUnique({ where: { email } });
        if (!existingInvestor) {
          await prisma.investor.create({
            data: {
              email,
              name,
              avatarUrl: session.user.image || undefined,
            },
          });
        }
      }
    } catch (profileError) {
      console.warn("Could not auto-create role profile record:", profileError);
    }

    // 3. Set the client cookie and redirect using safe URL construction
    const redirectUrl = requestedRole === "investor" ? "/investor/connect" : "/founder/home";
    const response = NextResponse.redirect(safeRedirectUrl(req, redirectUrl));

    response.cookies.set("ventureiq_role", requestedRole, {
      path: "/",
      httpOnly: false, // client-side needs access to read this cookie
      maxAge: 86400,
    });

    response.cookies.set("ventureiq_roles", (user.roles || [requestedRole]).join(","), {
      path: "/",
      httpOnly: false,
      maxAge: 86400,
    });

    return response;
  } catch (error) {
    console.error("Social callback error:", error);
    return NextResponse.redirect(safeRedirectUrl(req, "/login-role", { error: "server_error" }));
  }
}
