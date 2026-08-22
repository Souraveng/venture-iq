import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Build a redirect URL that is safe behind reverse proxies (Cloud Run).
 * Reads x-forwarded-host / x-forwarded-proto so we never redirect to 0.0.0.0.
 */
function buildUrl(req: NextRequest, pathname: string, params?: Record<string, string>): URL {
  const url = req.nextUrl.clone();

  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    url.host = forwardedHost;
    url.protocol = forwardedProto ? `${forwardedProto}:` : "https:";
    url.port = "";
  }

  url.pathname = pathname;
  // Clear any existing search params from the cloned URL
  url.search = "";
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Define protected route patterns
  const isFounderRoute = pathname.startsWith("/founder");
  const isInvestorRoute = pathname.startsWith("/investor");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isProtectedApiRoute =
    pathname.startsWith("/api/startups") ||
    pathname.startsWith("/api/investors") ||
    pathname.startsWith("/api/meetings") ||
    pathname.startsWith("/api/negotiations") ||
    pathname.startsWith("/api/validations");

  // Skip checks for public landing & login pages
  if (!isFounderRoute && !isInvestorRoute && !isOnboardingRoute && !isProtectedApiRoute) {
    return NextResponse.next();
  }

  // Retrieve NextAuth JWT token — this is the ONLY source of truth for auth
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "V4dzUUwcvodMYbvndczt0K4JC3wD38zbJ5hJq9yVzLA=",
  });

  const isAuth = !!token;

  // Extract user roles from JWT
  const activeRole = (token?.role as string) || null;
  const userRoles: string[] =
    (token?.roles as string[]) ||
    (activeRole ? [activeRole] : []);

  // ──────────────────────────────────────────────────────────────────
  // 1. UNAUTHENTICATED — block access to all protected routes
  // ──────────────────────────────────────────────────────────────────
  if (!isAuth) {
    if (isFounderRoute) {
      return NextResponse.redirect(
        buildUrl(req, "/login/founder", { error: "unauthorized" })
      );
    }

    if (isInvestorRoute) {
      return NextResponse.redirect(
        buildUrl(req, "/login/investor", { error: "unauthorized" })
      );
    }

    if (isProtectedApiRoute) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Authentication required." },
        { status: 401 }
      );
    }

    if (isOnboardingRoute) {
      return NextResponse.redirect(buildUrl(req, "/login-role"));
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // 2. ONBOARDING — redirect already-onboarded users to their portal
  // ──────────────────────────────────────────────────────────────────
  const isOnboarded = token?.onboarded === true;
  const hasSkippedOnboarding = req.cookies.has("skipped_onboarding");

  if (isAuth && isOnboardingRoute) {
    if (isOnboarded) {
      const dest = activeRole === "investor" ? "/investor/connect" : "/founder/home";
      return NextResponse.redirect(buildUrl(req, dest));
    }
    return NextResponse.next();
  }

  // ──────────────────────────────────────────────────────────────────
  // 3. STRICT RBAC — block cross-role URL manipulation
  //    A founder typing /investor/* is BLOCKED and sent to login.
  //    No silent role-switching. No auto-escalation.
  // ──────────────────────────────────────────────────────────────────
  if (isFounderRoute) {
    if (activeRole !== "founder" && activeRole !== "admin") {
      // User is authenticated but their active role is NOT founder
      if (userRoles.includes("founder")) {
        // They have the founder role but it is not active — redirect to switch
        return NextResponse.redirect(
          buildUrl(req, "/api/auth/switch-role", {
            role: "founder",
            callbackUrl: pathname,
          })
        );
      }
      // They do NOT have the founder role at all — block completely
      return NextResponse.redirect(
        buildUrl(req, "/login/founder", { error: "role_required" })
      );
    }

    // Founder must be onboarded
    if (!isOnboarded && !hasSkippedOnboarding) {
      return NextResponse.redirect(buildUrl(req, "/onboarding/founder"));
    }
  }

  if (isInvestorRoute) {
    if (activeRole !== "investor" && activeRole !== "admin") {
      // User is authenticated but their active role is NOT investor
      if (userRoles.includes("investor")) {
        // They have the investor role but it is not active — redirect to switch
        return NextResponse.redirect(
          buildUrl(req, "/api/auth/switch-role", {
            role: "investor",
            callbackUrl: pathname,
          })
        );
      }
      // They do NOT have the investor role at all — block completely
      return NextResponse.redirect(
        buildUrl(req, "/login/investor", { error: "role_required" })
      );
    }

    // Investor must be onboarded
    if (!isOnboarded) {
      return NextResponse.redirect(buildUrl(req, "/onboarding/investor"));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/founder/:path*",
    "/investor/:path*",
    "/onboarding/:path*",
    "/api/startups/:path*",
    "/api/investors/:path*",
    "/api/meetings/:path*",
    "/api/negotiations/:path*",
    "/api/validations/:path*",
  ],
};
