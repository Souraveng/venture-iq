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
    secret: process.env.NEXTAUTH_SECRET!,
  });

  const isAuth = !!token;

  // Extract user roles from cookie and JWT
  const cookieRole = req.cookies.get("ventureiq_role")?.value;
  const tokenRole = (token?.role as string) || null;
  const activeRole = cookieRole || tokenRole || null;
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
  // ──────────────────────────────────────────────────────────────────
  if (isFounderRoute) {
    const hasFounderAccess =
      activeRole === "founder" ||
      activeRole === "admin" ||
      userRoles.includes("founder") ||
      tokenRole === "founder";

    if (!hasFounderAccess) {
      return NextResponse.redirect(
        buildUrl(req, "/login/founder", { error: "role_required" })
      );
    }

    // Set cookie if needed to keep active role in sync seamlessly without redirect loop
    const response = NextResponse.next();
    if (cookieRole !== "founder") {
      response.cookies.set("ventureiq_role", "founder", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    // Founder must be onboarded
    if (!isOnboarded && !hasSkippedOnboarding) {
      return NextResponse.redirect(buildUrl(req, "/onboarding/founder"));
    }

    return response;
  }

  if (isInvestorRoute) {
    const hasInvestorAccess =
      activeRole === "investor" ||
      activeRole === "admin" ||
      userRoles.includes("investor") ||
      tokenRole === "investor";

    if (!hasInvestorAccess) {
      return NextResponse.redirect(
        buildUrl(req, "/login/investor", { error: "role_required" })
      );
    }

    // Set cookie if needed to keep active role in sync seamlessly without redirect loop
    const response = NextResponse.next();
    if (cookieRole !== "investor") {
      response.cookies.set("ventureiq_role", "investor", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    // Investor must be onboarded
    if (!isOnboarded) {
      return NextResponse.redirect(buildUrl(req, "/onboarding/investor"));
    }

    return response;
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


