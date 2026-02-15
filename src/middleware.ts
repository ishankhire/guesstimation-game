import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth routes, static assets, API routes, and public data
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check for NextAuth session token cookie (JWT strategy)
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  // Not signed in — allow through (anonymous play)
  if (!hasSession) {
    return NextResponse.next();
  }

  // Signed in — check for username cookie we set after username selection
  const hasUsername = req.cookies.has("has-username");

  // Signed in but no username — redirect to username page
  if (!hasUsername && pathname !== "/username") {
    return NextResponse.redirect(new URL("/username", req.url));
  }

  // Has username but trying to access /username page — redirect to game
  if (hasUsername && pathname === "/username") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|questions.json).*)"],
};
