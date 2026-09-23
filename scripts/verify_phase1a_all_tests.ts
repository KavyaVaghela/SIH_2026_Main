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

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function runAllTests() {
  console.log("==================================================");
  console.log("PHASE 1A — VERIFICATION OF ALL 8 TESTS");
  console.log("==================================================");

  // Authenticate as federation admin to get real Bearer token (matching browser behavior)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  const { data: signData } = await anonClient.auth.signInWithPassword({
    email: "federation@example.com",
    password: "Password123!"
  });
  const bearerToken = signData?.session?.access_token;
  const authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {})
  };
  console.log("Federation Admin Authenticated:", !!bearerToken);

  // -------------------------------------------------------------------------
  // TEST A: OVERVIEW
  // -------------------------------------------------------------------------
  console.log("\n--- TEST A: OVERVIEW API ---");
  const { GET: getDashboard } = await import("../app/api/federation-admin/dashboard/route");
  const dashReq = new Request("http://localhost:3000/api/federation-admin/dashboard?timeframe=30d", {
    headers: authHeaders
  });
  const dashRes = await getDashboard(dashReq as any);
  const dashData = await dashRes.json();
  console.log("Overview Status:", dashRes.status);
  console.log("Federation Identity:", dashData.federation?.name, dashData.federation?.code);
  console.log("Overview Jobs KPIs:", dashData.stats?.jobs);
  console.log("Overview Workers KPIs:", dashData.stats?.workers);
  console.log("Overview Performance:", dashData.stats?.performance);

  const testAPassed =
    dashData.stats?.jobs?.totalJobs > 0 &&
    dashData.stats?.jobs?.completedJobs > 0 &&
    dashData.stats?.jobs?.runningJobs > 0;
  console.log("TEST A RESULT:", testAPassed ? "PASSED" : "FAILED");

  // -------------------------------------------------------------------------
  // TEST B & C & D: EARNINGS API, GRAPH & RECENT TRANSACTIONS
  // -------------------------------------------------------------------------
  console.log("\n--- TEST B, C, D: EARNINGS API, GRAPH & RECENT ---");
  const { GET: getEarnings } = await import("../app/api/federation-admin/earnings/route");
  const earnReq = new Request("http://localhost:3000/api/federation-admin/earnings?month=2026-09", {
    headers: authHeaders
  });
  const earnRes = await getEarnings(earnReq as any);
  const earnData = await earnRes.json();
  console.log("Earnings Status:", earnRes.status);
  console.log("Earnings KPIs:", earnData.kpis);
  console.log("Trend Data Points (Graph Source):", earnData.trend?.length);
  if (earnData.trend?.length > 0) {
    console.log("First & Last Trend Points:", earnData.trend[0], earnData.trend[earnData.trend.length - 1]);
  }
  console.log("Recent Transactions Count:", earnData.recentTransactions?.length);
  if (earnData.recentTransactions?.length > 0) {
    console.log("Latest Transaction:", earnData.recentTransactions[0]);
  }

  const testBPassed =
    earnData.kpis?.totalEarnings > 0 &&
    earnData.kpis?.thisMonth > 0 &&
    earnData.kpis?.netPayout > 0 &&
    earnData.kpis?.completedTransactionsCount > 0;
  const testCPassed = Array.isArray(earnData.trend) && earnData.trend.length === 6 && earnData.trend.some((t: any) => t.serviceValue > 0);
  const testDPassed = Array.isArray(earnData.recentTransactions) && earnData.recentTransactions.length > 0;
  console.log("TEST B RESULT (KPIs):", testBPassed ? "PASSED" : "FAILED");
  console.log("TEST C RESULT (Graph):", testCPassed ? "PASSED" : "FAILED");
  console.log("TEST D RESULT (Recent):", testDPassed ? "PASSED" : "FAILED");

  // -------------------------------------------------------------------------
  // TEST H: WORKFORCE INTELLIGENCE AVAILABLE COUNT
  // -------------------------------------------------------------------------
  console.log("\n--- TEST H: WORKFORCE INTELLIGENCE ---");
  const { GET: getIntel } = await import("../app/api/federation-admin/workforce-intelligence/route");
  const intelReq = new Request("http://localhost:3000/api/federation-admin/workforce-intelligence", {
    headers: authHeaders
  });
  const intelRes = await getIntel(intelReq as any);
  const intelData = await intelRes.json();
  console.log("Total Workers:", intelData.totalWorkers, "Available:", intelData.availableWorkersCount);
  console.log("High Demand Trades Sample:");
  let testHPassed = true;
  intelData.highDemandTrades?.slice(0, 4).forEach((item: any) => {
    const stats = intelData.workersByTrade[item.trade];
    console.log(`  Trade "${item.trade}": Requests = ${item.demandCount}, Available = ${stats?.available} (total: ${stats?.total})`);
  });
  // Check specifically Plumbing
  const plumbingStats = intelData.workersByTrade["Plumbing"];
  console.log("Plumbing Trade Stats:", plumbingStats);
  if (!plumbingStats || plumbingStats.available === 0) testHPassed = false;
  console.log("TEST H RESULT (Intelligence Available):", testHPassed ? "PASSED" : "FAILED");

  // -------------------------------------------------------------------------
  // TEST E: WORKER DEACTIVATION (Protected & Allowed)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST E: WORKER DEACTIVATION ---");
  const { POST: postWorker } = await import("../app/api/federation/workers/route");

  // 1. Find a worker with active booking (protection check)
  const { data: activeBooking } = await adminClient.from("bookings")
    .select("worker_id, status")
    .eq("federation_id", "b765df3b-c418-4a15-b79f-3cbc09e475dc")
    .in("status", ["SERVICE_STARTED", "ARRIVED", "ON_THE_WAY", "OTP_VERIFIED", "BOOKING_CONFIRMED", "WORKER_ACCEPTED"])
    .not("worker_id", "is", null)
    .limit(1)
    .single();

  if (activeBooking?.worker_id) {
    console.log("Testing deactivation protection on busy worker:", activeBooking.worker_id);
    const protectReq = new Request("http://localhost:3000/api/federation/workers", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "status", workerId: activeBooking.worker_id, status: "DEACTIVATED" })
    });
    const protectRes = await postWorker(protectReq as any);
    const protectJson = await protectRes.json();
    console.log("Protection check status (expected 400):", protectRes.status, "Message:", protectJson.error);
  }

  // 2. Find a safely deactivatable worker (available, no active commitments)
  const { data: safeWorker } = await adminClient.from("workers")
    .select("id, profile_id, account_status, availability_status, verification_status")
    .eq("federation_id", "b765df3b-c418-4a15-b79f-3cbc09e475dc")
    .eq("account_status", "ACTIVE")
    .eq("verification_status", "verified");

  let targetSafeWorker: any = null;
  for (const w of (safeWorker || [])) {
    const [bks, emg, prj] = await Promise.all([
      adminClient.from("bookings").select("id").eq("worker_id", w.id).in("status", [
        "SERVICE_STARTED", "ARRIVED", "ON_THE_WAY", "OTP_VERIFIED", "BOOKING_CONFIRMED", "WORKER_ACCEPTED"
      ]).limit(1),
      adminClient.from("emergency_tasks").select("id").eq("worker_id", w.id).in("status", ["ASSIGNED", "IN_PROGRESS", "EN_ROUTE"]).limit(1),
      adminClient.from("project_allocations").select("id").eq("worker_id", w.id).in("status", ["ASSIGNED", "ACTIVE", "IN_PROGRESS"]).limit(1),
    ]);
    if ((!bks.data || bks.data.length === 0) && (!emg.data || emg.data.length === 0) && (!prj.data || prj.data.length === 0)) {
      targetSafeWorker = w;
      break;
    }
  }

  let testEPassed = false;
  if (targetSafeWorker) {
    console.log("Testing deactivation on safe worker:", targetSafeWorker.id);
    const deactReq = new Request("http://localhost:3000/api/federation/workers", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "status", workerId: targetSafeWorker.id, status: "DEACTIVATED" })
    });
    const deactRes = await postWorker(deactReq as any);
    const deactJson = await deactRes.json();
    console.log("Deactivation response status:", deactRes.status, deactJson);

    // Verify DB
    const { data: dbCheck } = await adminClient.from("workers").select("account_status, availability_status").eq("id", targetSafeWorker.id).single();
    const { data: pCheck } = await adminClient.from("profiles").select("is_active").eq("id", targetSafeWorker.profile_id).single();
    console.log("DB after deactivation:", { account_status: dbCheck?.account_status, availability_status: dbCheck?.availability_status, profile_active: pCheck?.is_active });

    if (dbCheck?.account_status === "DEACTIVATED" && pCheck?.is_active === false) {
      testEPassed = true;
    }

    // Reactivate back so we preserve data state
    const reactReq = new Request("http://localhost:3000/api/federation/workers", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "status", workerId: targetSafeWorker.id, status: "ACTIVE" })
    });
    await postWorker(reactReq as any);
    console.log("Restored worker back to ACTIVE.");
  }
  console.log("TEST E RESULT (Deactivation):", testEPassed ? "PASSED" : "FAILED");

  // -------------------------------------------------------------------------
  // TEST F: PUBLIC REGISTRATION -> FEDERATION ADMIN ACCEPT
  // -------------------------------------------------------------------------
  console.log("\n--- TEST F: WORKER REGISTRATION & ACCEPT ---");
  const testAcceptEmail = "test_phase1a_accept@example.com";
  // Clean up if exists
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const existingAcceptUser = existingUsers?.users?.find(u => u.email === testAcceptEmail);
  if (existingAcceptUser) {
    await adminClient.from("workers").delete().eq("profile_id", existingAcceptUser.id);
    await adminClient.auth.admin.deleteUser(existingAcceptUser.id);
  }

  // 1. Register new worker
  const { POST: postRegister } = await import("../app/api/auth/register/route");
  const regPayload = {
    role: "WORKER",
    email: testAcceptEmail,
    password: "Password123!",
    fullName: "Karan Dave",
    phone: "+919898012345",
    federationId: "b765df3b-c418-4a15-b79f-3cbc09e475dc",
    profession: "Plumber",
    experienceYears: 5,
    dateOfBirth: "1994-08-20",
    govtIdType: "aadhar",
    govtIdNumber: "998877665544"
  };
  const regReq = new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(regPayload)
  });
  const regRes = await postRegister(regReq as any);
  const regJson = await regRes.json();
  console.log("Registration API response:", regRes.status, regJson.status);

  // 2. Verify worker appears in Federation Admin applications GET
  const { GET: getWorkers } = await import("../app/api/federation/workers/route");
  const appReq = new Request("http://localhost:3000/api/federation/workers?type=applications&status=PENDING", {
    headers: authHeaders
  });
  const appRes = await getWorkers(appReq as any);
  const appJson = await appRes.json();
  const foundInApps = appJson.applications?.find((a: any) => a.email === testAcceptEmail);
  console.log("Found in Pending Applications queue:", !!foundInApps, foundInApps?.applicantName);

  // 3. Accept application
  let testFPassed = false;
  if (foundInApps) {
    const acceptReq = new Request("http://localhost:3000/api/federation/workers", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "accept", workerId: foundInApps.id })
    });
    const acceptRes = await postWorker(acceptReq as any);
    const acceptJson = await acceptRes.json();
    console.log("Accept API status:", acceptRes.status, "Member ID:", acceptJson.memberId);

    // Verify DB
    const { data: acceptedWorker } = await adminClient.from("workers")
      .select("verification_status, account_status, availability_status, member_id")
      .eq("id", foundInApps.id)
      .single();
    const { data: acceptedProfile } = await adminClient.from("profiles")
      .select("is_active")
      .eq("id", regJson.user?.id)
      .single();

    console.log("DB verification_status:", acceptedWorker?.verification_status);
    console.log("DB account_status:", acceptedWorker?.account_status);
    console.log("DB profile is_active:", acceptedProfile?.is_active);

    if (
      acceptedWorker?.verification_status === "verified" &&
      acceptedWorker?.account_status === "ACTIVE" &&
      acceptedProfile?.is_active === true
    ) {
      testFPassed = true;
    }
  }
  console.log("TEST F RESULT (Register & Accept):", testFPassed ? "PASSED" : "FAILED");

  // -------------------------------------------------------------------------
  // TEST G: WORKER REGISTRATION & REJECT
  // -------------------------------------------------------------------------
  console.log("\n--- TEST G: WORKER REGISTRATION & REJECT ---");
  const testRejectEmail = "test_phase1a_reject@example.com";
  const existingRejectUser = existingUsers?.users?.find(u => u.email === testRejectEmail);
  if (existingRejectUser) {
    await adminClient.from("workers").delete().eq("profile_id", existingRejectUser.id);
    await adminClient.auth.admin.deleteUser(existingRejectUser.id);
  }

  // 1. Register new worker
  const rejPayload = {
    role: "WORKER",
    email: testRejectEmail,
    password: "Password123!",
    fullName: "Vijay Mehta",
    phone: "+919898098765",
    federationId: "b765df3b-c418-4a15-b79f-3cbc09e475dc",
    profession: "Electrician",
    experienceYears: 2,
    dateOfBirth: "1996-02-12",
    govtIdType: "aadhar",
    govtIdNumber: "112233445566"
  };
  const rejRegReq = new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rejPayload)
  });
  const rejRegRes = await postRegister(rejRegReq as any);
  const rejRegJson = await rejRegRes.json();

  // 2. Reject application
  const { data: workerToReject } = await adminClient.from("workers")
    .select("id")
    .eq("profile_id", rejRegJson.user?.id)
    .single();

  let testGPassed = false;
  if (workerToReject) {
    const rejectReq = new Request("http://localhost:3000/api/federation/workers", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        action: "reject",
        workerId: workerToReject.id,
        rejectionReason: "Incomplete identification documents provided."
      })
    });
    const rejectRes = await postWorker(rejectReq as any);
    const rejectJson = await rejectRes.json();
    console.log("Reject API status:", rejectRes.status, "Reason:", rejectJson.rejectionReason);

    // Verify DB
    const { data: rejectedWorker } = await adminClient.from("workers")
      .select("verification_status, account_status, rejection_reason")
      .eq("id", workerToReject.id)
      .single();
    const { data: rejectedProfile } = await adminClient.from("profiles")
      .select("is_active")
      .eq("id", rejRegJson.user?.id)
      .single();

    console.log("DB verification_status:", rejectedWorker?.verification_status);
    console.log("DB account_status:", rejectedWorker?.account_status);
    console.log("DB rejection_reason:", rejectedWorker?.rejection_reason);
    console.log("DB profile is_active:", rejectedProfile?.is_active);

    if (
      rejectedWorker?.verification_status === "suspended" &&
      rejectedWorker?.account_status === "DEACTIVATED" &&
      rejectedProfile?.is_active === false
    ) {
      testGPassed = true;
    }
  }
  console.log("TEST G RESULT (Reject):", testGPassed ? "PASSED" : "FAILED");

  console.log("\n==================================================");
  console.log("ALL TESTS SUMMARY:");
  console.log("TEST A (Overview):", testAPassed ? "PASS" : "FAIL");
  console.log("TEST B (Earnings KPIs):", testBPassed ? "PASS" : "FAIL");
  console.log("TEST C (Trend Graph):", testCPassed ? "PASS" : "FAIL");
  console.log("TEST D (Recent Records):", testDPassed ? "PASS" : "FAIL");
  console.log("TEST E (Deactivation):", testEPassed ? "PASS" : "FAIL");
  console.log("TEST F (Accept Flow):", testFPassed ? "PASS" : "FAIL");
  console.log("TEST G (Reject Flow):", testGPassed ? "PASS" : "FAIL");
  console.log("TEST H (Workforce Intel):", testHPassed ? "PASS" : "FAIL");
  console.log("==================================================");

  // Clean up test users created during test F & G
  try {
    const { data: usersToClean } = await adminClient.auth.admin.listUsers();
    for (const testEmail of [testAcceptEmail, testRejectEmail]) {
      const u = usersToClean?.users?.find(user => user.email === testEmail);
      if (u) {
        await adminClient.from("workers").delete().eq("profile_id", u.id);
        await adminClient.from("profiles").delete().eq("id", u.id);
        await adminClient.auth.admin.deleteUser(u.id);
        console.log("Cleaned up test user:", testEmail);
      }
    }
  } catch (cleanErr) {
    console.warn("Notice: Test cleanup:", cleanErr);
  }
}

runAllTests().catch(console.error);
