import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { validateWorkerAge } from "@/constants/banks";

// Helper to look up a worker by either primary key UUID or member_id
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findWorker(client: any, idOrMemberId: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrMemberId);
  if (isUuid) {
    const { data } = await client.from("workers").select("*").eq("id", idOrMemberId).maybeSingle();
    if (data) return data;
  }
  const { data } = await client.from("workers").select("*").eq("member_id", idOrMemberId).maybeSingle();
  return data;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, workerId, status, rejectionReason } = body;
    const adminClient = createAdminClient();

    // -------------------------------------------------------------
    // 1. STRICT AUTHENTICATION & ROLE AUTHORIZATION (TASK 5)
    // -------------------------------------------------------------
    const serverClient = createServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required to access workforce management." },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: callerProfile } = await (adminClient.from("profiles") as any)
      .select("role, email")
      .eq("id", user.id)
      .maybeSingle();

    const callerRole = callerProfile?.role || null;

    if (callerRole !== "FEDERATION_ADMIN" && callerRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to manage workforce operations." },
        { status: 403 }
      );
    }

    let adminFedId: string | null = null;
    let adminFedCode: string = "FED-AMD-01";

    if (callerRole === "FEDERATION_ADMIN") {
      // Authoritatively resolve federation where contact_email matches caller's email
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fedByEmail } = await (adminClient.from("federations") as any)
        .select("id, code, is_active")
        .eq("contact_email", user.email || callerProfile?.email)
        .maybeSingle();

      if (!fedByEmail || !fedByEmail.is_active) {
        return NextResponse.json(
          { error: "Forbidden: No active cooperative federation associated with your administrator account." },
          { status: 403 }
        );
      }

      adminFedId = fedByEmail.id;
      adminFedCode = fedByEmail.code;
    } else if (callerRole === "SUPER_ADMIN") {
      // Super Admin can optionally target a specific federation or default
      if (body.federationId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: fedById } = await (adminClient.from("federations") as any)
          .select("id, code")
          .eq("id", body.federationId)
          .maybeSingle();

        if (fedById) {
          adminFedId = fedById.id;
          adminFedCode = fedById.code;
        }
      }

      if (!adminFedId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: defaultFed } = await (adminClient.from("federations") as any)
          .select("id, code")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (defaultFed) {
          adminFedId = defaultFed.id;
          adminFedCode = defaultFed.code;
        }
      }
    }

    if (!adminFedId) {
      return NextResponse.json(
        { error: "Unable to resolve target cooperative federation." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // ACTION: CREATE (TASK 2 — FEDERATION ADMIN MANUAL ADD WORKER)
    // -------------------------------------------------------------
    if (action === "create") {
      const {
        fullName,
        email,
        password,
        phone,
        dateOfBirth,
        gender,
        address,
        city,
        state,
        pincode,
        postal_code,
        profession,
        skills,
        experienceYears,
        hourlyRate,
        identityDocumentType,
        identityDocumentNumber,
        professionalCertificate,
        skillCertificate,
        memberId,
        avatarUrl,
        avatar_url,
      } = body;

      // 1. Mandatory field checks
      if (!fullName || !email || !password || !phone || !dateOfBirth || !profession) {
        return NextResponse.json(
          { error: "Missing required fields: fullName, email, password, phone, dateOfBirth, and profession are required." },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters in length." },
          { status: 400 }
        );
      }

      // 2. Date of birth / age validation (>= 18 years)
      const ageValidation = validateWorkerAge(dateOfBirth);
      if (!ageValidation.isValid) {
        return NextResponse.json({ error: ageValidation.error }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();

      // 3. Duplicate email verification
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingProfile } = await (adminClient.from("profiles") as any)
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 400 }
        );
      }

      // 4. Resolve / generate unique member_id
      const fedPrefix = (adminFedCode || "FED-AMD-01")
        .replace(/^FED-/, "")
        .replace(/-\d+$/, "")
        .replace(/[^A-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 4);

      let finalMemberId = memberId?.trim() || "";

      if (finalMemberId) {
        // Validate uniqueness of provided memberId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingWorkerMember } = await (adminClient.from("workers") as any)
          .select("id")
          .eq("member_id", finalMemberId)
          .maybeSingle();

        if (existingWorkerMember) {
          return NextResponse.json(
            { error: `Member ID "${finalMemberId}" is already assigned to another worker.` },
            { status: 400 }
          );
        }
      } else {
        // Generate unique memberId server-side
        let attempts = 0;
        while (attempts < 10) {
          attempts++;
          const candidate = `WRK-${fedPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: existing } = await (adminClient.from("workers") as any)
            .select("id")
            .eq("member_id", candidate)
            .maybeSingle();

          if (!existing) {
            finalMemberId = candidate;
            break;
          }
        }

        if (!finalMemberId) {
          finalMemberId = `WRK-${fedPrefix}-${Date.now().toString().slice(-4)}`;
        }
      }

      // 5. Create new Supabase Auth user (authoritative password handling)
      const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          role: "WORKER",
          full_name: fullName.trim(),
          phone: phone.trim(),
          federation_id: adminFedId,
        },
      });

      if (authErr || !authUser.user) {
        return NextResponse.json(
          { error: authErr?.message || "Failed to create Supabase Auth user." },
          { status: 400 }
        );
      }

      const newUserId = authUser.user.id;

      // 6. Synchronize profile (role = WORKER, is_active = true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient.from("profiles") as any).upsert({
        id: newUserId,
        role: "WORKER",
        full_name: fullName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        avatar_url: avatarUrl || avatar_url || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      });

      // 7. Insert authoritative worker record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newWorker, error: workerErr } = await (adminClient.from("workers") as any)
        .insert({
          profile_id: newUserId,
          federation_id: adminFedId,
          member_id: finalMemberId,
          profession: profession.trim(),
          hourly_rate: Number(hourlyRate) || 350,
          experience_years: Number(experienceYears) || 0,
          account_status: "ACTIVE",
          verification_status: "verified",
          availability_status: "AVAILABLE",
          registration_type: "EXISTING_WORKER",
          date_of_birth: dateOfBirth,
          gender: gender || "male",
          govt_id_type: identityDocumentType || "Aadhaar Card",
          govt_id_number: identityDocumentNumber || "",
        })
        .select()
        .single();

      if (workerErr || !newWorker) {
        // ATOMIC ROLLBACK: Delete newly created Auth user
        console.error("Worker record insert failed, rolling back auth user:", workerErr);
        try {
          await adminClient.auth.admin.deleteUser(newUserId);
        } catch (delErr) {
          console.error("Rollback user deletion error:", delErr);
        }
        return NextResponse.json(
          { error: `Failed to create worker record: ${workerErr?.message || "Unknown database error"}` },
          { status: 500 }
        );
      }

      // 8. Insert address with correct postal_code column (CRITICAL FIX FOR SCHEMA INTEGRITY)
      const targetPostalCode = (pincode || postal_code || "380001").toString().trim();
      if (address) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (adminClient.from("addresses") as any).insert({
            profile_id: newUserId,
            title: "Home",
            address_line1: address.trim(),
            city: (city || "Ahmedabad").trim(),
            state: (state || "Gujarat").trim(),
            postal_code: targetPostalCode,
            is_default: true,
          });
        } catch (addrErr) {
          console.warn("Notice: Worker address insertion:", addrErr);
        }
      }

      // 9. Dynamic Skills Persistence (TASK 3 & 4)
      if (skills) {
        try {
          const skillNames = skills.split(",").map((s: string) => s.trim()).filter(Boolean);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: dbSkills } = await (adminClient.from("skills") as any).select("id, name");
          for (const sName of skillNames) {
            const matched = dbSkills?.find(
              (s: { id: string; name: string }) => s.name.toLowerCase() === sName.toLowerCase()
            );
            let skillId = matched?.id;
            if (!skillId) {
              // Dynamically insert new skill into catalog
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: newSkill } = await (adminClient.from("skills") as any)
                .insert({ name: sName, description: `${sName} service competency` })
                .select("id")
                .single();
              skillId = newSkill?.id;
            }
            if (skillId) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (adminClient.from("worker_skills") as any).insert({
                worker_id: newWorker.id,
                skill_id: skillId,
                proficiency_level: "intermediate",
              });
            }
          }
        } catch (skillErr) {
          console.warn("Notice: Worker skill insertion:", skillErr);
        }
      }

      // 10. Dynamic Certifications Persistence (TASK 3 & 4)
      const certTitles = [professionalCertificate, skillCertificate]
        .map((c) => (c ? c.trim() : ""))
        .filter(Boolean);

      if (certTitles.length > 0) {
        try {
          for (const certTitle of certTitles) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingCert } = await (adminClient.from("certifications") as any)
              .select("id")
              .ilike("title", certTitle)
              .maybeSingle();

            let certId = existingCert?.id;
            if (!certId) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: createdCert } = await (adminClient.from("certifications") as any)
                .insert({
                  title: certTitle,
                  issuing_body: "Cooperative Trade Council",
                  validity_months: 36,
                })
                .select("id")
                .single();
              certId = createdCert?.id;
            }

            if (certId) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (adminClient.from("worker_certifications") as any).insert({
                worker_id: newWorker.id,
                certification_id: certId,
                certificate_number: `CERT-${Date.now().toString().slice(-6)}`,
                issue_date: new Date().toISOString().split("T")[0],
                status: "VERIFIED",
                is_verified: true,
                verification_date: new Date().toISOString(),
              });
            }
          }
        } catch (certErr) {
          console.warn("Notice: Worker certification insertion:", certErr);
        }
      }

      // 11. Realtime Broadcast Notification (TASK 1)
      try {
        const channel = adminClient.channel("federation-workforce");
        await channel.send({
          type: "broadcast",
          event: "workforce_updated",
          payload: {
            action: "create",
            federationId: adminFedId,
            workerId: newWorker.id,
            timestamp: Date.now(),
          },
        });
      } catch (bcErr) {
        console.warn("Broadcast notice:", bcErr);
      }

      return NextResponse.json({
        success: true,
        worker: {
          id: newWorker.id,
          memberId: finalMemberId,
          fullName: fullName.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          avatarUrl: avatarUrl || avatar_url || null,
          profession: newWorker.profession,
          hourlyRate: newWorker.hourly_rate,
          experienceYears: newWorker.experience_years,
          accountStatus: "ACTIVE",
          availabilityStatus: "AVAILABLE",
          verificationStatus: "verified",
        },
        message: `Worker ${fullName.trim()} inducted successfully into federation roster with Active account status.`,
      });
    }

    // -------------------------------------------------------------
    // ACTIONS: ACCEPT, REJECT, STATUS (REQUIRE workerId)
    // -------------------------------------------------------------
    if (!workerId) {
      return NextResponse.json({ error: "Missing workerId" }, { status: 400 });
    }

    // Lookup worker by id or member_id
    const currentWorker = await findWorker(adminClient, workerId);
    if (!currentWorker) {
      return NextResponse.json({ error: "Worker not found in database." }, { status: 404 });
    }

    // Federation Isolation Check (TASK 5)
    if (callerRole === "FEDERATION_ADMIN" && currentWorker.federation_id !== adminFedId) {
      return NextResponse.json(
        { error: "Unauthorized: You do not have permission to manage workers from another federation." },
        { status: 403 }
      );
    }

    // ACTION: ACCEPT
    if (action === "accept") {
      let finalMemberId = currentWorker.member_id;
      if (!finalMemberId || finalMemberId.trim() === "") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: fed } = await (adminClient.from("federations") as any)
          .select("code")
          .eq("id", currentWorker.federation_id)
          .maybeSingle();

        const prefix = (fed?.code || adminFedCode)
          .replace(/^FED-/, "")
          .replace(/-\d+$/, "")
          .replace(/[^A-Z0-9]/g, "")
          .toUpperCase()
          .slice(0, 4);

        let attempts = 0;
        while (attempts < 10) {
          attempts++;
          const candidate = `WRK-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: existing } = await (adminClient.from("workers") as any)
            .select("id")
            .eq("member_id", candidate)
            .maybeSingle();

          if (!existing) {
            finalMemberId = candidate;
            break;
          }
        }

        finalMemberId = finalMemberId || `WRK-${prefix}-${Date.now().toString().slice(-4)}`;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: worker, error: workerErr } = await (adminClient.from("workers") as any)
        .update({
          member_id: finalMemberId,
          verification_status: "verified",
          account_status: "ACTIVE",
          availability_status: "AVAILABLE",
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentWorker.id)
        .select(`
          id,
          profile_id,
          member_id,
          hourly_rate,
          experience_years,
          account_status,
          availability_status,
          verification_status,
          profiles:profile_id (
            id,
            full_name,
            email,
            phone
          )
        `)
        .maybeSingle();

      if (workerErr) {
        console.error("Failed to approve worker in database:", workerErr);
        return NextResponse.json({ error: workerErr.message }, { status: 500 });
      }

      // Synchronize profile is_active = true
      if (currentWorker.profile_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from("profiles") as any)
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentWorker.profile_id);
      }

      // Broadcast update on both channels
      try {
        const channel = adminClient.channel("federation-workforce");
        await channel.send({
          type: "broadcast",
          event: "workforce_updated",
          payload: { action: "accept", federationId: currentWorker.federation_id, workerId: currentWorker.id },
        });
      } catch (bcErr) {
        console.warn("Broadcast notice (federation-workforce):", bcErr);
      }
      try {
        const broadcastChannel = adminClient.channel("federation-workforce-updates");
        await broadcastChannel.send({
          type: "broadcast",
          event: "WORKER_ACCEPTED",
          payload: { workerId: currentWorker.id, memberId: finalMemberId },
        });
      } catch {
        // Broadcast failure non-fatal
      }

      return NextResponse.json({ success: true, worker, memberId: finalMemberId });
    }

    // ACTION: REJECT
    if (action === "reject") {
      const reason = rejectionReason || body.rejection_reason || "Application declined by federation administrator";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: workerErr } = await (adminClient.from("workers") as any)
        .update({
          verification_status: "suspended",
          account_status: "DEACTIVATED",
          availability_status: "UNAVAILABLE",
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentWorker.id)
        .select("id, profile_id, rejection_reason")
        .maybeSingle();

      if (workerErr) {
        console.error("Failed to reject worker in database:", workerErr);
        return NextResponse.json({ error: workerErr.message }, { status: 500 });
      }

      if (currentWorker.profile_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from("profiles") as any)
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentWorker.profile_id);
      }

      // Broadcast update on both channels
      try {
        const channel = adminClient.channel("federation-workforce");
        await channel.send({
          type: "broadcast",
          event: "workforce_updated",
          payload: { action: "reject", federationId: currentWorker.federation_id, workerId: currentWorker.id },
        });
      } catch (bcErr) {
        console.warn("Broadcast notice (federation-workforce):", bcErr);
      }
      try {
        const broadcastChannel = adminClient.channel("federation-workforce-updates");
        await broadcastChannel.send({
          type: "broadcast",
          event: "WORKER_REJECTED",
          payload: { workerId: currentWorker.id, rejectionReason: reason },
        });
      } catch {
        // Broadcast failure non-fatal
      }

      return NextResponse.json({ success: true, applicationId: currentWorker.id, rejectionReason: reason });
    }

    // ACTION: STATUS (TASK 6 — DEACTIVATE / REACTIVATE)
    if (action === "status") {
      if (!status || (status !== "ACTIVE" && status !== "DEACTIVATED")) {
        return NextResponse.json(
          { error: 'Invalid status. Status must be "ACTIVE" or "DEACTIVATED".' },
          { status: 400 }
        );
      }

      // Only allow reactivation if workers.verification_status = verified
      if (status === "ACTIVE" && currentWorker.verification_status !== "verified") {
        return NextResponse.json(
          {
            error:
              "Cannot activate worker: Only workers with verified verification_status can be set to ACTIVE.",
          },
          { status: 400 }
        );
      }

      // Update worker account_status.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: workerErr } = await (adminClient.from("workers") as any)
        .update({
          account_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentWorker.id)
        .select("id, profile_id, account_status, verification_status")
        .maybeSingle();

      if (workerErr) {
        console.error("Failed to update worker account status:", workerErr);
        return NextResponse.json({ error: workerErr.message }, { status: 500 });
      }

      // Synchronize profiles.is_active
      if (currentWorker.profile_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from("profiles") as any)
          .update({
            is_active: status === "ACTIVE",
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentWorker.profile_id);
      }

      // Broadcast update on both channels
      try {
        const channel = adminClient.channel("federation-workforce");
        await channel.send({
          type: "broadcast",
          event: "workforce_updated",
          payload: { action: "status", federationId: currentWorker.federation_id, workerId: currentWorker.id, status },
        });
      } catch (bcErr) {
        console.warn("Broadcast notice (federation-workforce):", bcErr);
      }
      try {
        const broadcastChannel = adminClient.channel("federation-workforce-updates");
        await broadcastChannel.send({
          type: "broadcast",
          event: "WORKER_STATUS_CHANGED",
          payload: { workerId: currentWorker.id, status },
        });
      } catch {
        // Broadcast failure non-fatal
      }

      return NextResponse.json({
        success: true,
        workerId: currentWorker.id,
        updatedStatus: status,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    console.error("Error processing worker federation request:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "applications";
    const statusFilter = searchParams.get("status") || "ALL";
    const registrationTypeFilter = searchParams.get("registrationType") || "ALL";
    const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();
    const adminClient = createAdminClient();

    // -------------------------------------------------------------
    // RESOLVE AUTHENTICATED CALLER & FEDERATION CONTEXT
    // -------------------------------------------------------------
    let callerRole: string | null = null;
    let adminFedId: string | null = null;

    try {
      const serverClient = createServerClient();
      const {
        data: { user },
      } = await serverClient.auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: callerProfile } = await (adminClient.from("profiles") as any)
          .select("role, email")
          .eq("id", user.id)
          .maybeSingle();

        callerRole = callerProfile?.role || null;

        // Resolve federation where contact_email matches caller's email
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: fedByEmail } = await (adminClient.from("federations") as any)
          .select("id, code")
          .eq("contact_email", user.email || callerProfile?.email)
          .maybeSingle();

        if (fedByEmail) {
          adminFedId = fedByEmail.id;
        }
      }
    } catch (authErr) {
      console.warn("Notice: Caller auth resolution in worker API GET:", authErr);
    }

    if (type === "applications") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (adminClient.from("workers") as any)
        .select(`
          id,
          profile_id,
          federation_id,
          member_id,
          registration_type,
          experience_years,
          hourly_rate,
          verification_status,
          account_status,
          created_at,
          date_of_birth,
          gender,
          profession,
          previous_work_details,
          govt_id_type,
          govt_id_number,
          govt_id_document_url,
          bank_name,
          bank_account_holder,
          bank_account_number,
          bank_ifsc_code,
          rejection_reason,
          profiles:profile_id (
            id,
            full_name,
            email,
            phone,
            avatar_url
          ),
          federations:federation_id (
            id,
            name,
            code
          )
        `)
        .order("created_at", { ascending: false });

      if (adminFedId && callerRole !== "SUPER_ADMIN") {
        query = query.eq("federation_id", adminFedId);
      }

      if (statusFilter === "PENDING") {
        query = query.eq("verification_status", "pending_verification");
      } else if (statusFilter === "ACCEPTED") {
        query = query.eq("verification_status", "verified");
      } else if (statusFilter === "REJECTED") {
        query = query.eq("verification_status", "suspended");
      }

      if (registrationTypeFilter !== "ALL") {
        query = query.eq("registration_type", registrationTypeFilter);
      }

      const { data: dbWorkers, error } = await query;

      if (error) {
        console.error("Worker applications query error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileIds = (dbWorkers || []).map((w: any) => w.profile_id).filter(Boolean);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addressMap: Record<string, any> = {};
      if (profileIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: addresses } = await (adminClient.from("addresses") as any)
          .select("profile_id, address_line1, address_line2, city, state, postal_code")
          .in("profile_id", profileIds);
        if (addresses) {
          for (const addr of addresses) {
            if (addr.profile_id && !addressMap[addr.profile_id]) {
              addressMap[addr.profile_id] = addr;
            }
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let applications = (dbWorkers || []).map((w: any) => {
        const profile = w.profiles || {};
        const addr = addressMap[w.profile_id];
        const status =
          w.verification_status === "pending_verification"
            ? "PENDING"
            : w.verification_status === "verified"
            ? "ACCEPTED"
            : "REJECTED";

        const regType = w.registration_type === "EXISTING_WORKER" ? "EXISTING_WORKER" : "NEW_WORKER";

        const formattedAddress = addr
          ? [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")
          : "Address on File";

        return {
          id: w.id,
          memberId: w.member_id || null,
          registrationType: regType,
          applicantName: profile.full_name || (regType === "EXISTING_WORKER" ? "Existing Worker Member" : "New Worker Applicant"),
          phone: profile.phone || "",
          email: profile.email || "",
          dateOfBirth: w.date_of_birth || "",
          gender: w.gender || "male",
          address: formattedAddress,
          city: addr?.city || "Ahmedabad",
          state: addr?.state || "Gujarat",
          profession: w.profession || "Skilled Tradesperson",
          skills: [w.profession || "General Trades"],
          experienceYears: w.experience_years || 1,
          hourlyRate: Number(w.hourly_rate) || 300,
          previousWorkDetails: w.previous_work_details || null,
          govtIdType: w.govt_id_type || "aadhar",
          govtIdNumber: w.govt_id_number || "",
          govtIdDocumentUrl: w.govt_id_document_url || null,
          avatarUrl: profile.avatar_url || null,
          bankName: w.bank_name || null,
          bankAccountHolder: w.bank_account_holder || null,
          bankAccountNumber: w.bank_account_number || null,
          bankIfscCode: w.bank_ifsc_code || null,
          documents: w.govt_id_document_url
            ? [
                {
                  name: `${w.govt_id_type?.toUpperCase() || "GOVT"}_Document`,
                  category: "IDENTITY" as const,
                  fileType: "Document",
                  fileSize: "Uploaded",
                },
              ]
            : [],
          submittedDate: w.created_at ? w.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          status,
          rejectionReason: w.rejection_reason || undefined,
        };
      });

      if (searchQuery) {
        applications = applications.filter(
          (app: { applicantName: string; id: string; memberId?: string; profession: string }) =>
            app.applicantName.toLowerCase().includes(searchQuery) ||
            app.id.toLowerCase().includes(searchQuery) ||
            (app.memberId && app.memberId.toLowerCase().includes(searchQuery)) ||
            app.profession.toLowerCase().includes(searchQuery)
        );
      }

      return NextResponse.json({ success: true, applications });
    }

    if (type === "roster") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (adminClient.from("workers") as any)
        .select(`
          id,
          profile_id,
          member_id,
          profession,
          hourly_rate,
          experience_years,
          account_status,
          availability_status,
          created_at,
          verification_status,
          federation_id,
          profiles:profile_id (
            full_name,
            email,
            phone
          )
        `)
        .eq("verification_status", "verified")
        .order("created_at", { ascending: false });

      if (adminFedId && callerRole !== "SUPER_ADMIN") {
        query = query.eq("federation_id", adminFedId);
      }

      const { data: dbWorkers, error } = await query;

      if (error) {
        console.error("Worker roster query error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileIds = (dbWorkers || []).map((w: any) => w.profile_id).filter(Boolean);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addressMap: Record<string, any> = {};
      if (profileIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: addresses } = await (adminClient.from("addresses") as any)
          .select("profile_id, address_line1, address_line2, city, state, postal_code")
          .in("profile_id", profileIds);
        if (addresses) {
          for (const addr of addresses) {
            if (addr.profile_id && !addressMap[addr.profile_id]) {
              addressMap[addr.profile_id] = addr;
            }
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let workers = (dbWorkers || []).map((w: any) => {
        const profile = w.profiles || {};
        const addr = addressMap[w.profile_id];
        return {
          id: w.id,
          memberId: w.member_id || undefined,
          fullName: profile.full_name || "Cooperative Member",
          profession: w.profession || "Skilled Craftsman",
          area: addr?.address_line2 || addr?.address_line1 || "Ahmedabad Central",
          city: addr?.city || "Ahmedabad",
          state: addr?.state || "Gujarat",
          accountStatus: w.account_status || "ACTIVE",
          availabilityStatus: w.availability_status || "AVAILABLE",
          hourlyRate: Number(w.hourly_rate) || 350,
          experienceYears: Number(w.experience_years) || 0,
          joiningDate: w.created_at ? w.created_at.split("T")[0] : "2024-01-01",
          phone: profile.phone || "+91 98250 00000",
          email: profile.email || "worker@kaushalya.coop.in",
        };
      });

      if (searchQuery) {
        workers = workers.filter(
          (w: { fullName: string; id: string; memberId?: string; accountStatus: string }) =>
            w.fullName.toLowerCase().includes(searchQuery) ||
            w.id.toLowerCase().includes(searchQuery) ||
            (w.memberId && w.memberId.toLowerCase().includes(searchQuery))
        );
      }

      const totalCount = workers.length;
      const activeCount = workers.filter((w: { accountStatus: string }) => w.accountStatus === "ACTIVE").length;
      const deactivatedCount = workers.filter((w: { accountStatus: string }) => w.accountStatus === "DEACTIVATED").length;

      return NextResponse.json({
        success: true,
        data: {
          workers,
          totalCount,
          activeCount,
          deactivatedCount,
          isDevelopmentFallback: false,
        },
      });
    }

    return NextResponse.json({ error: `Unknown query type: ${type}` }, { status: 400 });
  } catch (err: unknown) {
    console.error("Error in GET /api/federation/workers:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
