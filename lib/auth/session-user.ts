/**
 * Session-based user profile cache for instantaneous, non-flickering greeting renders.
 * Ensures the authenticated user's real name is displayed from the first frame
 * without ever showing a generic role fallback like "Worker" or "Customer".
 */

const GENERIC_ROLE_NAMES = new Set([
  "worker",
  "customer",
  "admin",
  "super admin",
  "federation admin",
  "user",
  "worker member",
  "tradesperson",
]);

export function getCachedProfileName(role: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const val = sessionStorage.getItem(`kaushalyasetu_name_${role.toLowerCase()}`);
    if (!val) return null;
    const trimmed = val.trim();
    if (GENERIC_ROLE_NAMES.has(trimmed.toLowerCase())) {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}

export function setCachedProfileName(role: string, name: string): void {
  if (typeof window === "undefined" || !name) return;
  try {
    const clean = name.trim();
    if (clean && !GENERIC_ROLE_NAMES.has(clean.toLowerCase())) {
      sessionStorage.setItem(`kaushalyasetu_name_${role.toLowerCase()}`, clean);
    }
  } catch {
    // Ignore storage quota or access errors
  }
}

export function clearCachedProfileNames(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("kaushalyasetu_name_worker");
    sessionStorage.removeItem("kaushalyasetu_name_customer");
    sessionStorage.removeItem("kaushalyasetu_name_federation_admin");
    sessionStorage.removeItem("kaushalyasetu_name_super_admin");
  } catch {
    // Ignore storage errors
  }
}
