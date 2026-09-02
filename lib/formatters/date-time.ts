/**
 * Formats ISO date string into Indian Standard Date.
 * Example: "2026-09-02T16:00:00Z" -> "02 Sep 2026"
 */
export function formatDate(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats ISO date string into 12-hour time format.
 * Example: "2026-09-02T16:00:00Z" -> "4:00 PM"
 */
export function formatTime(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats ISO date into human-readable relative time string.
 * Example: "2 hours ago", "In 10 minutes"
 */
export function formatRelativeTime(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHours = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHours / 24);

    if (Math.abs(diffSec) < 60) return "Just now";
    if (Math.abs(diffMin) < 60) return `${Math.abs(diffMin)} mins ${diffMin < 0 ? "ago" : "from now"}`;
    if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)} hours ${diffHours < 0 ? "ago" : "from now"}`;
    return `${Math.abs(diffDays)} days ${diffDays < 0 ? "ago" : "from now"}`;
  } catch {
    return String(dateInput);
  }
}
