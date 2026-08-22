import { NextRequest } from "next/server";

/**
 * Build a safe base URL that works on both localhost and behind
 * reverse-proxies like Google Cloud Run.
 *
 * On Cloud Run the container listens on 0.0.0.0:8080 but the public
 * hostname is forwarded via x-forwarded-host / x-forwarded-proto.
 */
export function getBaseUrl(req: Request | NextRequest): string {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

/**
 * Build a full redirect URL that is safe for Cloud Run.
 */
export function safeRedirectUrl(req: Request | NextRequest, pathname: string, params?: Record<string, string>): URL {
  const base = getBaseUrl(req);
  const url = new URL(pathname, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}
