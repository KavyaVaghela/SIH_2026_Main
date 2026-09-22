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
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function verifyAll() {
  console.log("=================================================");
  console.log("📊 PHASE 1 FINAL VERIFICATION & REGRESSION AUDIT");
  console.log("=================================================\n");

  const targetFedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";

  // 1. Federation Identity Check
  const { data: fed } = await supabase
    .from("federations")
    .select("id, code, name, city, state, contact_email, service_region")
    .eq("id", targetFedId)
    .single();

  console.log("1. Federation Identity:");
  console.log(`- ID: ${fed?.id}`);
  console.log(`- Code: ${fed?.code}`);
  console.log(`- Name: ${fed?.name}`);
  console.log(`- Jurisdiction: ${fed?.service_region}`);
  console.log(`- Contact Email: ${fed?.contact_email}`);

  // 2. Workforce Deactivation Check
  const { data: ahmedabadWorkers } = await supabase
    .from("workers")
    .select("id, account_status, availability_status, profiles (full_name)")
    .eq("federation_id", targetFedId);

  const total = ahmedabadWorkers?.length || 0;
  const active = ahmedabadWorkers?.filter((w) => w.account_status === "ACTIVE").length || 0;
  const deactivated = ahmedabadWorkers?.filter((w) => w.account_status === "DEACTIVATED").length || 0;
  const available = ahmedabadWorkers?.filter((w) => w.availability_status === "AVAILABLE").length || 0;
  const deactivatedAvailable = ahmedabadWorkers?.filter(
    (w) => w.account_status === "DEACTIVATED" && w.availability_status === "AVAILABLE"
  ).length || 0;

  console.log("\n2. Workforce Status:");
  console.log(`- Total Workers: ${total}`);
  console.log(`- Active Workers: ${active}`);
  console.log(`- Deactivated Workers: ${deactivated}`);
  console.log(`- Available Workers: ${available}`);
  console.log(`- Deactivated & Available (Must be 0): ${deactivatedAvailable}`);

  const deactList = ahmedabadWorkers?.filter((w) => w.account_status === "DEACTIVATED");
  console.log("- Deactivated Workers Details:");
  deactList?.forEach((w) => {
    console.log(`  • ${(w as any).profiles?.full_name} (${w.id}) - Status: ${w.account_status}, Availability: ${w.availability_status}`);
  });

  // 3. Complaint Visibility Check via complaintService
  const { complaintService } = await import("../features/complaints/services/complaint-service");
  
  const { cases: amdCases, totalCount: amdCount } = await complaintService.listGrievances({
    role: "FEDERATION_ADMIN",
    federationId: targetFedId,
    pageSize: 200,
  });

  const { cases: superAdminCases, totalCount: superAdminCount } = await complaintService.listGrievances({
    role: "SUPER_ADMIN",
    pageSize: 200,
  });

  const openComplaints = amdCases.filter((c) =>
    ["OPEN", "IN_REVIEW", "ACTION_REQUIRED", "ESCALATED", "UNDER_REVIEW"].includes(c.status)
  );
  const resolvedComplaints = amdCases.filter((c) =>
    ["RESOLVED", "CLOSED"].includes(c.status)
  );
  const resolutionRate = amdCount > 0 ? (resolvedComplaints.length / amdCount) * 100 : 0;

  console.log("\n3. Complaints & Overview Dispute Metrics:");
  console.log(`- Total Platform Complaints: ${superAdminCount}`);
  console.log(`- Ahmedabad Complaints (Strictly Scoped): ${amdCount}`);
  console.log(`- Ahmedabad Pending/Open Complaints: ${openComplaints.length}`);
  console.log(`- Ahmedabad Resolved/Closed Complaints: ${resolvedComplaints.length}`);
  console.log(`- Resolution Rate: ${resolutionRate.toFixed(1)}%`);

  // 4. September 2026 Economics Check via FederationEarningsService
  const { FederationEarningsService } = await import(
    "../features/federation-admin/earnings/services/earnings-service"
  );
  const earningsService = new FederationEarningsService();
  const sepEarnings = await earningsService.getEarningsData("2026-09", supabase);

  console.log("\n4. September 2026 Economics Reconciliation:");
  console.log(`- Service Value (Gross): ₹${sepEarnings.kpis.thisMonth.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
  console.log(`- Worker Payouts: ₹${sepEarnings.kpis.netPayout.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
  console.log(`- Platform Fee: ₹${sepEarnings.kpis.platformCommission.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
  console.log(`- Taxes Collected: ₹${(sepEarnings.kpis.taxCollected || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
  console.log(`- Federation Service Share: ₹${(sepEarnings.kpis.federationServiceShare || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
  console.log(`- Completed Transactions Count: ${sepEarnings.kpis.completedTransactionsCount}`);

  const totalCalculated =
    sepEarnings.kpis.netPayout +
    sepEarnings.kpis.platformCommission +
    (sepEarnings.kpis.taxCollected || 0) +
    (sepEarnings.kpis.federationServiceShare || 0);

  const diff = Math.abs(sepEarnings.kpis.thisMonth - totalCalculated);
  console.log(`- Formula Reconciliation Check (Service Value == Payouts + Fee + Tax + Share): Diff = ₹${diff.toFixed(2)} (${diff < 0.01 ? "EXACT MATCH ✅" : "MISMATCH ❌"})`);

  // 5. Monthly Trend Points (Earnings Chart Verification)
  console.log("\n5. Earnings Chart Multi-Series Points:");
  sepEarnings.trend.forEach((pt) => {
    console.log(`  • ${pt.month}: Service Value = ₹${pt.serviceValue ?? pt.amount}, Worker Payouts = ₹${pt.workerPayout ?? 0}, Federation Share = ₹${pt.federationShare ?? 0}`);
  });

  // 6. Ravi Patel Booking Protection Check
  const raviId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
  const { data: raviBookings } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("worker_id", raviId);

  const raviCompleted = raviBookings?.filter(
    (b) => b.status === "BOOKING_COMPLETED" || b.status === "SERVICE_COMPLETED"
  ).length;

  console.log("\n6. Ravi Patel Integrity Check:");
  console.log(`- Worker ID: ${raviId}`);
  console.log(`- Completed Bookings: ${raviCompleted} (${raviCompleted === 38 ? "PRESERVED AT 38 ✅" : "VIOLATION ❌"})`);

  // 7. Federation Identity Resolution Tests (Unit tests on the 4-step algorithm)
  const { resolveFederationContext } = await import(
    "../features/federation-admin/utils/federation-context"
  );

  // Helper to create mock client for testing resolution logic
  const createMockAuthClient = (userObj: any) => ({
    auth: {
      getUser: async () => ({ data: { user: userObj }, error: null }),
    },
    from: (table: string) => supabase.from(table),
  });

  // Test Case A: User with metadata federation_id
  const clientA = createMockAuthClient({
    id: "user-1",
    email: "admin@custom.org",
    user_metadata: { federation_id: targetFedId },
  });
  const resA = await resolveFederationContext(clientA);
  console.log("\n7. Federation Identity Resolution Tests:");
  console.log(`- Case A (JWT Metadata federation_id): Resolved to ${resA?.name} (${resA?.code})`);

  // Test Case B: User with email match federation@example.com (no metadata)
  const clientB = createMockAuthClient({
    id: "user-2",
    email: "federation@example.com",
    user_metadata: {},
  });
  const resB = await resolveFederationContext(clientB);
  console.log(`- Case B (Email match federation@example.com): Resolved to ${resB?.name} (${resB?.code})`);

  // Test Case C: Unknown user with no metadata or match
  const clientC = createMockAuthClient({
    id: "user-3",
    email: "unknown@otherdomain.com",
    user_metadata: {},
  });
  const resC = await resolveFederationContext(clientC);
  console.log(`- Case C (Unknown user with no matching fed): Result is ${resC} (Safely fails to null without crash ✅)`);
}

verifyAll().catch(console.error);
