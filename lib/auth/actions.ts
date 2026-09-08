import { createClient } from "@/lib/supabase/client";
import { getRoleHomeRoute } from "./rbac";
import type { UserRole } from "@/supabase/types/database.types";

/**
 * Sign in user with email and password.
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  const lowerEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: lowerEmail,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.user) {
    // Fetch role from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role: UserRole = (profile as { role?: UserRole } | null)?.role || "CUSTOMER";
    const redirectUrl = getRoleHomeRoute(role);

    return { success: true, redirectUrl, user: data.user, role };
  }

  return { success: false, error: "Authentication failed. Please try again." };
}

/**
 * Register a new Household Customer (Public Registration).
 */
export async function signUpCustomer(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  addressDetails?: {
    house_building?: string;
    street_area?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  }
) {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "CUSTOMER",
        email,
        password,
        fullName,
        phone,
        addressDetails,
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await res.json();
    return result;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || "Customer registration request failed." };
  }
}

/**
 * Worker registration application.
 */
export async function signUpWorker(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  federationId: string,
  additionalDetails?: {
    house_building?: string;
    street_area?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
    experience_years?: number;
    skills?: string[];
  }
) {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "WORKER",
        email,
        password,
        fullName,
        phone,
        federationId,
        experienceYears: additionalDetails?.experience_years,
        skills: additionalDetails?.skills,
        addressDetails: {
          house_building: additionalDetails?.house_building,
          street_area: additionalDetails?.street_area,
          city: additionalDetails?.city,
          district: additionalDetails?.district,
          state: additionalDetails?.state,
          pincode: additionalDetails?.pincode,
        },
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await res.json();
    return result;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || "Worker registration request failed." };
  }
}

/**
 * Existing Worker Verification Request.
 */
export async function verifyExistingWorker(
  phone: string,
  federationCode: string,
  existingWorkerId: string,
  email?: string,
  password?: string
) {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "EXISTING_WORKER",
        phone,
        federationCode,
        existingWorkerId,
        email,
        password,
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await res.json();
    return result;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || "Existing worker verification failed." };
  }
}

/**
 * Federation Admin registration workflow.
 */
export async function signUpFederationAdmin(
  email: string,
  password: string,
  fullName: string,
  registrationNumber: string,
  federationDetails?: {
    federation_name?: string;
    address?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
    official_email?: string;
    official_phone?: string;
  }
) {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "FEDERATION_ADMIN",
        email,
        password,
        fullName,
        registrationNumber,
        federationDetails,
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await res.json();
    return result;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || "Federation admin registration failed." };
  }
}

/**
 * Verify OTP code for phone/email verification.
 */
export async function verifyOTP(emailOrPhone: string, token: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: emailOrPhone,
    token,
    type: "signup",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

/**
 * Sign out current user.
 */
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, redirectUrl: "/login" };
}

/**
 * Update password for current authenticated user.
 */
export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: "Password updated successfully." };
}
