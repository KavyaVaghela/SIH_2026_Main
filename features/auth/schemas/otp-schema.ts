import { z } from "zod";

export const otpSchema = z.object({
  otp: z
    .string()
    .min(1, "OTP code is required")
    .length(6, "OTP code must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP code must contain numbers only")
    .trim(),
});

export type OtpFormData = z.infer<typeof otpSchema>;
