import { z } from "zod";

const indianPhoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;

export const customerRegistrationSchema = z
  .object({
    // Personal Information
    first_name: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters")
      .trim(),
    last_name: z
      .string()
      .min(1, "Last name is required")
      .min(1, "Last name must be at least 1 character")
      .max(50, "Last name cannot exceed 50 characters")
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

    // Address
    house_building: z
      .string()
      .min(1, "House or building details are required")
      .trim(),
    street_area: z
      .string()
      .min(1, "Street or area is required")
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

    // Optional
    preferred_language: z.string().trim().optional(),
    profile_photo: z.any().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type CustomerRegistrationFormData = z.infer<typeof customerRegistrationSchema>;
