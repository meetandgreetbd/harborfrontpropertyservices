import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic guard: bounce visitors without a session cookie away from /admin.
 * The real check (signature + user lookup) happens in requireAdmin() on every page and action.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  if (!request.cookies.has("hf_admin")) {
    const url = new URL("/admin/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
