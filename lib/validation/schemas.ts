import { z } from "zod";

/**
 * Validates Indian 10-digit mobile phone numbers starting with 6, 7, 8, or 9.
 */
export const mobilePhoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number");

/**
 * Validates RFC 5322 compliant email addresses.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address");

/**
 * Validates Indian 6-digit PIN codes.
 */
export const pinCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "PIN code must be exactly 6 digits");

/**
 * Validates positive numeric monetary amounts.
 */
export const positiveAmountSchema = z
  .number({ invalid_type_error: "Amount must be a number" })
  .positive("Amount must be greater than zero");

/**
 * Validates 6-digit numeric OTP codes.
 */
export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP must be a 6-digit number");

/**
 * Helper factory for non-empty string fields.
 */
export function requiredStringSchema(fieldName: string) {
  return z
    .string({ required_error: `${fieldName} is required` })
    .trim()
    .min(1, `${fieldName} cannot be empty`);
}
