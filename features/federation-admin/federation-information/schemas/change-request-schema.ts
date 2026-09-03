import { z } from "zod";

export const changeRequestFieldOptions = [
  { value: "name", label: "Federation Official Name" },
  { value: "registrationNumber", label: "Statutory Registration Number" },
  { value: "address", label: "Registered Office Address" },
  { value: "serviceRegion", label: "Service Area & Operating Jurisdiction" },
  { value: "contactEmail", label: "Official Communications Email" },
  { value: "contactPhone", label: "Official Contact Telephone" },
  { value: "officialDocuments", label: "Official Bylaws & Statutory Documents" },
] as const;

export const changeRequestSchema = z
  .object({
    field: z.enum(
      [
        "name",
        "registrationNumber",
        "address",
        "serviceRegion",
        "contactEmail",
        "contactPhone",
        "officialDocuments",
      ],
      {
        required_error: "Please select an official field to change",
      }
    ),
    currentValue: z.string().min(1, "Current value is required for comparison"),
    requestedValue: z
      .string()
      .min(3, "Requested value must be at least 3 characters long")
      .max(500, "Requested value cannot exceed 500 characters"),
    reason: z
      .string()
      .min(10, "Please provide a substantive rationale (at least 10 characters)")
      .max(1000, "Reason cannot exceed 1000 characters"),
    supportingDocumentNote: z
      .string()
      .max(300, "Document reference cannot exceed 300 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => data.currentValue.trim().toLowerCase() !== data.requestedValue.trim().toLowerCase(),
    {
      message: "Requested value must be different from current official value",
      path: ["requestedValue"],
    }
  );

export type ChangeRequestFormData = z.infer<typeof changeRequestSchema>;
