import { createClient } from "@/lib/supabase/client";
import { getRoleHomeRoute } from "./rbac";
import type { UserRole } from "@/supabase/types/database.types";

/**
 * Sign in user with email and password.
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

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

/**
 * Register a new Household Customer (Public Registration).
 */
export async function signUpCustomer(
  email: string,
  password: string,
  fullName: string,
  phone?: string
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role: "CUSTOMER",
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    user: data.user,
    message: "Registration successful. Please verify your email or mobile OTP.",
  };
}

/**
 * Worker registration application.
 */
export async function signUpWorker(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  federationId: string
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role: "WORKER",
        federation_id: federationId,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    user: data.user,
    redirectUrl: "/pending",
    message: "Worker application submitted. Awaiting Federation verification.",
  };
}

/**
 * Federation Admin registration workflow.
 */
export async function signUpFederationAdmin(
  email: string,
  password: string,
  fullName: string,
  federationCode: string
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "FEDERATION_ADMIN",
        federation_code: federationCode,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    user: data.user,
    redirectUrl: "/pending",
    message: "Federation application submitted for Super Admin review.",
  };
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
