import type { UserRole } from "@/supabase/types/database.types";

export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  SUPER_ADMIN: "/super-admin",
  FEDERATION_ADMIN: "/federation-admin",
  WORKER: "/worker",
  CUSTOMER: "/customer",
};

/**
 * Returns the default home route for a given user role.
 */
export function getRoleHomeRoute(role: UserRole): string {
  return ROLE_HOME_ROUTES[role] || "/login";
}

/**
 * Determines whether a given pathname is allowed for a user role.
 * Cross-role access is strictly blocked.
 */
export function isRouteAllowedForRole(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith("/super-admin")) {
    return role === "SUPER_ADMIN";
  }

  if (pathname.startsWith("/federation-admin")) {
    return role === "FEDERATION_ADMIN" || role === "SUPER_ADMIN";
  }

  if (pathname.startsWith("/worker")) {
    return role === "WORKER" || role === "SUPER_ADMIN";
  }

  if (pathname.startsWith("/customer")) {
    return role === "CUSTOMER" || role === "SUPER_ADMIN";
  }

  // Public/Unrestricted routes (auth routes, design-system, home)
  return true;
}
