import { z } from "zod";
import { INDIAN_IFSC_REGEX, validateWorkerAge } from "@/constants/banks";

const indianPhoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;
const bankAccountRegex = /^\d{9,18}$/;

export const existingWorkerSchema = z
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
      .min(1, "Registered phone number is required")
      .trim()
      .regex(indianPhoneRegex, "Please enter a valid 10-digit registered phone number"),
    date_of_birth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((val) => {
        const { isValid } = validateWorkerAge(val);
        return isValid;
      }, {
        message: "Worker must be at least 18 years of age and DOB cannot be in the future",
      }),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
      errorMap: () => ({ message: "Please select a valid gender" }),
    }),

    // Federation & Member ID
    federation_id: z
      .string()
      .min(1, "Please select your cooperative federation")
      .trim(),
    existing_worker_id: z
      .string()
      .min(1, "Existing worker / member ID is required")
      .trim(),

    // Residential Address
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

    // Government ID
    govt_id_type: z.enum(["aadhar", "pan", "voter_id", "ration_card", "driving_license"], {
      errorMap: () => ({ message: "Please select a valid Government ID type" }),
    }),
    govt_id_number: z
      .string()
      .min(1, "Government ID number is required")
      .trim(),
    govt_id_document: z.any().optional(),

    // Bank Information
    bank_account_holder: z
      .string()
      .min(1, "Bank account holder name is required")
      .trim(),
    bank_name: z
      .string()
      .min(1, "Bank name is required")
      .trim(),
    bank_account_number: z
      .string()
      .min(1, "Bank account number is required")
      .trim()
      .regex(bankAccountRegex, "Bank account number must be between 9 and 18 digits"),
    bank_ifsc_code: z
      .string()
      .min(1, "Bank IFSC code is required")
      .trim()
      .toUpperCase()
      .regex(INDIAN_IFSC_REGEX, "Please enter a valid 11-character Indian IFSC code (e.g. SBIN0001234)"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ExistingWorkerFormData = z.infer<typeof existingWorkerSchema>;
