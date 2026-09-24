import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_AUTH_SECRET = process.env.ADMIN_AUTH_SECRET;
const PROTECTED_ADMIN_PATHS = ["/admin"];
const MUTATION_API_PREFIXES = [
  "/api/episodes",
  "/api/merch",
  "/api/events",
  "/api/config",
  "/api/broadcast/status",
];

function isProtectedPath(path: string): boolean {
  return (
    PROTECTED_ADMIN_PATHS.some((p) => path.startsWith(p)) ||
    MUTATION_API_PREFIXES.some((p) => path.startsWith(p))
  );
}

function isMutationMethod(method: string): boolean {
  return ["POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase());
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, fonts, and API callback verification paths
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/mpesa/callback") ||
    pathname.startsWith("/api/websub/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Require auth for protected paths
  if (isProtectedPath(pathname)) {
    // GET requests to admin page don't require auth (view-only)
    if (pathname.startsWith("/admin") && request.method === "GET") {
      return NextResponse.next();
    }

    // All mutation requests to protected paths require auth header
    if (isMutationMethod(request.method)) {
      const authHeader =
        request.headers.get("x-admin-secret") ||
        request.cookies.get("admin_secret")?.value;

      if (authHeader && authHeader === ADMIN_AUTH_SECRET) {
        return NextResponse.next();
      }

      // If in development mode, allow requests from localhost / local dev
      if (process.env.NODE_ENV === "development") {
        return NextResponse.next();
      }

      if (!ADMIN_AUTH_SECRET) {
        console.warn("[Middleware] ADMIN_AUTH_SECRET not configured — allowing mutation");
        return NextResponse.next();
      }

      return NextResponse.json(
        { error: "Unauthorized — invalid or missing admin secret" },
        { status: 401 }
      );
    }

    // Allow GET requests through
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
