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

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-publishable-key";

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
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
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case 2: Authenticated user accessing auth routes or protected routes
  if (user) {
    // Fetch profile role from DB
    const { data: profile } = await (supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as any);

    const userRole: UserRole = profile?.role || "CUSTOMER";
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
