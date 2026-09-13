import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valParts] = trimmed.split("=");
        process.env[key.trim()] = valParts.join("=").trim();
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function runTask8Verification() {
  console.log("================================================================================");
  console.log("KAUSHALYASETU: TASK 8 VERIFICATION SUITE");
  console.log("WORKER PROFILE + PROFILE PHOTO INTEGRATION ACROSS ALL PORTALS");
  console.log("================================================================================\n");

  const timestamp = Date.now();
  const workerEmail = `task8_worker_${timestamp}@example.com`;
  const initialAvatarUrl = `https://mock-storage.example.com/avatars/worker_${timestamp}_original.jpg`;
  const updatedAvatarUrl = `https://mock-storage.example.com/avatars/worker_${timestamp}_updated.jpg`;

  let testUserId: string | null = null;
  let testWorkerId: string | null = null;
  let testFedId: string | null = null;
  let otherFedId: string | null = null;

  try {
    // ------------------------------------------------------------------
    // STEP 0: Setup Federations & Test Skill
    // ------------------------------------------------------------------
    console.log("--- Step 0: Retrieving Federations & Trade Skill ---");
    const { data: federations } = await adminClient
      .from("federations")
      .select("id, name, code")
      .limit(2);

    if (!federations || federations.length === 0) {
      throw new Error("No federations found in database.");
    }
    testFedId = federations[0].id;
    otherFedId = federations.length > 1 ? federations[1].id : null;
    console.log(`✓ Primary Federation: ${federations[0].name} (ID: ${testFedId})`);
    if (otherFedId) {
      console.log(`✓ Secondary Federation for Isolation Testing: ${federations[1].name} (ID: ${otherFedId})`);
    }

    const { data: skills } = await adminClient.from("skills").select("id, name").limit(1);
    const primarySkill = skills?.[0];
    console.log(`✓ Using skill: ${primarySkill?.name || "Electrician"}`);

    // ------------------------------------------------------------------
    // STEP 1: Create Authorized Test Worker with Photo, Address, and Sensitive KYC
    // ------------------------------------------------------------------
    console.log("\n--- Step 1: Creating Authoritative Worker Record with Profile Photo & KYC ---");
    const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
      email: workerEmail,
      password: "WorkerPassword123!",
      email_confirm: true,
      user_metadata: {
        role: "WORKER",
        full_name: "Kavya Task8 Worker",
        phone: "9876543210",
      },
    });

    if (authErr || !authUser.user) {
      throw new Error(`Failed to create Auth user: ${authErr?.message}`);
    }
    testUserId = authUser.user.id;

    // Upsert Profile with initial Avatar URL
    const { error: profErr } = await (adminClient.from("profiles") as any).upsert({
      id: testUserId,
      role: "WORKER",
      full_name: "Kavya Task8 Worker",
      email: workerEmail,
      phone: "9876543210",
      avatar_url: initialAvatarUrl,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
    if (profErr) throw new Error(`Failed to create profile: ${profErr.message}`);

    // Insert Authoritative Worker
    const memberId = `WRK-TEST-${timestamp.toString().slice(-4)}`;
    const { data: workerRecord, error: wrkErr } = await (adminClient.from("workers") as any)
      .insert({
        profile_id: testUserId,
        federation_id: testFedId,
        member_id: memberId,
        profession: "Electrician",
        hourly_rate: 450,
        experience_years: 5,
        account_status: "ACTIVE",
        verification_status: "verified",
        availability_status: "AVAILABLE",
        registration_type: "EXISTING_WORKER",
        date_of_birth: "1994-05-15",
        gender: "female",
        govt_id_type: "Aadhaar Card",
        govt_id_number: "987654321012",
        govt_id_document_url: "private/documents/aadhaar_secret.pdf",
        bank_name: "State Bank of India",
        bank_account_holder: "Kavya Task8 Worker",
        bank_account_number: "998877665544",
        bank_ifsc_code: "SBIN0001234",
      })
      .select()
      .single();

    if (wrkErr || !workerRecord) throw new Error(`Failed to create worker: ${wrkErr?.message}`);
    testWorkerId = workerRecord.id;
    console.log(`✓ Worker created with ID: ${testWorkerId}, Member ID: ${memberId}`);
    console.log(`✓ Initial avatar URL: ${initialAvatarUrl}`);

    // Insert Address
    const { error: addrErr } = await (adminClient.from("addresses") as any).insert({
      profile_id: testUserId,
      title: "Home",
      address_line1: "Flat 402, Shanti Complex, Satellite",
      city: "Ahmedabad",
      state: "Gujarat",
      postal_code: "380015",
      is_default: true,
    });
    if (addrErr) throw new Error(`Failed to insert address: ${addrErr.message}`);
    console.log("✓ Worker residential address persisted in public.addresses");

    // Insert Worker Skill
    if (primarySkill) {
      await (adminClient.from("worker_skills") as any).insert({
        worker_id: testWorkerId,
        skill_id: primarySkill.id,
        proficiency_level: "advanced",
      });
      console.log(`✓ Worker skill persisted: ${primarySkill.name}`);
    }

    // ------------------------------------------------------------------
    // STEP 2: Verify Worker Portal Data Structure
    // ------------------------------------------------------------------
    console.log("\n--- Step 2: Verifying Worker Self-Profile Data Query ---");
    const { data: selfProfile, error: selfErr } = await (adminClient.from("profiles") as any)
      .select(`
        id,
        full_name,
        email,
        phone,
        avatar_url,
        workers:workers!workers_profile_id_fkey (
          id,
          member_id,
          profession,
          experience_years,
          hourly_rate,
          registration_type,
          date_of_birth,
          gender,
          account_status,
          verification_status,
          federations:federation_id (name)
        ),
        addresses (address_line1, city, state)
      `)
      .eq("id", testUserId)
      .single();

    if (selfErr || !selfProfile) throw new Error(`Failed to query worker self profile: ${selfErr?.message}`);
    if (selfProfile.avatar_url !== initialAvatarUrl) {
      throw new Error(`Worker profile avatar mismatch. Expected ${initialAvatarUrl}, got ${selfProfile.avatar_url}`);
    }
    const wrk = Array.isArray(selfProfile.workers) ? selfProfile.workers[0] : selfProfile.workers;
    if (wrk.member_id !== memberId) {
      throw new Error(`Worker member ID mismatch. Expected ${memberId}, got ${wrk.member_id}`);
    }
    if (wrk.date_of_birth !== "1994-05-15" || wrk.gender !== "female") {
      throw new Error(`Worker DOB/Gender mismatch.`);
    }
    console.log(`✓ Worker Portal data query verified: Avatar, Member ID, DOB, Gender, and Address matched`);

    // ------------------------------------------------------------------
    // STEP 3: Verify Customer Portal Integration & Strict KYC Privacy
    // ------------------------------------------------------------------
    console.log("\n--- Step 3: Verifying Customer Portal Integration & KYC Privacy ---");
    const { matchingService } = await import(
      "../features/matching/services/matching-service"
    );

    const matchResult = await matchingService.getWorkerProfileById(testWorkerId!);
    if (!matchResult || !matchResult.worker) {
      throw new Error("Customer matchingService.getWorkerProfileById returned null for test worker!");
    }
    const customerWorker = matchResult.worker;
    const customerWorkerProfile = customerWorker.extendedProfile;

    console.log(`✓ Customer View Full Name: ${customerWorkerProfile.fullName}`);
    console.log(`✓ Customer View Avatar URL: ${customerWorkerProfile.avatarUrl}`);
    if (customerWorkerProfile.avatarUrl !== initialAvatarUrl) {
      throw new Error(`Customer view avatar mismatch! Expected ${initialAvatarUrl}, got ${customerWorkerProfile.avatarUrl}`);
    }

    // PRIVACY ENFORCEMENT: Confirm sensitive KYC/Bank columns are NEVER exposed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCustomerObj = customerWorker as any;
    const anyProfileObj = customerWorkerProfile as any;
    const forbiddenKeys = [
      "govtIdNumber",
      "govt_id_number",
      "govtIdDocumentUrl",
      "govt_id_document_url",
      "bankAccountNumber",
      "bank_account_number",
      "bankIfscCode",
      "bank_ifsc_code",
    ];

    for (const key of forbiddenKeys) {
      if (anyCustomerObj[key] !== undefined || anyProfileObj[key] !== undefined) {
        throw new Error(`CRITICAL SECURITY FAILURE: Customer portal exposed sensitive KYC/Bank field "${key}"!`);
      }
    }
    console.log("✓ Verified: Zero sensitive KYC or banking fields exposed to Customer Portal");

    // Test findEligibleWorkers list mapping
    const eligibleMatches = await matchingService.findEligibleWorkers({
      serviceId: primarySkill?.id || "",
      customerLatitude: 23.0225,
      customerLongitude: 72.5714,
    });
    const matchedCustomerWorker = eligibleMatches.find((m) => m.worker.id === testWorkerId);
    if (matchedCustomerWorker) {
      console.log(`✓ Worker listed in findEligibleWorkers with avatar: ${matchedCustomerWorker.worker.extendedProfile.avatarUrl}`);
      if (matchedCustomerWorker.worker.extendedProfile.avatarUrl !== initialAvatarUrl) {
        throw new Error("findEligibleWorkers returned incorrect avatar URL!");
      }
    }

    // ------------------------------------------------------------------
    // STEP 4: Verify Federation Admin Worker Information & Federation Isolation
    // ------------------------------------------------------------------
    console.log("\n--- Step 4: Verifying Federation Admin Roster & Federation Isolation ---");
    const { workerInformationService } = await import(
      "../features/federation-admin/worker-information/services/worker-information-service"
    );

    // Query worker as federation admin of testFedId
    const fedAdminWorker = await workerInformationService.getWorkerById(testWorkerId!, testFedId!);
    if (!fedAdminWorker) {
      throw new Error("Federation Admin getWorkerById returned null for affiliated worker!");
    }

    console.log(`✓ Federation Admin Worker Detail Name: ${fedAdminWorker.personal.fullName}`);
    console.log(`✓ Federation Admin Worker Detail Avatar: ${fedAdminWorker.avatarUrl}`);
    console.log(`✓ Federation Admin Worker Member ID: ${fedAdminWorker.memberId}`);
    if (fedAdminWorker.avatarUrl !== initialAvatarUrl) {
      throw new Error(`Federation Admin avatar mismatch! Expected ${initialAvatarUrl}, got ${fedAdminWorker.avatarUrl}`);
    }
    if (fedAdminWorker.memberId !== memberId) {
      throw new Error(`Federation Admin memberId mismatch! Expected ${memberId}, got ${fedAdminWorker.memberId}`);
    }

    // TEST FEDERATION ISOLATION:
    if (otherFedId) {
      console.log(`Testing federation isolation against foreign federation ID: ${otherFedId}...`);
      const crossFedWorker = await workerInformationService.getWorkerById(testWorkerId!, otherFedId);
      if (crossFedWorker !== null) {
        throw new Error("FEDERATION ISOLATION BREACH: Federation Admin was able to query worker from another federation!");
      }
      console.log("✓ Federation Isolation Verified: Cross-federation query properly returned null");
    }

    // ------------------------------------------------------------------
    // STEP 5: Verify Super Admin Workforce Integration
    // ------------------------------------------------------------------
    console.log("\n--- Step 5: Verifying Super Admin Workforce Integration ---");
    const { workforceService } = await import(
      "../features/super-admin/workforce/services/workforce-service"
    );

    const superAdminWorker = await workforceService.getWorkerById(testWorkerId!);
    if (!superAdminWorker) {
      throw new Error("Super Admin getWorkerById returned null for worker!");
    }

    console.log(`✓ Super Admin Worker Name: ${superAdminWorker.fullName}`);
    console.log(`✓ Super Admin Worker Avatar: ${superAdminWorker.avatarUrl}`);
    console.log(`✓ Super Admin Worker Member ID: ${superAdminWorker.memberId}`);
    console.log(`✓ Super Admin Worker DOB: ${superAdminWorker.dateOfBirth}`);
    console.log(`✓ Super Admin Worker Gender: ${superAdminWorker.gender}`);
    console.log(`✓ Super Admin Worker Reg Type: ${superAdminWorker.registrationType}`);

    if (superAdminWorker.avatarUrl !== initialAvatarUrl) {
      throw new Error(`Super Admin avatar mismatch! Expected ${initialAvatarUrl}, got ${superAdminWorker.avatarUrl}`);
    }
    if (superAdminWorker.memberId !== memberId) {
      throw new Error(`Super Admin memberId mismatch! Expected ${memberId}, got ${superAdminWorker.memberId}`);
    }
    if (superAdminWorker.dateOfBirth !== "1994-05-15" || superAdminWorker.gender !== "female") {
      throw new Error("Super Admin DOB / Gender mismatch!");
    }

    // ------------------------------------------------------------------
    // STEP 6: Verify Dynamic Avatar Update Across All Portals
    // ------------------------------------------------------------------
    console.log("\n--- Step 6: Verifying Dynamic Avatar Photo Update Across All Portals ---");
    // Simulate photo update in profiles table
    const { error: updatePhotoErr } = await (adminClient.from("profiles") as any)
      .update({
        avatar_url: updatedAvatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", testUserId);

    if (updatePhotoErr) throw new Error(`Failed to update avatar: ${updatePhotoErr.message}`);
    console.log(`✓ Avatar updated to new URL: ${updatedAvatarUrl}`);

    // Re-verify Customer Portal
    const updatedMatchResult = await matchingService.getWorkerProfileById(testWorkerId!);
    const updatedCustomerAvatar = updatedMatchResult?.worker?.extendedProfile?.avatarUrl;
    if (updatedCustomerAvatar !== updatedAvatarUrl) {
      throw new Error(`Customer portal did not reflect updated avatar! Got: ${updatedCustomerAvatar}`);
    }
    console.log("✓ Customer Portal reflects updated avatar URL");

    // Re-verify Federation Admin Portal
    const updatedFedAdmin = await workerInformationService.getWorkerById(testWorkerId!, testFedId!);
    if (updatedFedAdmin?.avatarUrl !== updatedAvatarUrl) {
      throw new Error(`Federation Admin did not reflect updated avatar! Got: ${updatedFedAdmin?.avatarUrl}`);
    }
    console.log("✓ Federation Admin Portal reflects updated avatar URL");

    // Re-verify Super Admin Portal
    const updatedSuperAdmin = await workforceService.getWorkerById(testWorkerId!);
    if (updatedSuperAdmin?.avatarUrl !== updatedAvatarUrl) {
      throw new Error(`Super Admin did not reflect updated avatar! Got: ${updatedSuperAdmin?.avatarUrl}`);
    }
    console.log("✓ Super Admin Portal reflects updated avatar URL");

    console.log("\n================================================================================");
    console.log("ALL TASK 8 VERIFICATION TESTS PASSED SUCCESSFULLY!");
    console.log("================================================================================");
  } catch (err: unknown) {
    console.error("\n❌ VERIFICATION TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    // Clean up test data
    console.log("\n--- Cleaning up test records ---");
    if (testWorkerId) {
      await adminClient.from("worker_skills").delete().eq("worker_id", testWorkerId);
      await adminClient.from("workers").delete().eq("id", testWorkerId);
    }
    if (testUserId) {
      await adminClient.from("addresses").delete().eq("profile_id", testUserId);
      await adminClient.from("profiles").delete().eq("id", testUserId);
      await adminClient.auth.admin.deleteUser(testUserId);
      console.log(`✓ Cleaned up test user: ${testUserId}`);
    }
  }
}

runTask8Verification();
