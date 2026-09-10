import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      role,
      email,
      password,
      fullName,
      phone,
      addressDetails,
      // Worker specific
      federationId,
      experienceYears,
      skills,
      // Existing Worker specific
      federationCode,
      existingWorkerId,
      // Federation Admin specific
      registrationNumber,
      federationDetails,
    } = body;

    const supabase = createAdminClient();

    // =========================================================================
    // FLOW 1: EXISTING WORKER VERIFICATION REQUEST
    // =========================================================================
    if (role === "EXISTING_WORKER") {
      if (!federationCode || !existingWorkerId) {
        return NextResponse.json(
          { success: false, error: "Federation code and existing worker ID are required." },
          { status: 400 }
        );
      }

      // 1. Locate federation by code
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fed, error: fedErr } = await (supabase.from("federations") as any)
        .select("id, name, code")
        .ilike("code", federationCode.trim())
        .maybeSingle();

      if (fedErr || !fed) {
        return NextResponse.json(
          { success: false, error: `Federation with code "${federationCode}" was not found.` },
          { status: 404 }
        );
      }

      // 2. Locate existing worker under this federation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: worker, error: workerErr } = await (supabase.from("workers") as any)
        .select("id, profile_id, verification_status, account_status, federation_id")
        .eq("id", existingWorkerId.trim())
        .eq("federation_id", fed.id)
        .maybeSingle();

      if (workerErr || !worker) {
        return NextResponse.json(
          { success: false, error: `Worker ID "${existingWorkerId}" was not found under federation ${fed.name} (${fed.code}).` },
          { status: 404 }
        );
      }

      // 3. Create or link Auth user if email & password provided
      let authUserId = worker.profile_id;
      if (email && password) {
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
          email: email.trim().toLowerCase(),
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || "Existing Cooperative Member",
            phone: phone || "",
            role: "WORKER",
            federation_id: fed.id,
            existing_worker_id: existingWorkerId,
          },
        });

        if (authErr) {
          if (authErr.message.includes("already been registered") || authErr.message.includes("already exists")) {
            return NextResponse.json(
              { success: false, error: "An account already exists with this email. Please sign in instead.", isExistingUser: true },
              { status: 409 }
            );
          }
          return NextResponse.json({ success: false, error: authErr.message }, { status: 400 });
        }

        authUserId = authData?.user?.id;
      }

      // 4. Update the SAME existing worker record to pending_verification status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("workers") as any)
        .update({
          verification_status: "pending_verification",
          ...(authUserId ? { profile_id: authUserId } : {}),
        })
        .eq("id", worker.id);

      return NextResponse.json({
        success: true,
        federationName: fed.name,
        status: "PENDING_FEDERATION_APPROVAL",
        message: "Your verification request has been submitted to your Federation Administrator for approval.",
      });
    }

    // Common validations for new registrations
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // =========================================================================
    // STEP: CREATE SUPABASE AUTH USER WITH AUTO-CONFIRM (NO RATE LIMIT / NO SMTP)
    // =========================================================================
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || "",
        phone: phone || "",
        role,
        ...(federationId ? { federation_id: federationId } : {}),
      },
    });

    if (authErr) {
      if (
        authErr.message.includes("already been registered") ||
        authErr.message.includes("already exists") ||
        ("status" in authErr && (authErr as { status?: number }).status === 422)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "An account already exists with this email. Please sign in instead.",
            isExistingUser: true,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, error: authErr.message }, { status: 400 });
    }

    const userId = authUser.user.id;

    // =========================================================================
    // FLOW 2: CUSTOMER REGISTRATION
    // =========================================================================
    if (role === "CUSTOMER") {
      if (addressDetails && (addressDetails.house_building || addressDetails.city || addressDetails.pincode)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("addresses") as any).insert({
            profile_id: userId,
            title: "Home",
            address_line1: addressDetails.house_building || "",
            address_line2: addressDetails.street_area || "",
            city: addressDetails.city || "",
            state: addressDetails.state || "Maharashtra",
            postal_code: addressDetails.pincode || "",
            is_default: true,
          });
        } catch (addrErr) {
          console.error("Address insert notice:", addrErr);
        }
      }

      return NextResponse.json({
        success: true,
        user: { id: userId, email: cleanEmail },
        message: "Customer account created successfully! Proceed to mobile OTP verification.",
      });
    }

    // =========================================================================
    // FLOW 3: NEW WORKER REGISTRATION
    // =========================================================================
    if (role === "WORKER") {
      // 1. Resolve Federation ID
      let targetFedId = federationId;
      if (!targetFedId || targetFedId.startsWith("fed_")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: defaultFed } = await (supabase.from("federations") as any)
          .select("id")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (defaultFed?.id) {
          targetFedId = defaultFed.id;
        }
      }

      // 2. Insert record into public.workers (pending_verification, UNAVAILABLE)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: createdWorker, error: workerErr } = await (supabase.from("workers") as any)
        .insert({
          profile_id: userId,
          federation_id: targetFedId,
          verification_status: "pending_verification",
          account_status: "ACTIVE",
          availability_status: "UNAVAILABLE",
          experience_years: experienceYears || 1,
          hourly_rate: 300,
        })
        .select()
        .single();

      if (workerErr) {
        console.error("Worker insert error:", workerErr);
      }

      // 3. Insert address if details provided
      if (addressDetails && (addressDetails.house_building || addressDetails.city || addressDetails.pincode)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("addresses") as any).insert({
            profile_id: userId,
            title: "Home",
            address_line1: addressDetails.house_building || "",
            address_line2: addressDetails.street_area || "",
            city: addressDetails.city || "",
            state: addressDetails.state || "Maharashtra",
            postal_code: addressDetails.pincode || "",
            is_default: true,
          });
        } catch (addrErr) {
          console.error("Worker address insert notice:", addrErr);
        }
      }

      // 4. Insert skills if specified
      if (createdWorker?.id && Array.isArray(skills) && skills.length > 0) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: allSkills } = await (supabase.from("skills") as any).select("id, name");
          if (allSkills && allSkills.length > 0) {
            const skillInserts = skills
              .map((skillName: string) => {
                const found = (allSkills as Array<{ id: string; name: string }>).find(
                  (s) => s.name.toLowerCase() === skillName.toLowerCase()
                );
                return found ? { worker_id: createdWorker.id, skill_id: found.id, proficiency_level: "intermediate" } : null;
              })
              .filter(Boolean);

            if (skillInserts.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase.from("worker_skills") as any).insert(skillInserts);
            }
          }
        } catch (skillErr) {
          console.error("Worker skill insertion notice:", skillErr);
        }
      }

      return NextResponse.json({
        success: true,
        user: { id: userId, email: cleanEmail },
        redirectUrl: "/pending",
        status: "PENDING_FEDERATION_APPROVAL",
        message: "Your application has been submitted to the selected Federation Admin for verification.",
      });
    }

    // =========================================================================
    // FLOW 4: FEDERATION ADMIN REGISTRATION
    // =========================================================================
    if (role === "FEDERATION_ADMIN") {
      // 1. Mark the admin profile as inactive until Super Admin approval
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({ is_active: false })
          .eq("id", userId);
      } catch (profErr) {
        console.error("Admin profile status update notice:", profErr);
      }

      // 2. Check duplicate federation registration number
      if (registrationNumber) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingFed } = await (supabase.from("federations") as any)
          .select("id, name")
          .eq("registration_number", registrationNumber.trim())
          .maybeSingle();

        if (existingFed) {
          return NextResponse.json(
            {
              success: false,
              error: `A federation with registration number "${registrationNumber}" is already registered (${existingFed.name}).`,
            },
            { status: 409 }
          );
        }
      }

      // 3. Create pending federation record (is_active = false)
      if (federationDetails?.federation_name) {
        const generatedCode = `FED-${(federationDetails.state || "IND").slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("federations") as any).insert({
          name: federationDetails.federation_name,
          code: generatedCode,
          registration_number: registrationNumber || "",
          state: federationDetails.state || "Gujarat",
          city: federationDetails.city || "Ahmedabad",
          address: federationDetails.address || "Cooperative Office",
          contact_email: federationDetails.official_email || cleanEmail,
          contact_phone: federationDetails.official_phone || phone || "9876543210",
          is_active: false,
        });
      }

      return NextResponse.json({
        success: true,
        user: { id: userId, email: cleanEmail },
        redirectUrl: "/pending",
        status: "PENDING_SUPER_ADMIN_APPROVAL",
        message: "Your Federation Admin registration has been submitted and is pending Super Admin approval.",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid registration role." }, { status: 400 });
  } catch (err: unknown) {
    console.error("POST /api/auth/register error:", err);
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || "Registration service error" },
      { status: 500 }
    );
  }
}
