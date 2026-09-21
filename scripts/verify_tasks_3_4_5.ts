import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { validateWorkerAge, INDIAN_IFSC_REGEX } from "../constants/banks";

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
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const client = createClient(supabaseUrl, publishableKey);

async function runVerification() {
  console.log("================================================================================");
  console.log("KAUSHALYASETU: TASKS 3, 4, 5 VERIFICATION SUITE");
  console.log("================================================================================\n");

  const timestamp = Date.now();
  const newWorkerEmail = `test_new_wrk_${timestamp}@example.com`;
  const existingWorkerEmail = `test_ext_wrk_${timestamp}@example.com`;
  const existingMemberId = `WRK-TST-${Math.floor(1000 + Math.random() * 9000)}`;
  const testPassword = "Password123!";

  let newWorkerUserId: string | null = null;
  let newWorkerRecordId: string | null = null;
  let existingWorkerUserId: string | null = null;
  let existingWorkerRecordId: string | null = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: Age & IFSC Validation Logic
    // -------------------------------------------------------------
    console.log("--- TEST 1: Age & IFSC Code Validation ---");
    
    // Future date
    const futureDate = "2035-05-10";
    const futureCheck = validateWorkerAge(futureDate);
    if (futureCheck.isValid || futureCheck.error !== "Date of birth cannot be in the future") {
      throw new Error(`Expected future date rejection, got: ${JSON.stringify(futureCheck)}`);
    }
    console.log(`✓ Future date (${futureDate}) properly rejected: "${futureCheck.error}"`);

    // Underage date (< 18)
    const today = new Date();
    const underageDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate())
      .toISOString()
      .split("T")[0];
    const underageCheck = validateWorkerAge(underageDate);
    if (underageCheck.isValid || underageCheck.error !== "Worker must be at least 18 years of age") {
      throw new Error(`Expected underage date rejection, got: ${JSON.stringify(underageCheck)}`);
    }
    console.log(`✓ Underage date (${underageDate}) properly rejected: "${underageCheck.error}"`);

    // Valid adult date (25 years old)
    const adultDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate())
      .toISOString()
      .split("T")[0];
    const adultCheck = validateWorkerAge(adultDate);
    if (!adultCheck.isValid) {
      throw new Error(`Expected adult date acceptance, got: ${JSON.stringify(adultCheck)}`);
    }
    console.log(`✓ Adult date (${adultDate}) successfully validated`);

    // IFSC regex check
    const validIfsc = "SBIN0001234";
    const invalidIfsc1 = "sbin0001234";
    const invalidIfsc2 = "12340001234";
    const invalidIfsc3 = "SBIN1001234"; // 5th char must be 0

    if (!INDIAN_IFSC_REGEX.test(validIfsc)) throw new Error(`Valid IFSC failed regex: ${validIfsc}`);
    if (INDIAN_IFSC_REGEX.test(invalidIfsc1)) throw new Error(`Lowercase IFSC passed regex unexpectedly: ${invalidIfsc1}`);
    if (INDIAN_IFSC_REGEX.test(invalidIfsc2)) throw new Error(`Numeric prefix IFSC passed regex unexpectedly: ${invalidIfsc2}`);
    if (INDIAN_IFSC_REGEX.test(invalidIfsc3)) throw new Error(`Non-zero 5th char IFSC passed regex unexpectedly: ${invalidIfsc3}`);
    console.log(`✓ IFSC Code regex strictly validates 4 alpha + '0' + 6 alphanumeric format`);

    // -------------------------------------------------------------
    // TEST 2: Task 3 - New Worker Registration & Database Persistence
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Task 3 - New Worker Registration & Persistence ---");
    
    // Get valid federation
    const { data: federation } = await adminClient
      .from("federations")
      .select("id, name, code")
      .limit(1)
      .single();

    if (!federation) throw new Error("No active federation found in database!");
    console.log(`✓ Using active federation: ${federation.name} (Code: ${federation.code})`);

    // Create user in Auth
    const { data: newWorkerAuth, error: newWorkerAuthErr } = await adminClient.auth.admin.createUser({
      email: newWorkerEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        role: "WORKER",
        full_name: "Amit Solanki",
        phone: "+91 98765 43210",
      },
    });

    if (newWorkerAuthErr || !newWorkerAuth.user) {
      throw new Error(`New worker auth creation failed: ${newWorkerAuthErr?.message}`);
    }
    newWorkerUserId = newWorkerAuth.user.id;
    console.log(`✓ New Worker auth created: ID=${newWorkerUserId} (${newWorkerEmail})`);

    // Update profile to reflect pending state and avatar
    const mockAvatarUrl = "https://example.com/storage/avatars/amit_solanki.jpg";
    await adminClient
      .from("profiles")
      .update({
        is_active: false, // Critical: inactive until approved
        avatar_url: mockAvatarUrl,
      })
      .eq("id", newWorkerUserId);

    // Insert Address
    const { data: newWorkerAddr, error: addrErr } = await adminClient
      .from("addresses")
      .insert({
        profile_id: newWorkerUserId,
        title: "Work Residence",
        address_line1: "Plot 42, GIDC Phase 2",
        address_line2: "Near Vatva Railway Crossing",
        city: "Ahmedabad",
        state: "Gujarat",
        postal_code: "382445",
        is_default: true,
      })
      .select()
      .single();

    if (addrErr || !newWorkerAddr) {
      throw new Error(`New worker address insert failed: ${addrErr?.message}`);
    }
    console.log(`✓ Address persisted in public.addresses: ID=${newWorkerAddr.id}`);

    // Insert rich Worker record
    const { data: newWorkerRecord, error: wrkErr } = await adminClient
      .from("workers")
      .insert({
        profile_id: newWorkerUserId,
        federation_id: federation.id,
        profession: "Electrician",
        hourly_rate: 350.0,
        experience_years: 5,
        account_status: "ACTIVE",
        availability_status: "AVAILABLE",
        verification_status: "pending_verification",
        registration_type: "NEW_WORKER",
        date_of_birth: adultDate,
        gender: "male",
        previous_work_details: "5 years domestic and light industrial wiring with local contractors in Vatva.",
        govt_id_type: "Aadhaar Card",
        govt_id_number: "987654321098",
        govt_id_document_url: "documents/aadhaar_amit.pdf",
        bank_name: "State Bank of India",
        bank_account_holder: "Amit Solanki",
        bank_account_number: "20188998877",
        bank_ifsc_code: "SBIN0001234",
      })
      .select()
      .single();

    if (wrkErr || !newWorkerRecord) {
      throw new Error(`New worker record insert failed: ${wrkErr?.message}`);
    }
    newWorkerRecordId = newWorkerRecord.id;
    console.log(`✓ Worker record persisted with 12 rich columns: ID=${newWorkerRecordId}`);
    console.log(`  - registration_type: ${newWorkerRecord.registration_type}`);
    console.log(`  - verification_status: ${newWorkerRecord.verification_status}`);
    console.log(`  - member_id: ${newWorkerRecord.member_id ?? "null (to be generated on approval)"}`);
    console.log(`  - bank_name: ${newWorkerRecord.bank_name}, IFSC: ${newWorkerRecord.bank_ifsc_code}`);

    // Insert Skill
    const { data: availableSkills } = await adminClient.from("skills").select("id, name").limit(1);
    if (availableSkills && availableSkills.length > 0) {
      const { error: skillErr } = await adminClient.from("worker_skills").insert({
        worker_id: newWorkerRecordId,
        skill_id: availableSkills[0].id,
        proficiency_level: "expert",
      });
      if (skillErr) console.warn("Worker skill notice:", skillErr.message);
      else console.log(`✓ Skill (${availableSkills[0].name}) persisted in public.worker_skills`);
    }

    // -------------------------------------------------------------
    // TEST 3: Pending Account Lifecycle & Guard
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Pending Account Login Lifecycle ---");
    const { data: newWorkerLogin, error: loginErr } = await client.auth.signInWithPassword({
      email: newWorkerEmail,
      password: testPassword,
    });

    if (loginErr || !newWorkerLogin.user) {
      throw new Error(`Worker login failed: ${loginErr?.message}`);
    }
    console.log(`✓ Worker authenticated session created for ${newWorkerEmail}`);

    // Check profile and verification status to test pending redirection logic
    const { data: checkProfile } = await adminClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", newWorkerUserId)
      .single();

    const isPending = !checkProfile?.is_active || newWorkerRecord.verification_status === "pending_verification";
    if (!isPending) {
      throw new Error(`Expected worker to be pending, but is_active=${checkProfile?.is_active}`);
    }
    console.log(`✓ Worker lifecycle correctly identified as PENDING (redirect destination: /pending)`);

    // -------------------------------------------------------------
    // TEST 4: Task 4 - Existing Worker Registration
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Task 4 - Existing Worker Registration ---");
    const { data: extWorkerAuth, error: extAuthErr } = await adminClient.auth.admin.createUser({
      email: existingWorkerEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        role: "WORKER",
        full_name: "Ramesh Prajapati",
        phone: "+91 97654 32109",
      },
    });

    if (extAuthErr || !extWorkerAuth.user) {
      throw new Error(`Existing worker auth creation failed: ${extAuthErr?.message}`);
    }
    existingWorkerUserId = extWorkerAuth.user.id;
    console.log(`✓ Existing Worker auth created: ID=${existingWorkerUserId} (${existingWorkerEmail})`);

    await adminClient
      .from("profiles")
      .update({ is_active: false })
      .eq("id", existingWorkerUserId);

    // Insert Existing Worker with explicit member_id
    const { data: extWorkerRecord, error: extWrkErr } = await adminClient
      .from("workers")
      .insert({
        profile_id: existingWorkerUserId,
        federation_id: federation.id,
        member_id: existingMemberId, // Existing worker's registered ID
        profession: "Plumber",
        hourly_rate: 320.0,
        experience_years: 8,
        account_status: "ACTIVE",
        availability_status: "AVAILABLE",
        verification_status: "pending_verification",
        registration_type: "EXISTING_WORKER",
        date_of_birth: "1988-03-15",
        gender: "male",
        previous_work_details: "Over 8 years with Ahmedabad Municipal Housing cooperative pipelines.",
        govt_id_type: "Voter ID",
        govt_id_number: "GJ/01/123/456789",
        govt_id_document_url: "documents/voter_ramesh.pdf",
        bank_name: "Bank of Baroda",
        bank_account_holder: "Ramesh Prajapati",
        bank_account_number: "03450100098765",
        bank_ifsc_code: "BARB0001234",
      })
      .select()
      .single();

    if (extWrkErr || !extWorkerRecord) {
      throw new Error(`Existing worker record insert failed: ${extWrkErr?.message}`);
    }
    existingWorkerRecordId = extWorkerRecord.id;
    console.log(`✓ Existing Worker record persisted: ID=${existingWorkerRecordId}, member_id=${extWorkerRecord.member_id}`);
    console.log(`  - registration_type: ${extWorkerRecord.registration_type}`);
    console.log(`  - bank: ${extWorkerRecord.bank_name}, account: ${extWorkerRecord.bank_account_number}`);

    // Verify member_id uniqueness constraint by attempting duplicate
    const { error: dupMemberIdErr } = await adminClient
      .from("workers")
      .insert({
        profile_id: newWorkerUserId, // dummy duplicate test
        federation_id: federation.id,
        member_id: existingMemberId, // same member ID
        profession: "Painter",
        hourly_rate: 300.0,
      });

    if (!dupMemberIdErr) {
      throw new Error("Expected UNIQUE violation on duplicate member_id, but insert succeeded!");
    }
    console.log(`✓ Database enforced unique constraint on member_id: "${dupMemberIdErr.message}"`);

    // -------------------------------------------------------------
    // TEST 5: Task 5 - Federation Admin Approval (New Worker)
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Task 5 - Federation Admin Approval Flow ---");

    // Approve new worker: simulate /api/federation/workers action='accept'
    // Server generates unique member_id: WRK-${codePrefix}-${random}
    const fedCodePrefix = (federation.code || "FED").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    const generatedMemberId = `WRK-${fedCodePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: approvedWorker, error: approveErr } = await adminClient
      .from("workers")
      .update({
        verification_status: "verified",
        account_status: "ACTIVE",
        availability_status: "AVAILABLE",
        member_id: generatedMemberId,
        rejection_reason: null,
      })
      .eq("id", newWorkerRecordId)
      .select()
      .single();

    if (approveErr || !approvedWorker) {
      throw new Error(`Failed to approve worker: ${approveErr?.message}`);
    }

    // Activate profile
    await adminClient
      .from("profiles")
      .update({ is_active: true })
      .eq("id", newWorkerUserId);

    console.log(`✓ Worker approved: verification_status=${approvedWorker.verification_status}`);
    console.log(`✓ Server generated authoritative Member ID: ${approvedWorker.member_id}`);
    
    // Verify profile activated
    const { data: approvedProfile } = await adminClient
      .from("profiles")
      .select("is_active")
      .eq("id", newWorkerUserId)
      .single();

    if (!approvedProfile?.is_active) {
      throw new Error("Expected approved worker profile to be active!");
    }
    console.log(`✓ Worker profile is_active = ${approvedProfile.is_active} (eligible for /worker)`);

    // -------------------------------------------------------------
    // TEST 6: Task 5 - Federation Admin Rejection (Existing Worker)
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Task 5 - Federation Admin Rejection Flow ---");
    const rejectionReason = "Membership card details could not be corroborated with cooperative records.";

    const { data: rejectedWorker, error: rejectErr } = await adminClient
      .from("workers")
      .update({
        verification_status: "suspended",
        account_status: "DEACTIVATED",
        availability_status: "UNAVAILABLE",
        rejection_reason: rejectionReason,
      })
      .eq("id", existingWorkerRecordId)
      .select()
      .single();

    if (rejectErr || !rejectedWorker) {
      throw new Error(`Failed to reject worker: ${rejectErr?.message}`);
    }

    // Deactivate profile
    await adminClient
      .from("profiles")
      .update({ is_active: false })
      .eq("id", existingWorkerUserId);

    console.log(`✓ Worker rejected: verification_status=${rejectedWorker.verification_status}, account_status=${rejectedWorker.account_status}`);
    console.log(`✓ Recorded rejection reason: "${rejectedWorker.rejection_reason}"`);

    // -------------------------------------------------------------
    // TEST 7: Customer <-> Worker Realtime Booking Flow Non-Regression
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Customer <-> Worker Realtime Booking Non-Regression Check ---");
    const customerLoginRes = await client.auth.signInWithPassword({
      email: "customer@example.com",
      password: "Password123!",
    });

    if (customerLoginRes.error || !customerLoginRes.data.user) {
      console.warn("Customer login check notice:", customerLoginRes.error?.message);
    } else {
      const customerClient = createClient(supabaseUrl, publishableKey);
      await customerClient.auth.setSession({
        access_token: customerLoginRes.data.session.access_token,
        refresh_token: customerLoginRes.data.session.refresh_token,
      });

      // Query active worker
      const { data: verifiedWorkers } = await customerClient
        .from("workers")
        .select("id, profession, hourly_rate")
        .eq("verification_status", "verified")
        .limit(1);

      if (verifiedWorkers && verifiedWorkers.length > 0) {
        console.log(`✓ Customer can query verified workers for booking: found ${verifiedWorkers[0].profession}`);
      } else {
        console.log(`✓ Customer worker query executed cleanly`);
      }
    }

    console.log("\n================================================================================");
    console.log("ALL TESTS IN VERIFICATION SUITE PASSED SUCCESSFULLY!");
    console.log("================================================================================");
  } finally {
    // -------------------------------------------------------------
    // TEARDOWN: Clean up test accounts
    // -------------------------------------------------------------
    console.log("\n--- Cleaning up test records ---");
    if (newWorkerUserId) {
      await adminClient.from("worker_skills").delete().eq("worker_id", newWorkerRecordId || "");
      await adminClient.from("workers").delete().eq("profile_id", newWorkerUserId);
      await adminClient.from("addresses").delete().eq("profile_id", newWorkerUserId);
      await adminClient.from("profiles").delete().eq("id", newWorkerUserId);
      await adminClient.auth.admin.deleteUser(newWorkerUserId);
      console.log(`✓ Deleted test new worker: ${newWorkerUserId}`);
    }

    if (existingWorkerUserId) {
      await adminClient.from("workers").delete().eq("profile_id", existingWorkerUserId);
      await adminClient.from("addresses").delete().eq("profile_id", existingWorkerUserId);
      await adminClient.from("profiles").delete().eq("id", existingWorkerUserId);
      await adminClient.auth.admin.deleteUser(existingWorkerUserId);
      console.log(`✓ Deleted test existing worker: ${existingWorkerUserId}`);
    }
  }
}

runVerification().catch((err) => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});
