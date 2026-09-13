/**
 * Centralized list of recognized Indian banking institutions for worker payouts.
 */
export const MAJOR_INDIAN_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Axis Bank",
  "Canara Bank",
  "Union Bank of India",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Bank of India",
  "Central Bank of India",
  "Indian Bank",
  "IDBI Bank",
  "Yes Bank",
] as const;

export type MajorBankName = (typeof MAJOR_INDIAN_BANKS)[number];

/**
 * Standard Indian Financial System Code (IFSC) regex:
 * 4 letters + 0 + 6 alphanumeric characters.
 * Example: SBIN0001234, HDFC0000128
 */
export const INDIAN_IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Validates that the provided Date of Birth represents a person at least 18 years old today,
 * and strictly rejects future dates.
 *
 * @param dateStr ISO date string (YYYY-MM-DD)
 * @returns true if valid birthdate for age >= 18, false otherwise
 */
export function validateWorkerAge(dateStr: string): {
  isValid: boolean;
  error?: string;
} {
  if (!dateStr || typeof dateStr !== "string") {
    return { isValid: false, error: "Date of birth is required" };
  }

  const dob = new Date(dateStr);
  if (isNaN(dob.getTime())) {
    return { isValid: false, error: "Please enter a valid date" };
  }

  const today = new Date();
  // Reset time components for accurate date-only comparison
  today.setHours(0, 0, 0, 0);
  dob.setHours(0, 0, 0, 0);

  if (dob > today) {
    return { isValid: false, error: "Date of birth cannot be in the future" };
  }

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  if (age < 18) {
    return { isValid: false, error: "Worker must be at least 18 years of age" };
  }

  return { isValid: true };
}
