import { createClient } from "@/lib/supabase/client";
import { getRoleHomeRoute } from "./rbac";
import type { UserRole } from "@/supabase/types/database.types";
import { clearCachedProfileNames } from "./session-user";

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
    const isPlaceholderMode =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (isPlaceholderMode) {
      const lowerEmail = email.toLowerCase().trim();
      let role: UserRole = "CUSTOMER";
      if (lowerEmail.includes("admin") && !lowerEmail.includes("federation")) {
        role = "SUPER_ADMIN";
      } else if (lowerEmail.includes("federation")) {
        role = "FEDERATION_ADMIN";
      } else if (lowerEmail.includes("worker")) {
        role = "WORKER";
      } else {
        role = "CUSTOMER";
      }

      const redirectUrl = getRoleHomeRoute(role);
      return {
        success: true,
        redirectUrl,
        user: { id: "dev-mock-user-id", email: lowerEmail },
        role,
      };
    }

    return { success: false, error: error.message };
  }

  if (data?.user) {
    if (data.session) {
      try {
        await supabase.auth.setSession(data.session);
      } catch (sessErr) {
        console.warn("Notice: setSession in signInWithEmail:", sessErr);
      }
    }

    // Fetch role & active status from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", data.user.id)
      .single();

    const metaRole = (data.user.user_metadata?.role as UserRole) || undefined;
    const role: UserRole =
      (profile as { role?: UserRole; is_active?: boolean } | null)?.role ||
      metaRole ||
      "CUSTOMER";
    const isActive: boolean =
      (profile as { role?: UserRole; is_active?: boolean } | null)?.is_active ??
      (role === "CUSTOMER" ? true : false);

    // Authoritative check for WORKER lifecycle
    if (role === "WORKER") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: worker } = await (supabase.from("workers") as any)
        .select("verification_status, account_status")
        .eq("profile_id", data.user.id)
        .maybeSingle();

      const accountStatus = worker?.account_status || (!isActive ? "DEACTIVATED" : "ACTIVE");
      const verificationStatus = worker?.verification_status || "pending_verification";

      // 1. DEACTIVATED: block login completely, destroy session
      if (accountStatus === "DEACTIVATED") {
        await supabase.auth.signOut();
        return {
          success: false,
          error: "Your worker account has been deactivated. Please contact your cooperative federation administrator.",
        };
      }

      // 2. SUSPENDED / REJECTED: block login completely, destroy session
      if (verificationStatus === "suspended") {
        await supabase.auth.signOut();
        return {
          success: false,
          error: "Your worker application was declined or your verification has been suspended.",
        };
      }

      // 3. PENDING: not allowed to access /worker dashboard; use /pending
      if (verificationStatus === "pending_verification" || !isActive) {
        return {
          success: true,
          redirectUrl: "/pending",
          user: data.user,
          role,
        };
      }

      // 4. ACTIVE + VERIFIED: allow normal worker dashboard access
      return {
        success: true,
        redirectUrl: "/worker/dashboard",
        user: data.user,
        role,
      };
    }

    // Authoritative check for FEDERATION_ADMIN lifecycle
    if (role === "FEDERATION_ADMIN") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: federation } = await (supabase.from("federations") as any)
        .select("status, is_active, rejection_reason")
        .eq("contact_email", lowerEmail)
        .maybeSingle();

      const fedStatus = federation?.status || (!isActive ? "PENDING" : "ACTIVE");

      // 1. REJECTED: block login completely, destroy session
      if (fedStatus === "REJECTED") {
        await supabase.auth.signOut();
        const reasonSuffix = federation?.rejection_reason ? `: ${federation.rejection_reason}` : ".";
        return {
          success: false,
          error: `Your cooperative federation registration was declined by the platform administration${reasonSuffix}`,
        };
      }

      // 2. SUSPENDED: block login completely, destroy session
      if (fedStatus === "SUSPENDED") {
        await supabase.auth.signOut();
        return {
          success: false,
          error: "Your cooperative federation account has been suspended. Please contact platform administration.",
        };
      }

      // 3. PENDING: not allowed to access /federation-admin dashboard; direct to /pending
      if (fedStatus === "PENDING" || !isActive || !federation?.is_active) {
        return {
          success: true,
          redirectUrl: "/pending",
          user: data.user,
          role,
        };
      }

      // 4. ACTIVE: allow normal federation admin dashboard access
      return {
        success: true,
        redirectUrl: "/federation-admin",
        user: data.user,
        role,
      };
    }

    // Inactive non-customer role is directed to /pending
    let redirectUrl = getRoleHomeRoute(role);
    if (!isActive && role !== "CUSTOMER") {
      redirectUrl = "/pending";
    }

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
  },
  preferredLanguage?: string
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
        preferredLanguage,
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
    profession?: string;
    date_of_birth?: string;
    gender?: string;
    previous_work_details?: string;
    govt_id_type?: string;
    govt_id_number?: string;
    govt_id_document_url?: string;
    bank_name?: string;
    bank_account_holder?: string;
    bank_account_number?: string;
    bank_ifsc_code?: string;
    avatar_url?: string;
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
        profession: additionalDetails?.profession,
        dateOfBirth: additionalDetails?.date_of_birth,
        gender: additionalDetails?.gender,
        previousWorkDetails: additionalDetails?.previous_work_details,
        govtIdType: additionalDetails?.govt_id_type,
        govtIdNumber: additionalDetails?.govt_id_number,
        govtIdDocumentUrl: additionalDetails?.govt_id_document_url,
        bankName: additionalDetails?.bank_name,
        bankAccountHolder: additionalDetails?.bank_account_holder,
        bankAccountNumber: additionalDetails?.bank_account_number,
        bankIfscCode: additionalDetails?.bank_ifsc_code,
        avatarUrl: additionalDetails?.avatar_url,
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
 * Existing Worker Verification and Account Registration Request.
 */
export async function verifyExistingWorker(
  phone: string,
  federationCode: string,
  existingWorkerId: string,
  email?: string,
  password?: string,
  additionalDetails?: {
    fullName?: string;
    federationId?: string;
    date_of_birth?: string;
    gender?: string;
    house_building?: string;
    street_area?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
    govt_id_type?: string;
    govt_id_number?: string;
    govt_id_document_url?: string;
    bank_name?: string;
    bank_account_holder?: string;
    bank_account_number?: string;
    bank_ifsc_code?: string;
    avatar_url?: string;
  }
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
        fullName: additionalDetails?.fullName,
        federationId: additionalDetails?.federationId,
        dateOfBirth: additionalDetails?.date_of_birth,
        gender: additionalDetails?.gender,
        govtIdType: additionalDetails?.govt_id_type,
        govtIdNumber: additionalDetails?.govt_id_number,
        govtIdDocumentUrl: additionalDetails?.govt_id_document_url,
        bankName: additionalDetails?.bank_name,
        bankAccountHolder: additionalDetails?.bank_account_holder,
        bankAccountNumber: additionalDetails?.bank_account_number,
        bankIfscCode: additionalDetails?.bank_ifsc_code,
        avatarUrl: additionalDetails?.avatar_url,
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
    return { success: false, error: (err as Error)?.message || "Existing worker registration failed." };
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
  },
  phone?: string,
  documents?: {
    registrationCertificate?: string;
    governmentRegistrationDocument?: string;
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
        phone,
        registrationNumber,
        federationDetails,
        registrationCertificate: documents?.registrationCertificate,
        governmentRegistrationDocument: documents?.governmentRegistrationDocument,
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
  clearCachedProfileNames();
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, redirectUrl: "/" };
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
