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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminClient = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("=== PHASE 0: FEDERATION DATA & ARCHITECTURE AUDIT (PASS 2) ===");

  // 1. Paged user search
  let allUsers: any[] = [];
  let page = 1;
  while (true) {
    const { data: usersData, error } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !usersData.users.length) break;
    allUsers.push(...usersData.users);
    if (usersData.users.length < 100) break;
    page++;
  }
  console.log(`Total auth.users count: ${allUsers.length}`);

  const fedUser = allUsers.find((u) => u.email === "federation@example.com");
  console.log("\n1. AUTH USER (federation@example.com):");
  if (fedUser) {
    console.log(`- ID: ${fedUser.id}`);
    console.log(`- Email: ${fedUser.email}`);
    console.log(`- Created At: ${fedUser.created_at}`);
    console.log(`- User Metadata:`, JSON.stringify(fedUser.user_metadata));

    // Profile for this user
    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", fedUser.id)
      .maybeSingle();
    console.log("\n2. PROFILE ROW for federation@example.com:");
    console.log(profile);
  } else {
    console.log("federation@example.com STILL NOT FOUND. Checking users with 'fed' in email:");
    const fedLike = allUsers.filter((u) => u.email?.includes("fed"));
    console.log(fedLike.map((u) => ({ id: u.id, email: u.email })));
  }

  // Target Federation: Ahmedabad Skilled Workers Federation
  const targetFedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
  const { data: targetFed } = await adminClient
    .from("federations")
    .select("*")
    .eq("id", targetFedId)
    .single();

  console.log("\n3. TARGET FEDERATION (Ahmedabad Skilled Workers Federation):");
  console.log(targetFed);

  // 4. Workers associated with this federation
  const { data: workers } = await adminClient
    .from("workers")
    .select("id, profile_id, account_status, availability_status, profession, hourly_rate, rating, total_jobs_completed")
    .eq("federation_id", targetFedId);
  console.log(`\n4. WORKERS for Ahmedabad Fed (${targetFedId}):`);
  console.log(`Total workers: ${workers?.length || 0}`);
  const activeWorkers = workers?.filter((w) => w.account_status === "ACTIVE") || [];
  const deactivatedWorkers = workers?.filter((w) => w.account_status === "DEACTIVATED") || [];
  const availableWorkers = workers?.filter((w) => w.availability_status === "AVAILABLE") || [];
  const busyWorkers = workers?.filter((w) => w.availability_status === "BUSY") || [];
  const unavailableWorkers = workers?.filter((w) => w.availability_status === "UNAVAILABLE") || [];
  console.log(`- Active: ${activeWorkers.length}, Deactivated: ${deactivatedWorkers.length}`);
  console.log(`- Available: ${availableWorkers.length}, Busy: ${busyWorkers.length}, Unavailable: ${unavailableWorkers.length}`);
  
  // Worker profiles
  if (workers && workers.length > 0) {
    const profileIds = workers.map(w => w.profile_id);
    const { data: profs } = await adminClient.from("profiles").select("id, full_name, phone, role").in("id", profileIds.slice(0, 5));
    console.log("Worker profiles sample:", profs);

    const workerIds = workers.map(w => w.id);
    const { data: skills } = await adminClient.from("worker_skills").select("*").in("worker_id", workerIds);
    console.log(`Total worker_skills for this fed: ${skills?.length || 0}`);

    const { data: certs } = await adminClient.from("worker_certifications").select("*").in("worker_id", workerIds);
    console.log(`Total worker_certifications for this fed: ${certs?.length || 0}`);

    // Check worker verification / documents tables
    // Let's check what tables exist in supabase schema related to documents or worker verification
  }

  // 5. Worker requests (onboarding requests)
  console.log("\n5. WORKER REQUESTS / ONBOARDING:");
  // Let's check worker_onboarding or worker_requests or registration tables
  try {
    const { data: wr, error: wrErr } = await adminClient.from("worker_requests").select("*");
    console.log("worker_requests table:", wr ? wr.length : wrErr?.message);
  } catch (e: any) {
    console.log("worker_requests err:", e.message);
  }

  // 6. Bookings
  const { data: bookings } = await adminClient
    .from("bookings")
    .select("id, status, total_amount, created_at, scheduled_start_at")
    .eq("federation_id", targetFedId);
  console.log(`\n6. BOOKINGS for Ahmedabad Fed (${targetFedId}):`);
  console.log(`Total bookings: ${bookings?.length || 0}`);
  const statusCounts: Record<string, number> = {};
  let totalRevenue = 0;
  bookings?.forEach((b) => {
    statusCounts[b.status || "UNKNOWN"] = (statusCounts[b.status || "UNKNOWN"] || 0) + 1;
    totalRevenue += Number(b.total_amount || 0);
  });
  console.log("Status distribution:", statusCounts);
  console.log("Sum of total_amount:", totalRevenue);

  // 7. Invoices & Payments & Federation Share / Earnings
  console.log("\n7. INVOICES & EARNINGS:");
  const { data: invoices } = await adminClient
    .from("invoices")
    .select("*")
    .eq("federation_id", targetFedId);
  console.log(`Invoices count for fed: ${invoices?.length || 0}`);
  if (invoices && invoices.length > 0) {
    console.log("Sample invoice columns:", Object.keys(invoices[0]));
    console.log("Sample invoice:", invoices[0]);
  }

  // Check all invoices without federation filter to see what federation_id is stored
  const { data: allInvoices } = await adminClient.from("invoices").select("id, federation_id, total_amount, platform_fee, status").limit(10);
  console.log("All invoices sample:", allInvoices);

  // 8. Complaints
  console.log("\n8. COMPLAINTS:");
  const { data: allComplaints } = await adminClient.from("complaints").select("id, status, category, created_at, description");
  let ahmComplaints = 0;
  let ahmResolved = 0;
  let ahmWaiting = 0;
  allComplaints?.forEach((c) => {
    try {
      const desc = JSON.parse(c.description || "{}");
      if (desc.federationId === targetFedId) {
        ahmComplaints++;
        if (c.status === "RESOLVED" || desc.status === "RESOLVED") ahmResolved++;
        if (desc.status === "ACTION_REQUIRED") ahmWaiting++;
      }
    } catch {}
  });
  console.log(`Ahmedabad complaints count: ${ahmComplaints} (Resolved: ${ahmResolved}, Waiting: ${ahmWaiting})`);

  // Check what columns are on complaints table directly
  const { data: sampleComp } = await adminClient.from("complaints").select("*").limit(2);
  console.log("Sample complaint record:", sampleComp);

  // 9. Emergency records
  console.log("\n9. EMERGENCY RECORDS:");
  try {
    const { data: emIncidents } = await adminClient.from("emergency_incidents").select("*").eq("federation_id", targetFedId);
    console.log(`emergency_incidents for fed: ${emIncidents?.length || 0}`);
  } catch (e: any) {
    console.log("emergency_incidents err:", e.message);
  }
  try {
    const { data: allEmIncidents } = await adminClient.from("emergency_incidents").select("id, federation_id, emergency_type, status").limit(5);
    console.log(`all emergency_incidents sample:`, allEmIncidents);
  } catch (e: any) {
    console.log("all em incidents err:", e.message);
  }

  // 10. Large Projects
  console.log("\n10. LARGE PROJECTS:");
  try {
    const { data: prjReqs } = await adminClient.from("project_requests").select("*").eq("federation_id", targetFedId);
    console.log(`project_requests for fed: ${prjReqs?.length || 0}`);
    const { data: allPrj } = await adminClient.from("project_requests").select("id, federation_id, title, status").limit(5);
    console.log(`all project_requests sample:`, allPrj);
  } catch (e: any) {
    console.log("project_requests err:", e.message);
  }
}

runAudit().catch(console.error);
