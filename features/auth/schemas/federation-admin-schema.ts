import { z } from "zod";

const indianPhoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;

export const federationAdminSchema = z
  .object({
    // Personal Information
    first_name: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters")
      .trim(),
    last_name: z
      .string()
      .min(1, "Last name is required")
      .trim(),
    email: z
      .string()
      .min(1, "Email address is required")
      .email("Please enter a valid email address")
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirm_password: z
      .string()
      .min(1, "Please confirm your password"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .trim()
      .regex(indianPhoneRegex, "Please enter a valid 10-digit mobile number"),
    profile_photo: z.any().optional(),

    // Federation Information
    federation_name: z
      .string()
      .min(1, "Federation name is required")
      .trim(),
    registration_number: z
      .string()
      .min(1, "Federation registration number is required")
      .trim(),
    address: z
      .string()
      .min(1, "Federation address is required")
      .trim(),
    city: z
      .string()
      .min(1, "City is required")
      .trim(),
    district: z
      .string()
      .min(1, "District is required")
      .trim(),
    state: z
      .string()
      .min(1, "State is required")
      .trim(),
    pincode: z
      .string()
      .min(1, "Pincode is required")
      .trim()
      .regex(pincodeRegex, "Pincode must be a valid 6-digit number"),

    // Official Contact
    official_email: z
      .string()
      .min(1, "Official email address is required")
      .email("Please enter a valid official email address")
      .trim()
      .toLowerCase(),
    official_phone: z
      .string()
      .min(1, "Official phone number is required")
      .trim()
      .regex(indianPhoneRegex, "Please enter a valid official phone number"),

    // Documents
    registration_certificate: z
      .any()
      .refine((file) => file !== null && file !== undefined && file !== "", {
        message: "Federation registration certificate is required",
      }),
    government_registration_document: z.any().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type FederationAdminFormData = z.infer<typeof federationAdminSchema>;
