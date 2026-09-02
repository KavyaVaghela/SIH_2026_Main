import type { UserRole } from "@/supabase/types/database.types";

/**
 * Standardized role checking helper.
 */
export function isRoleAllowed(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Format database timestamp into standard human-readable format.
 */
export function formatDatabaseDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}
