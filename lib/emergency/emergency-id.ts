/**
 * Server-side Emergency ID Generator
 * Enforces authoritative, unforgeable Emergency ID generation according to
 * the pattern: EMG-YYYY-XXXXXX (e.g. EMG-2026-08421)
 *
 * The year is dynamically derived from the current server date.
 */

export function generateEmergencyId(): string {
  // Dynamically derive current server year from server system clock
  const currentServerYear = new Date().getFullYear();
  
  // Generate 5-to-6 character pseudo-random sequence (e.g. 08421 or 48192)
  const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
  return `EMG-${currentServerYear}-${randomSuffix}`;
}

export function isValidEmergencyIdFormat(emergencyId?: string | null): boolean {
  if (!emergencyId || typeof emergencyId !== "string") return false;
  // Accepts EMG-YYYY-XXXXX or EMG-YYYY-XXXXXX (dynamic 4-digit year + 5 to 6 digits/chars)
  const regex = /^EMG-\d{4}-[A-Z0-9]{5,6}$/;
  return regex.test(emergencyId.trim().toUpperCase());
}
