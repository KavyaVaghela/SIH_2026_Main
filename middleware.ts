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
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options?: CookieOptions) {
        request.cookies.set({ name, value: "", ...options, maxAge: 0 });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set({ name, value, ...options });
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
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

  // Helper to construct redirects that preserve refreshed cookies
  const createRedirect = (url: URL) => {
    const redirectRes = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie);
    });
    return redirectRes;
  };

  // Direct alias: redirect legacy or stale /worker/dashboard directly to canonical /worker
  if (pathname === "/worker/dashboard" || pathname === "/worker/dashboard/") {
    const canonicalUrl = new URL("/worker", request.url);
    canonicalUrl.search = request.nextUrl.search;
    return createRedirect(canonicalUrl);
  }

  // Case 1: Unauthenticated user accessing a protected route
  if (!user && isProtectedPath) {
    // Development mode bypass for local prototyping/testing
    const allowDevBypass =
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_DISABLE_DEV_BYPASS !== "true";

    if (allowDevBypass) {
      return response;
    }

    // Sanitize open redirect: only allow relative paths starting with /
    const sanitizedRedirect = (pathname.startsWith("/") && !pathname.startsWith("//")) ? pathname : "/";
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", sanitizedRedirect);
    return createRedirect(loginUrl);
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

    // Authoritative check for WORKER lifecycle
    if (userRole === "WORKER") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: worker } = await (supabase
        .from("workers")
        .select("verification_status, account_status")
        .eq("profile_id", user.id)
        .maybeSingle() as any);

      const workerAccountStatus = worker?.account_status || "ACTIVE";
      const workerVerificationStatus = worker?.verification_status || "pending_verification";

      // If worker is deactivated or suspended/rejected:
      if (workerAccountStatus === "DEACTIVATED" || workerVerificationStatus === "suspended") {
        if (isProtectedPath) {
          const loginUrl = new URL("/login", request.url);
          loginUrl.searchParams.set("error", "account_deactivated");
          return createRedirect(loginUrl);
        }
        if (isAuthPath) {
          // Allow rendering the login page without auto-redirecting to dashboard
          return response;
        }
      }

      // If worker is pending approval:
      if (!isActive || workerVerificationStatus === "pending_verification") {
        if (isProtectedPath) {
          return createRedirect(new URL("/pending", request.url));
        }
        if (isAuthPath) {
          return createRedirect(new URL("/pending", request.url));
        }
      }
    }

    // Authoritative check for FEDERATION_ADMIN lifecycle
    if (userRole === "FEDERATION_ADMIN") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: federation } = await (supabase
        .from("federations")
        .select("status, is_active")
        .eq("contact_email", user.email)
        .maybeSingle() as any);

      const fedStatus = federation?.status || "ACTIVE";
      const isFedActive = federation?.is_active ?? true;

      // If federation is suspended or rejected:
      if (fedStatus === "REJECTED" || fedStatus === "SUSPENDED") {
        if (isProtectedPath) {
          const loginUrl = new URL("/login", request.url);
          loginUrl.searchParams.set("error", "account_deactivated");
          return createRedirect(loginUrl);
        }
        if (isAuthPath) {
          return response;
        }
      }

      // If federation is pending approval:
      if (!isActive || !isFedActive || fedStatus === "PENDING") {
        if (isProtectedPath) {
          return createRedirect(new URL("/pending", request.url));
        }
        if (isAuthPath) {
          return createRedirect(new URL("/pending", request.url));
        }
      }
    }

    // If account/profile is inactive/pending and trying to access protected routes, redirect to /pending
    if (!isActive && isProtectedPath && userRole !== "CUSTOMER") {
      return createRedirect(new URL("/pending", request.url));
    }

    const homeRoute = getRoleHomeRoute(userRole);

    if (process.env.NODE_ENV !== "production" && isProtectedPath) {
      console.log(
        `[Middleware] Path: ${pathname}, User: ${user.id}, Role: ${userRole}, Home: ${homeRoute}`
      );
    }

    // If user is accessing login/register while authenticated, redirect to their role home page
    if (isAuthPath) {
      if (!isActive && userRole !== "CUSTOMER") {
        return createRedirect(new URL("/pending", request.url));
      }
      return createRedirect(new URL(homeRoute, request.url));
    }

    // Check cross-role route permission
    if (isProtectedPath && !isRouteAllowedForRole(pathname, userRole)) {
      return createRedirect(new URL(homeRoute, request.url));
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
