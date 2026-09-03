import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRouteAllowedForRole, getRoleHomeRoute } from "@/lib/auth/rbac";
import type { UserRole } from "@/supabase/types/database.types";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedPath =
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/federation-admin") ||
    pathname.startsWith("/worker") ||
    pathname.startsWith("/customer");

  const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Case 1: Unauthenticated user accessing a protected route
  if (!user && isProtectedPath) {
    // Sanitize open redirect: only allow relative paths starting with /
    const sanitizedRedirect = (pathname.startsWith("/") && !pathname.startsWith("//")) ? pathname : "/";
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", sanitizedRedirect);
    return NextResponse.redirect(loginUrl);
  }

  // Case 2: Authenticated user accessing auth routes or protected routes
  if (user) {
    // Fetch profile role & active status from DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle() as any);

    const userRole: UserRole = profile?.role || "CUSTOMER";
    const isActive: boolean = profile?.is_active ?? true;

    // If account/profile is inactive/pending and trying to access protected routes, redirect to /pending
    if (!isActive && isProtectedPath && userRole !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }

    const homeRoute = getRoleHomeRoute(userRole);

    // If user is accessing login/register while authenticated, redirect to their role home page
    if (isAuthPath) {
      return NextResponse.redirect(new URL(homeRoute, request.url));
    }

    // Check cross-role route permission
    if (isProtectedPath && !isRouteAllowedForRole(pathname, userRole)) {
      return NextResponse.redirect(new URL(homeRoute, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/federation-admin/:path*",
    "/worker/:path*",
    "/customer/:path*",
    "/login",
    "/register",
  ],
};
