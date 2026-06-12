import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/settings",
  "/agents",
  "/analytics",
  "/audit",
  "/collaboration",
  "/competitors",
  "/conversations",
  "/financials",
  "/intake",
  "/notifications",
  "/pitch",
  "/research",
  "/risks",
  "/roadmap",
  "/validation",
  "/workflows",
  "/workspace",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // NextAuth sets either of these cookies depending on HTTPS or HTTP
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    // Redirect unauthenticated users to landing page
    const landingUrl = new URL("/", request.url);
    landingUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(landingUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/agents/:path*",
    "/analytics/:path*",
    "/audit/:path*",
    "/collaboration/:path*",
    "/competitors/:path*",
    "/conversations/:path*",
    "/financials/:path*",
    "/intake/:path*",
    "/notifications/:path*",
    "/pitch/:path*",
    "/research/:path*",
    "/risks/:path*",
    "/roadmap/:path*",
    "/validation/:path*",
    "/workflows/:path*",
    "/workspace/:path*",
  ],
};
