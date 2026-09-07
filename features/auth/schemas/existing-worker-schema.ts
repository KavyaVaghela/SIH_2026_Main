import { z } from "zod";

const indianPhoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;

export const existingWorkerSchema = z.object({
  federation_code: z
    .string()
    .min(1, "Federation code is required")
    .trim(),
  existing_worker_id: z
    .string()
    .min(1, "Existing worker ID is required")
    .trim(),
  phone: z
    .string()
    .min(1, "Registered phone number is required")
    .trim()
    .regex(indianPhoneRegex, "Please enter a valid 10-digit registered phone number"),
});

export type ExistingWorkerFormData = z.infer<typeof existingWorkerSchema>;
