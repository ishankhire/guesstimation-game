import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow auth routes, static assets, and public data
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Not signed in — allow through (anonymous play is permitted)
  if (!req.auth) {
    return NextResponse.next();
  }

  // Signed in but no username — redirect to username page
  if (
    !req.auth.user.username &&
    pathname !== "/username" &&
    !pathname.startsWith("/api/user/username")
  ) {
    return NextResponse.redirect(new URL("/username", req.url));
  }

  // Has username but trying to access /username page — redirect to game
  if (req.auth.user.username && pathname === "/username") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|questions.json).*)"],
};
