export interface FormatINROptions {
  includeDecimals?: boolean;
  compact?: boolean;
}

/**
 * Formats a numeric amount as Indian Rupee (INR) currency.
 * Examples: 500 -> "₹500", 31250 -> "₹31,250", 15000000 -> "₹1.5Cr"
 */
export function formatINR(
  amount: number,
  options?: boolean | FormatINROptions
): string {
  if (isNaN(amount)) return "₹0";

  const includeDecimals = typeof options === "boolean" ? options : options?.includeDecimals ?? false;
  const compact = typeof options === "object" ? options?.compact ?? false : false;

  if (compact) {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}Lakh`;
    }
    if (Math.abs(amount) >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);
}

/**
 * Formats a decimal/fraction as percentage string.
 * Example: 5.5 -> "5.5%"
 */
export function formatPercentage(val: number, decimals = 1): string {
  if (isNaN(val)) return "0%";
  return `${val.toFixed(decimals)}%`;
}
