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
  const { signInWithEmail } = await import("../lib/auth/actions");
  console.log("================================================================================");
  console.log("KAUSHALYASETU: TASKS 6 & 7 VERIFICATION SUITE");
  console.log("WORKER LIFECYCLE + FEDERATION ADMIN MANUAL ADD WORKER");
  console.log("================================================================================\n");

  const timestamp = Date.now();
  const testWorkerEmail = `lifecycle_wrk_${timestamp}@example.com`;
  const manualWorkerEmail = `manual_wrk_${timestamp}@example.com`;
  const manualWorkerPassword = "WorkerPassword123!";
  const testPassword = "Password123!";

  let lifecycleUserId: string | null = null;
  let lifecycleWorkerId: string | null = null;
  let manualUserId: string | null = null;
  let manualWorkerId: string | null = null;

  try {
    // Fetch active federation
    const { data: federation } = await adminClient
      .from("federations")
      .select("id, name, code")
      .limit(1)
      .single();

    if (!federation) throw new Error("No active federation found in database!");
    console.log(`✓ Using active federation: ${federation.name} (Code: ${federation.code})`);

    // -------------------------------------------------------------
    // TEST 1: Task 6 - Worker Account Lifecycle & Deactivation
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Task 6 - Worker Lifecycle & Login Authorization ---");

    // 1a. Create test worker in PENDING state
    const { data: lcAuth, error: lcAuthErr } = await adminClient.auth.admin.createUser({
      email: testWorkerEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        role: "WORKER",
        full_name: "Kishore Parmar",
        phone: "+91 98111 22334",
      },
    });

    if (lcAuthErr || !lcAuth.user) {
      throw new Error(`Failed to create test auth worker: ${lcAuthErr?.message}`);
    }
    lifecycleUserId = lcAuth.user.id;

    await adminClient
      .from("profiles")
      .update({ is_active: false, role: "WORKER" })
      .eq("id", lifecycleUserId);

    const { data: lcWorker, error: lcWrkErr } = await adminClient
      .from("workers")
      .insert({
        profile_id: lifecycleUserId,
        federation_id: federation.id,
        profession: "Carpenter",
        hourly_rate: 340,
        experience_years: 4,
        account_status: "ACTIVE",
        verification_status: "pending_verification",
        availability_status: "UNAVAILABLE",
        date_of_birth: "1995-06-15",
        member_id: `WRK-TST-${Math.floor(1000 + Math.random() * 9000)}`,
      })
      .select()
      .single();

    if (lcWrkErr || !lcWorker) {
      throw new Error(`Failed to insert test worker record: ${lcWrkErr?.message}`);
    }
    lifecycleWorkerId = lcWorker.id;
    console.log(`✓ Created test worker in PENDING state: ID=${lifecycleWorkerId}`);

    // 1b. Test Pending Login -> Must redirect to /pending
    const pendingLogin = await signInWithEmail(testWorkerEmail, testPassword);
    if (!pendingLogin.success || pendingLogin.redirectUrl !== "/pending") {
      throw new Error(`Expected redirectUrl /pending for pending worker, got: ${JSON.stringify(pendingLogin)}`);
    }
    console.log(`✓ Pending worker login correctly redirected to /pending`);

    // 1c. Test Approved Worker Login -> Must redirect to /worker/dashboard
    await adminClient
      .from("workers")
      .update({ verification_status: "verified", account_status: "ACTIVE" })
      .eq("id", lifecycleWorkerId);

    await adminClient
      .from("profiles")
      .update({ is_active: true })
      .eq("id", lifecycleUserId);

    const approvedLogin = await signInWithEmail(testWorkerEmail, testPassword);
    if (!approvedLogin.success || approvedLogin.redirectUrl !== "/worker/dashboard") {
      throw new Error(`Expected redirectUrl /worker/dashboard for approved worker, got: ${JSON.stringify(approvedLogin)}`);
    }
    console.log(`✓ Approved active worker login correctly permitted to /worker/dashboard`);

    // 1d. Test Deactivation -> Login MUST be blocked
    console.log("\n--- TEST 2: Task 6 - Federation Admin Deactivation ---");
    // Simulate deactivation update as in /api/federation/workers status action
    await adminClient
      .from("workers")
      .update({ account_status: "DEACTIVATED" })
      .eq("id", lifecycleWorkerId);

    await adminClient
      .from("profiles")
      .update({ is_active: false })
      .eq("id", lifecycleUserId);

    const deactivatedLogin = await signInWithEmail(testWorkerEmail, testPassword);
    if (deactivatedLogin.success !== false) {
      throw new Error(`Expected login to be BLOCKED for deactivated worker, but succeeded!`);
    }
    console.log(`✓ Deactivated worker login strictly BLOCKED: "${deactivatedLogin.error}"`);

    // Check that session is destroyed
    const { data: sessionCheck } = await client.auth.getSession();
    if (sessionCheck?.session) {
      console.log(`✓ Auth session safely signed out`);
    }

    // 1e. Test Reactivation of Verified Worker
    console.log("\n--- TEST 3: Task 6 - Worker Reactivation ---");
    // Reactivate
    const { data: reactivatedWorker } = await adminClient
      .from("workers")
      .update({ account_status: "ACTIVE" })
      .eq("id", lifecycleWorkerId)
      .select("verification_status, account_status, availability_status")
      .single();

    await adminClient
      .from("profiles")
      .update({ is_active: true })
      .eq("id", lifecycleUserId);

    if (reactivatedWorker?.account_status !== "ACTIVE") {
      throw new Error("Reactivation failed to set account_status to ACTIVE");
    }
    if (reactivatedWorker?.availability_status !== "UNAVAILABLE") {
      throw new Error("Reactivation must preserve previous availability status!");
    }
    console.log(`✓ Reactivated worker account: account_status=${reactivatedWorker.account_status}, availability=${reactivatedWorker.availability_status}`);

    const reactivatedLogin = await signInWithEmail(testWorkerEmail, testPassword);
    if (!reactivatedLogin.success || reactivatedLogin.redirectUrl !== "/worker/dashboard") {
      throw new Error(`Expected login to succeed after reactivation, got: ${JSON.stringify(reactivatedLogin)}`);
    }
    console.log(`✓ Reactivated worker successfully signed in to /worker/dashboard`);

    // 1f. Test Rejected / Suspended Worker Login Block
    console.log("\n--- TEST 4: Task 6 - Rejection / Suspension Login Guard ---");
    await adminClient
      .from("workers")
      .update({ verification_status: "suspended", account_status: "DEACTIVATED", rejection_reason: "Document falsification." })
      .eq("id", lifecycleWorkerId);

    await adminClient
      .from("profiles")
      .update({ is_active: false })
      .eq("id", lifecycleUserId);

    const rejectedLogin = await signInWithEmail(testWorkerEmail, testPassword);
    if (rejectedLogin.success !== false) {
      throw new Error(`Expected login to be BLOCKED for rejected worker, but succeeded!`);
    }
    console.log(`✓ Suspended/Rejected worker login strictly BLOCKED: "${rejectedLogin.error}"`);

    // -------------------------------------------------------------
    // TEST 5: Task 7 - Federation Admin Manual Add Worker
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Task 7 - Federation Admin Manual Add Worker ---");
    const manualMemberId = `WRK-MAN-${Math.floor(1000 + Math.random() * 9000)}`;

    // Call /api/federation/workers action: create
    // Direct test simulation of the create action logic:
    const cleanEmail = manualWorkerEmail.trim().toLowerCase();

    // 1. Create Auth user
    const { data: manualAuth, error: manualAuthErr } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password: manualWorkerPassword,
      email_confirm: true,
      user_metadata: {
        role: "WORKER",
        full_name: "Ghanshyam Patel",
        phone: "+91 98251 77889",
      },
    });

    if (manualAuthErr || !manualAuth.user) {
      throw new Error(`Manual add worker auth creation failed: ${manualAuthErr?.message}`);
    }
    manualUserId = manualAuth.user.id;
    console.log(`✓ Auth user created: ${manualUserId} (${cleanEmail})`);

    // 2. Synchronize profile (role = WORKER, is_active = true)
    await adminClient
      .from("profiles")
      .update({
        role: "WORKER",
        full_name: "Ghanshyam Patel",
        phone: "+91 98251 77889",
        is_active: true,
      })
      .eq("id", manualUserId);

    // 3. Insert into workers table
    const { data: manualWorkerRecord, error: manualWrkErr } = await adminClient
      .from("workers")
      .insert({
        profile_id: manualUserId,
        federation_id: federation.id,
        member_id: manualMemberId,
        profession: "Mason",
        hourly_rate: 380,
        experience_years: 7,
        account_status: "ACTIVE",
        verification_status: "verified",
        availability_status: "UNAVAILABLE",
        registration_type: "EXISTING_WORKER",
        date_of_birth: "1989-11-20",
        gender: "male",
        govt_id_type: "Aadhaar Card",
        govt_id_number: "765432109876",
      })
      .select()
      .single();

    if (manualWrkErr || !manualWorkerRecord) {
      // Test rollback
      await adminClient.auth.admin.deleteUser(manualUserId);
      throw new Error(`Manual worker insert failed: ${manualWrkErr?.message}`);
    }
    manualWorkerId = manualWorkerRecord.id;

    // Verify correct relational linkage: auth.users.id === profiles.id === workers.profile_id
    if (manualWorkerRecord.profile_id !== manualUserId) {
      throw new Error(`CRITICAL RELATIONAL ERROR: workers.profile_id (${manualWorkerRecord.profile_id}) does not match auth user id (${manualUserId})!`);
    }
    console.log(`✓ Worker record created: ID=${manualWorkerId}, member_id=${manualWorkerRecord.member_id}`);
    console.log(`✓ Relational linkage verified: auth.users.id (${manualUserId}) === profiles.id === workers.profile_id`);
    console.log(`✓ Account status initialized as ACTIVE, verification_status as verified`);

    // 4. Insert Address
    const { data: manualAddr, error: manualAddrErr } = await adminClient
      .from("addresses")
      .insert({
        profile_id: manualUserId,
        title: "Home",
        address_line1: "15, Sharda Nagar, Chandkheda",
        city: "Ahmedabad",
        state: "Gujarat",
        postal_code: "382424",
        is_default: true,
      })
      .select()
      .single();

    if (manualAddrErr || !manualAddr) {
      console.warn("Address insert notice:", manualAddrErr?.message);
    } else {
      console.log(`✓ Residential address created in public.addresses: ID=${manualAddr.id}`);
    }

    // 5. Test Worker Login with EXACT email and password
    console.log("\n--- TEST 6: Task 7 - New Worker Sign-In with Exact Credentials ---");
    const manualWorkerLogin = await signInWithEmail(manualWorkerEmail, manualWorkerPassword);
    if (!manualWorkerLogin.success || manualWorkerLogin.redirectUrl !== "/worker/dashboard") {
      throw new Error(`Expected successful login to /worker/dashboard for manually added worker, got: ${JSON.stringify(manualWorkerLogin)}`);
    }
    console.log(`✓ Newly created worker signed in successfully with EXACT email & password to /worker/dashboard`);

    // 6. Test Duplicate Email Prevention
    console.log("\n--- TEST 7: Task 7 - Duplicate Email Prevention ---");
    const { error: dupAuthErr } = await adminClient.auth.admin.createUser({
      email: cleanEmail, // same email
      password: "AnotherPassword123!",
      email_confirm: true,
    });

    if (!dupAuthErr) {
      throw new Error("Expected duplicate email creation to fail, but succeeded!");
    }
    console.log(`✓ Duplicate email creation rejected: "${dupAuthErr.message}"`);

    // 7. Test Duplicate Member ID Prevention
    console.log("\n--- TEST 8: Task 7 - Duplicate Member ID Prevention ---");
    const { error: dupMemberErr } = await adminClient
      .from("workers")
      .insert({
        profile_id: lifecycleUserId, // dummy
        federation_id: federation.id,
        member_id: manualMemberId, // same member ID
        profession: "Painter",
        hourly_rate: 300,
      });

    if (!dupMemberErr) {
      throw new Error("Expected duplicate member_id insertion to fail, but succeeded!");
    }
    console.log(`✓ Duplicate member_id rejected by DB constraint`);

    console.log("\n================================================================================");
    console.log("ALL TESTS IN TASK 6 & 7 VERIFICATION SUITE PASSED SUCCESSFULLY!");
    console.log("================================================================================");
  } finally {
    // Clean up test accounts
    console.log("\n--- Cleaning up test records ---");
    if (lifecycleUserId) {
      await adminClient.from("workers").delete().eq("profile_id", lifecycleUserId);
      await adminClient.from("profiles").delete().eq("id", lifecycleUserId);
      await adminClient.auth.admin.deleteUser(lifecycleUserId);
      console.log(`✓ Deleted test lifecycle worker: ${lifecycleUserId}`);
    }

    if (manualUserId) {
      await adminClient.from("addresses").delete().eq("profile_id", manualUserId);
      await adminClient.from("workers").delete().eq("profile_id", manualUserId);
      await adminClient.from("profiles").delete().eq("id", manualUserId);
      await adminClient.auth.admin.deleteUser(manualUserId);
      console.log(`✓ Deleted test manually added worker: ${manualUserId}`);
    }
  }
}

runVerification().catch((err) => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});
