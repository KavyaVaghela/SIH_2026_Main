import type { SupportedLocale } from "./config";

/**
 * Format Indian Rupee currency (e.g. ₹1,500)
 */
export function formatLocalizedCurrency(
  amount: number,
  _locale: SupportedLocale = "en"
): string {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "₹0";
  }

  // Format with Indian numbering system (lakhs, crores)
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);

  return `₹${formatted}`;
}

/**
 * Format date in a clean, human-readable format according to locale
 */
export function formatLocalizedDate(
  dateInput: Date | string | number,
  locale: SupportedLocale = "en"
): string {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);

    const intlLocale = locale === "gu" ? "gu-IN" : locale === "hi" ? "hi-IN" : "en-IN";
    return new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return String(dateInput);
  }
}
