/**
 * Formats distance in kilometers.
 * Example: 2.14 -> "2.1 km"
 */
export function formatDistance(km: number): string {
  if (isNaN(km)) return "0 km";
  return `${km.toFixed(1)} km`;
}

/**
 * Formats Indian phone numbers with country code.
 * Example: "9822000001" -> "+91 98220 00001"
 */
export function formatPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Formats standard numbers with Indian numbering grouping.
 * Example: 100000 -> "1,00,000"
 */
export function formatNumber(val: number): string {
  if (isNaN(val)) return "0";
  return new Intl.NumberFormat("en-IN").format(val);
}

/**
 * Converts snake_case / CONSTANT_CASE status values into human title case labels.
 * Example: "WORKER_REVIEWING" -> "Worker Reviewing"
 */
export function formatStatusLabel(status: string): string {
  if (!status) return "";
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
