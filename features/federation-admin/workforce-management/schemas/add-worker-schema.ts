import { z } from "zod";
import { validateWorkerAge } from "@/constants/banks";

export const AUTHORIZED_PROFESSIONS = [
  "Electrician",
  "Plumber",
  "Deep Cleaner",
  "Carpenter",
  "Painter",
  "Appliance Technician",
  "Mason",
  "Gardener / Landscaper",
] as const;

export const IDENTITY_DOCUMENT_TYPES = [
  "Aadhaar Card",
  "Voter ID",
  "Passport",
  "Driving License",
] as const;

export const addWorkerSchema = z.object({
  // Personal Information
  fullName: z
    .string()
    .min(3, "Full legal name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((dob) => {
      const res = validateWorkerAge(dob);
      return res.isValid;
    }, "Worker must be at least 18 years of age and not in the future"),
  gender: z.enum(["male", "female", "other"]).default("male"),
  phone: z
    .string()
    .regex(
      /^(?:\+91|0)?[6-9]\d{9}$/,
      "Enter a valid 10-digit Indian mobile number"
    ),
  email: z
    .string()
    .email("Enter a valid email address")
    .max(100, "Email cannot exceed 100 characters"),
  password: z
    .string()
    .min(8, "Worker sign-in password must be at least 8 characters"),
  memberId: z
    .string()
    .max(50, "Member ID cannot exceed 50 characters")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .min(8, "Address must be at least 8 characters long")
    .max(250, "Address cannot exceed 250 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Enter a valid 6-digit Indian PIN code")
    .optional()
    .or(z.literal(""))
    .default("380001"),

  // Professional Information
  profession: z.string().min(1, "Please select a trade profession"),
  skills: z
    .string()
    .min(3, "Please list at least one specific skill competency")
    .max(300, "Skills list cannot exceed 300 characters"),
  experienceYears: z.coerce
    .number({ invalid_type_error: "Experience must be a number" })
    .min(0, "Experience cannot be negative")
    .max(50, "Experience cannot exceed 50 years"),
  hourlyRate: z.coerce
    .number({ invalid_type_error: "Hourly rate must be a number" })
    .min(100, "Minimum authorized hourly rate is ₹100")
    .max(5000, "Hourly rate cannot exceed ₹5000"),

  // Document Information
  identityDocumentType: z.enum(IDENTITY_DOCUMENT_TYPES, {
    required_error: "Please select an identity document type",
  }),
  identityDocumentNumber: z
    .string()
    .min(4, "Document reference number must be at least 4 characters")
    .max(50, "Document number cannot exceed 50 characters"),
  professionalCertificate: z
    .string()
    .max(100, "Certificate title cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  skillCertificate: z
    .string()
    .max(100, "Certificate title cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
});

export type AddWorkerFormData = z.infer<typeof addWorkerSchema>;

