import { z } from "zod";

const indianPhoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const bankAccountRegex = /^\d{9,18}$/;

export const newWorkerSchema = z
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
    date_of_birth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((val) => !isNaN(Date.parse(val)), "Please enter a valid date")
      .refine((val) => {
        const dob = new Date(val);
        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        return age >= 18;
      }, "Worker must be at least 18 years of age"),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
      errorMap: () => ({ message: "Please select a valid gender" }),
    }),
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

    // Federation
    federation_id: z
      .string()
      .min(1, "Please select your cooperative federation")
      .trim(),

    // Professional
    primary_skill_category_id: z
      .string()
      .min(1, "Primary skill category is required")
      .trim(),
    skills: z
      .array(z.string())
      .min(1, "Please select at least one specific skill"),
    experience_years: z
      .number({
        invalid_type_error: "Experience years must be a number",
      })
      .min(0, "Experience years cannot be negative")
      .max(60, "Please enter a valid experience duration"),
    previous_work_details: z.string().trim().optional(),

    // Identity Verification
    govt_id_type: z.enum(["aadhar", "pan", "voter_id", "ration_card", "driving_license"], {
      errorMap: () => ({ message: "Please select a valid Government ID type" }),
    }),
    govt_id_number: z
      .string()
      .min(1, "Government ID number is required")
      .trim(),
    govt_id_document: z
      .any()
      .refine((file) => file !== null && file !== undefined && file !== "", {
        message: "Government ID document is required",
      }),

    // Payment Information
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
      .regex(ifscRegex, "Please enter a valid 11-character Indian IFSC code (e.g. SBIN0001234)"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type NewWorkerFormData = z.infer<typeof newWorkerSchema>;
