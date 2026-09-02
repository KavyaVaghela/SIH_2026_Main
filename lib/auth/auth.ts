import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoleHomeRoute } from "./rbac";
import type { UserRole, Database } from "@/supabase/types/database.types";

export type ProfileRecord = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Returns the authenticated Supabase user session object, or null.
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }
  return user;
}

/**
 * Returns the full user profile record from PostgreSQL database.
 */
export async function getCurrentProfile(): Promise<ProfileRecord | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }
  return profile;
}

/**
 * Resolves the authenticated user's exact role. Defaults to CUSTOMER if profile role is unset.
 */
export async function getCurrentRole(): Promise<UserRole | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  return profile.role;
}

/**
 * Server-side route guard ensuring the user is authenticated.
 * Redirects to /login if unauthenticated.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Server-side route guard restricting execution to specific roles.
 * Prevents cross-role access and redirects unauthorized users to their role home page.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  const profile = await getCurrentProfile();

  if (!profile || !allowedRoles.includes(profile.role)) {
    if (profile) {
      redirect(getRoleHomeRoute(profile.role));
    } else {
      redirect("/login");
    }
  }

  return { user, profile };
}
