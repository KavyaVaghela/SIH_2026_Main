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

  // If user was created and address details were provided, insert primary home address record
  if (data?.user?.id && addressDetails && (addressDetails.house_building || addressDetails.city || addressDetails.pincode)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("addresses") as any).insert({
        profile_id: data.user.id,
        title: "Home",
        address_line1: addressDetails.house_building || "",
        address_line2: addressDetails.street_area || "",
        city: addressDetails.city || "",
        state: addressDetails.state || "Maharashtra",
        postal_code: addressDetails.pincode || "",
        is_default: true,
      });
    } catch (addrErr) {
      console.error("Address insertion notice:", addrErr);
    }
  }

  return {
    success: true,
    user: data.user,
    message: "Customer account created successfully! Proceed to mobile OTP verification.",
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
  const supabase = createClient();

  // Resolve target federation ID
  let targetFederationId = federationId;
  if (!federationId || federationId.startsWith("fed_")) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fedData } = await (supabase.from("federations") as any)
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (fedData?.id) {
        targetFederationId = fedData.id;
      }
    } catch (fedErr) {
      console.error("Federation lookup notice:", fedErr);
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role: "WORKER",
        federation_id: targetFederationId,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Ensure worker record and address are created in database
  if (data?.user?.id) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingWorker } = await (supabase.from("workers") as any)
        .select("id")
        .eq("profile_id", data.user.id)
        .maybeSingle();

      if (!existingWorker && targetFederationId && !targetFederationId.startsWith("fed_")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("workers") as any).insert({
          profile_id: data.user.id,
          federation_id: targetFederationId,
          status: "pending_verification",
          availability_status: "offline",
          experience_years: additionalDetails?.experience_years || 1,
          hourly_rate: 300,
        });
      }
    } catch (workerErr) {
      console.error("Worker record creation notice:", workerErr);
    }

    if (additionalDetails && (additionalDetails.house_building || additionalDetails.city || additionalDetails.pincode)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("addresses") as any).insert({
          profile_id: data.user.id,
          title: "Home",
          address_line1: additionalDetails.house_building || "",
          address_line2: additionalDetails.street_area || "",
          city: additionalDetails.city || "",
          state: additionalDetails.state || "Maharashtra",
          postal_code: additionalDetails.pincode || "",
          is_default: true,
        });
      } catch (addrErr) {
        console.error("Worker address insertion notice:", addrErr);
      }
    }
  }

  return {
    success: true,
    user: data.user,
    redirectUrl: "/pending",
    status: "PENDING_FEDERATION_APPROVAL",
    message: "Your application has been submitted to the selected Federation Admin for verification.",
  };
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
  const supabase = createClient();

  // 1. Validate Federation Code against database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fed, error: fedErr } = await (supabase.from("federations") as any)
    .select("id, name, code")
    .eq("code", federationCode.trim().toUpperCase())
    .maybeSingle();

  if (fedErr || !fed) {
    return {
      success: false,
      error: `Federation with code "${federationCode}" was not found. Please check your federation code.`,
    };
  }

  // 2. Locate the existing worker within that federation (DO NOT create a new/duplicate worker record!)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: worker, error: workerErr } = await (supabase.from("workers") as any)
    .select("id, profile_id, status, federation_id")
    .eq("id", existingWorkerId.trim())
    .eq("federation_id", fed.id)
    .maybeSingle();

  if (workerErr || !worker) {
    return {
      success: false,
      error: `Worker ID "${existingWorkerId}" was not found under federation ${fed.name} (${fed.code}).`,
    };
  }

  // 3. Create or link Auth user if email & password provided
  let authUser = null;
  if (email && password) {
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone,
          role: "WORKER",
          federation_id: fed.id,
          existing_worker_id: existingWorkerId,
        },
      },
    });

    if (authErr && !authErr.message.includes("User already registered")) {
      return { success: false, error: authErr.message };
    }

    authUser = authData?.user;
  }

  // 4. Update the SAME existing worker record to pending_verification status (NO duplicate worker creation!)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("workers") as any)
      .update({
        status: "pending_verification",
        ...(authUser?.id ? { profile_id: authUser.id } : {}),
      })
      .eq("id", worker.id);
  } catch (updateErr) {
    console.error("Existing worker verification update notice:", updateErr);
  }

  return {
    success: true,
    user: authUser,
    federationName: fed.name,
    status: "PENDING_FEDERATION_APPROVAL",
    message: "Your request has been submitted to the Federation Admin for verification.",
  };
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
  const supabase = createClient();

  // 1. Check duplicate federation by registration number
  if (registrationNumber) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingFed } = await (supabase.from("federations") as any)
        .select("id, name")
        .eq("registration_number", registrationNumber.trim())
        .maybeSingle();

      if (existingFed) {
        return {
          success: false,
          error: `A federation with registration number "${registrationNumber}" is already registered (${existingFed.name}).`,
        };
      }
    } catch (fedCheckErr) {
      console.error("Federation duplicate check notice:", fedCheckErr);
    }
  }

  // 2. Create Auth identity with metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "FEDERATION_ADMIN",
        registration_number: registrationNumber,
        is_active: false,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // 3. Create pending federation record if details provided (is_active = false, awaiting Super Admin approval!)
  if (data?.user?.id && federationDetails?.federation_name) {
    try {
      const generatedCode = `FED-${(federationDetails.state || "IND").slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("federations") as any).insert({
        name: federationDetails.federation_name,
        code: generatedCode,
        registration_number: registrationNumber,
        state: federationDetails.state || "Maharashtra",
        city: federationDetails.city || "Mumbai",
        address: federationDetails.address || "Cooperative Office",
        contact_email: federationDetails.official_email || email,
        contact_phone: federationDetails.official_phone || "",
        is_active: false,
      });
    } catch (createFedErr) {
      console.error("Federation creation notice:", createFedErr);
    }
  }

  return {
    success: true,
    user: data.user,
    redirectUrl: "/pending",
    status: "PENDING_SUPER_ADMIN_APPROVAL",
    message: "Your Federation Admin registration has been submitted and is pending Super Admin approval.",
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
