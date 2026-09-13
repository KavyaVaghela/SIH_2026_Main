import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { INDIAN_IFSC_REGEX, validateWorkerAge } from "@/constants/banks";

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
      preferredLanguage,
      preferred_language,
      // Worker specific
      federationId,
      experienceYears,
      skills,
      profession,
      dateOfBirth,
      date_of_birth,
      gender,
      previousWorkDetails,
      previous_work_details,
      govtIdType,
      govt_id_type,
      govtIdNumber,
      govt_id_number,
      govtIdDocumentUrl,
      govt_id_document_url,
      bankName,
      bank_name,
      bankAccountHolder,
      bank_account_holder,
      bankAccountNumber,
      bank_account_number,
      bankIfscCode,
      bank_ifsc_code,
      avatarUrl,
      avatar_url,
      // Existing Worker specific
      federationCode,
      existingWorkerId,
      // Federation Admin specific
      registrationNumber,
      federationDetails,
    } = body;

    const supabase = createAdminClient();

    // =========================================================================
    // VALIDATIONS: WORKER & EXISTING WORKER
    // =========================================================================
    const targetDob = dateOfBirth || date_of_birth;
    if (role === "WORKER" || role === "EXISTING_WORKER") {
      if (!targetDob) {
        return NextResponse.json(
          { success: false, error: "Date of birth is required." },
          { status: 400 }
        );
      }
      const ageValidation = validateWorkerAge(targetDob);
      if (!ageValidation.isValid) {
        return NextResponse.json(
          { success: false, error: ageValidation.error || "Worker must be at least 18 years of age." },
          { status: 400 }
        );
      }

      const targetIfsc = bankIfscCode || bank_ifsc_code;
      if (targetIfsc && !INDIAN_IFSC_REGEX.test(targetIfsc.toUpperCase().trim())) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid 11-character Indian IFSC code format (e.g. SBIN0001234)." },
          { status: 400 }
        );
      }
    }

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check unique member ID for existing worker
    if (role === "EXISTING_WORKER" && existingWorkerId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingMember } = await (supabase.from("workers") as any)
        .select("id, member_id")
        .eq("member_id", existingWorkerId.trim())
        .maybeSingle();

      if (existingMember) {
        return NextResponse.json(
          { success: false, error: `A worker account with Member ID "${existingWorkerId}" is already registered.` },
          { status: 409 }
        );
      }
    }

    // =========================================================================
    // STEP: CREATE SUPABASE AUTH USER WITH AUTO-CONFIRM (NO RATE LIMIT / NO SMTP)
    // =========================================================================
    const userRole = (role === "EXISTING_WORKER" || role === "WORKER") ? "WORKER" : role;

    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || "",
        phone: phone || "",
        role: userRole,
        ...(federationId ? { federation_id: federationId } : {}),
        ...(preferredLanguage || preferred_language
          ? { preferred_language: preferredLanguage || preferred_language }
          : {}),
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
    // FLOW: CUSTOMER REGISTRATION
    // =========================================================================
    if (role === "CUSTOMER") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({
            full_name: fullName || "Customer",
            phone: phone || "",
            is_active: true,
          })
          .eq("id", userId);
      } catch (profErr) {
        console.error("Profile sync notice:", profErr);
      }

      if (addressDetails && (addressDetails.house_building || addressDetails.city || addressDetails.pincode)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("addresses") as any).insert({
            profile_id: userId,
            title: "Home",
            address_line1: addressDetails.house_building || "",
            address_line2: addressDetails.street_area || "",
            city: addressDetails.city || "",
            state: addressDetails.state || "Gujarat",
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
        redirectUrl: "/customer/dashboard",
        status: "APPROVED",
        message: "Your customer account has been created and verified successfully.",
      });
    }

    // =========================================================================
    // FLOW: NEW WORKER & EXISTING WORKER REGISTRATION
    // =========================================================================
    if (role === "WORKER" || role === "EXISTING_WORKER") {
      const isExistingWorker = role === "EXISTING_WORKER";
      const regType = isExistingWorker ? "EXISTING_WORKER" : "NEW_WORKER";
      const targetAvatar = avatarUrl || avatar_url || null;

      // 1. Mark worker profile inactive until Federation Admin approval
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({
            is_active: false,
            full_name: fullName || "Worker Applicant",
            phone: phone || "",
            ...(targetAvatar ? { avatar_url: targetAvatar } : {}),
          })
          .eq("id", userId);
      } catch (profErr) {
        console.error("Worker profile status update notice:", profErr);
      }

      // 2. Resolve Federation ID safely
      let targetFedId = federationId;
      let isValidFed = false;

      if (targetFedId && !targetFedId.startsWith("fed_")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: checkFed } = await (supabase.from("federations") as any)
          .select("id")
          .eq("id", targetFedId)
          .eq("is_active", true)
          .maybeSingle();

        if (checkFed?.id) {
          targetFedId = checkFed.id;
          isValidFed = true;
        }
      }

      if (!isValidFed && federationCode) {
        // Try resolving by federationCode
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: codeFed } = await (supabase.from("federations") as any)
          .select("id")
          .ilike("code", federationCode.trim())
          .eq("is_active", true)
          .maybeSingle();

        if (codeFed?.id) {
          targetFedId = codeFed.id;
          isValidFed = true;
        }
      }

      if (!isValidFed) {
        // Fall back to the first active federation from DB
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

      if (!targetFedId) {
        // Rollback created auth user
        await supabase.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { success: false, error: "No active cooperative federation available for worker registration." },
          { status: 400 }
        );
      }

      // 3. Insert record into public.workers (pending_verification, ACTIVE, UNAVAILABLE)
      const targetIfsc = bankIfscCode || bank_ifsc_code;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: createdWorker, error: workerErr } = await (supabase.from("workers") as any)
        .insert({
          profile_id: userId,
          federation_id: targetFedId,
          registration_type: regType,
          member_id: isExistingWorker && existingWorkerId ? existingWorkerId.trim() : null,
          verification_status: "pending_verification",
          account_status: "ACTIVE",
          availability_status: "UNAVAILABLE",
          profession: profession || (Array.isArray(skills) && skills[0]) || "Skilled Tradesperson",
          experience_years: experienceYears || (isExistingWorker ? 3 : 1),
          hourly_rate: 300,
          date_of_birth: targetDob,
          gender: gender || "male",
          previous_work_details: previousWorkDetails || previous_work_details || null,
          govt_id_type: govtIdType || govt_id_type || "aadhar",
          govt_id_number: govtIdNumber || govt_id_number || "",
          govt_id_document_url: govtIdDocumentUrl || govt_id_document_url || null,
          bank_name: bankName || bank_name || null,
          bank_account_holder: bankAccountHolder || bank_account_holder || null,
          bank_account_number: bankAccountNumber || bank_account_number || null,
          bank_ifsc_code: targetIfsc ? targetIfsc.toUpperCase().trim() : null,
        })
        .select()
        .single();

      if (workerErr) {
        console.error("Worker insert error:", workerErr);
        // Roll back the created Auth user (cascades to profile)
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (delErr) {
          console.error("Rollback Auth user deletion error:", delErr);
        }
        return NextResponse.json(
          { success: false, error: `Failed to create worker record: ${workerErr.message}` },
          { status: 400 }
        );
      }

      // 4. Insert address if details provided
      if (addressDetails && (addressDetails.house_building || addressDetails.city || addressDetails.pincode)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("addresses") as any).insert({
            profile_id: userId,
            title: "Home",
            address_line1: addressDetails.house_building || "",
            address_line2: addressDetails.street_area || "",
            city: addressDetails.city || "",
            state: addressDetails.state || "Gujarat",
            postal_code: addressDetails.pincode || "",
            is_default: true,
          });
        } catch (addrErr) {
          console.error("Worker address insert notice:", addrErr);
        }
      }

      // 5. Insert skills if specified
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
        message:
          "Your worker registration has been submitted successfully and is pending Federation Admin approval. You will be notified when your registration is reviewed. Your Worker/Member ID and account details will be available in My Profile after approval.",
      });
    }

    // =========================================================================
    // FLOW: FEDERATION ADMIN REGISTRATION
    // =========================================================================
    if (role === "FEDERATION_ADMIN") {
      try {
        // Mark Federation Admin profile inactive until Super Admin approval
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({
            full_name: fullName || "Federation Administrator",
            phone: phone || federationDetails?.official_phone || "",
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } catch (profErr) {
        console.error("Admin profile status update notice:", profErr);
      }

      if (registrationNumber) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingFed } = await (supabase.from("federations") as any)
          .select("id, name")
          .eq("registration_number", registrationNumber.trim())
          .maybeSingle();

        if (existingFed) {
          // Atomic Rollback: delete Auth user
          try {
            await supabase.auth.admin.deleteUser(userId);
          } catch (delErr) {
            console.error("Rollback user deletion error:", delErr);
          }
          return NextResponse.json(
            {
              success: false,
              error: `A federation with registration number "${registrationNumber}" is already registered (${existingFed.name}).`,
            },
            { status: 409 }
          );
        }
      }

      if (federationDetails?.federation_name) {
        const fedState = federationDetails.state || "Gujarat";
        const fedCity = federationDetails.city || "Ahmedabad";
        const statePrefix = (fedState || "IND").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
        const generatedCode = `FED-${statePrefix}-${Math.floor(100 + Math.random() * 900)}`;

        const docs = [];
        if (body.registrationCertificate || body.registration_certificate) {
          docs.push({
            title: "Cooperative Society Registration Certificate",
            url: body.registrationCertificate || body.registration_certificate,
            verified: false,
          });
        }
        if (body.governmentRegistrationDocument || body.government_registration_document) {
          docs.push({
            title: "Government Registration Document",
            url: body.governmentRegistrationDocument || body.government_registration_document,
            verified: false,
          });
        }

        // Canonical contact_email MUST match admin's login email (cleanEmail)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: fedErr } = await (supabase.from("federations") as any).insert({
          name: federationDetails.federation_name.trim(),
          code: generatedCode,
          registration_number: (registrationNumber || "").trim(),
          state: fedState,
          city: fedCity,
          address: (federationDetails.address || "Cooperative Office").trim(),
          contact_email: cleanEmail,
          contact_phone: federationDetails.official_phone || phone || "9876543210",
          service_region: federationDetails.district ? `${federationDetails.district}, ${fedState}` : `${fedCity}, ${fedState}`,
          official_documents: docs.length > 0 ? docs : null,
          status: "PENDING",
          is_active: false,
        });

        if (fedErr) {
          console.error("Federation record insertion error, rolling back auth user:", fedErr);
          try {
            await supabase.auth.admin.deleteUser(userId);
          } catch (delErr) {
            console.error("Rollback user deletion error:", delErr);
          }
          return NextResponse.json(
            { success: false, error: `Failed to create federation record: ${fedErr.message}` },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        user: { id: userId, email: cleanEmail },
        redirectUrl: "/pending",
        status: "PENDING_SUPER_ADMIN_APPROVAL",
        message: "Your Federation Admin registration has been submitted and is pending Super Admin approval.",
      });
    }

    return NextResponse.json({ success: false, error: `Invalid role specified: ${role}` }, { status: 400 });
  } catch (err: unknown) {
    console.error("Fatal registration error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
