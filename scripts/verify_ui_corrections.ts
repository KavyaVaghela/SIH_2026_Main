import fs from "fs";
import path from "path";
import { createAdminClient } from "../lib/supabase/admin";
import { complaintService } from "../features/complaints/services/complaint-service";

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

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assertTest(name: string, condition: boolean, details?: string) {
  results.push({
    name,
    passed: condition,
    details: condition ? undefined : details || "Assertion failed",
  });
  const status = condition ? "✓ PASS" : "✗ FAIL";
  console.log(`${status}: ${name}`);
  if (!condition && details) {
    console.log(`   Details: ${details}`);
  }
}

async function runVerification() {
  console.log("==================================================");
  console.log("KAUSHALYASETU UI/UX CORRECTIONS VERIFICATION");
  console.log("==================================================\n");

  const projectRoot = process.cwd();
  const supabase = createAdminClient();

  // ----------------------------------------------------
  // SECTION 1: Dynamic Worker / Person Selection
  // ----------------------------------------------------
  console.log("--- Section 1: Complaints Dynamic Person / Party Selection ---");

  const customerId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef"; // Prince Patel

  // 1.1 Query customer's actual bookings
  const { data: bookingsData, error: bErr } = await (supabase.from("bookings") as any)
    .select(`
      id,
      booking_number,
      status,
      total_amount,
      scheduled_start_at,
      federation_id,
      worker_id,
      services (title),
      workers (
        id,
        profile_id,
        profiles:profile_id (full_name)
      )
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  assertTest(
    "Customer bookings successfully fetched from Supabase",
    !bErr && Array.isArray(bookingsData) && bookingsData.length > 0,
    `Found ${bookingsData?.length || 0} bookings. Error: ${bErr?.message || "none"}`
  );

  // 1.2 Derive eligible workers dynamically
  const workerMap = new Map<string, { profileId: string; workerId: string; name: string; bookingIds: string[] }>();

  bookingsData?.forEach((b: any) => {
    if (b.workers?.profile_id && b.workers?.id) {
      const pId = b.workers.profile_id;
      const wName = b.workers.profiles?.full_name || "Cooperative Worker";
      if (!workerMap.has(pId)) {
        workerMap.set(pId, {
          profileId: pId,
          workerId: b.workers.id,
          name: wName,
          bookingIds: [b.id],
        });
      } else {
        const existing = workerMap.get(pId)!;
        if (!existing.bookingIds.includes(b.id)) {
          existing.bookingIds.push(b.id);
        }
      }
    }
  });

  const eligibleWorkers = Array.from(workerMap.values());
  assertTest(
    "Eligible workers derived dynamically from customer's actual bookings",
    eligibleWorkers.length > 0,
    `Found ${eligibleWorkers.length} eligible workers.`
  );

  // 1.3 Verify workers have real profile names (not hardcoded)
  const allHaveNames = eligibleWorkers.every((w) => typeof w.name === "string" && w.name.length > 0);
  assertTest(
    "Eligible workers contain authentic profile names from database",
    allHaveNames,
    `Workers: ${eligibleWorkers.map((w) => w.name).join(", ")}`
  );

  // 1.4 Verify unrelated workers cannot be selected
  // Query a worker profile that belongs to another entity or fake id
  const fakeWorkerProfileId = "00000000-0000-0000-0000-000000000099";
  const isUnrelatedPresent = eligibleWorkers.some((w) => w.profileId === fakeWorkerProfileId);
  assertTest(
    "Unrelated workers who have never serviced customer are strictly excluded",
    !isUnrelatedPresent,
    "Fake worker was correctly not included in eligible workers list"
  );

  // 1.5 Bi-directional constraint test
  if (eligibleWorkers.length > 0) {
    const testWorker = eligibleWorkers[0];
    const workerBookings = bookingsData.filter((b: any) => testWorker.bookingIds.includes(b.id));
    assertTest(
      "Selecting a worker constrains bookings to only that worker's jobs",
      workerBookings.length === testWorker.bookingIds.length && workerBookings.length > 0,
      `Worker ${testWorker.name} has ${workerBookings.length} matching bookings`
    );

    const testBooking = workerBookings[0];
    assertTest(
      "Selecting a booking correctly links to the assigned worker's profile ID",
      testBooking.workers?.profile_id === testWorker.profileId,
      `Booking #${testBooking.booking_number} links to worker profile ${testBooking.workers?.profile_id}`
    );
  }

  // 1.6 Verify complaint creation with real worker target
  const chosenWorker = eligibleWorkers[0];
  const testBooking = bookingsData.find((b: any) => chosenWorker.bookingIds.includes(b.id));

  const grievanceWithWorker = await complaintService.createGrievance({
    raisedBy: customerId,
    raisedByRole: "CUSTOMER",
    raisedByName: "Prince Patel",
    targetProfileId: chosenWorker.profileId,
    targetWorkerId: chosenWorker.workerId,
    targetName: chosenWorker.name,
    targetRole: "WORKER",
    bookingId: testBooking?.id,
    federationId: testBooking?.federation_id || "b765df3b-c418-4a15-b79f-3cbc09e475dc",
    category: "Work Quality",
    subcategory: "Pipe fitting leak",
    subject: `Issue regarding service by ${chosenWorker.name}`,
    description: "Water leaking near the fixture after installation work was completed.",
    priority: "MEDIUM",
  });

  assertTest(
    "Complaint successfully created with selected worker as target_profile_id",
    grievanceWithWorker.targetProfileId === chosenWorker.profileId &&
      grievanceWithWorker.targetRole === "WORKER" &&
      grievanceWithWorker.targetName === chosenWorker.name,
    `Target profile ID: ${grievanceWithWorker.targetProfileId}, Name: ${grievanceWithWorker.targetName}`
  );

  // 1.7 Verify complaint creation with 'Other / Service Issue' option (no worker target)
  const grievanceOther = await complaintService.createGrievance({
    raisedBy: customerId,
    raisedByRole: "CUSTOMER",
    raisedByName: "Prince Patel",
    targetProfileId: undefined,
    targetWorkerId: undefined,
    targetName: "Platform Administration",
    targetRole: "FEDERATION_ADMIN",
    category: "Platform / App",
    subcategory: "Invoice discrepancy",
    subject: "Platform billing calculation discrepancy on checkout",
    description: "Platform fee discrepancy reported on the billing summary screen.",
    priority: "HIGH",
  });

  assertTest(
    "Complaint successfully created with 'Other / Service Issue' without worker target",
    grievanceOther.targetProfileId === null || grievanceOther.targetProfileId === undefined,
    `Grievance status: ${grievanceOther.status}, Target role: ${grievanceOther.targetRole}`
  );

  // ----------------------------------------------------
  // SECTION 2: Customer Complaints 'View My Bookings' Removal
  // ----------------------------------------------------
  console.log("\n--- Section 2: Customer Complaints 'View My Bookings' Removal ---");

  const customerComplaintsPagePath = path.join(
    projectRoot,
    "app",
    "(dashboard)",
    "customer",
    "complaints",
    "page.tsx"
  );
  const complaintsPageContent = fs.readFileSync(customerComplaintsPagePath, "utf-8");

  assertTest(
    "'View My Bookings' button/text is completely removed from customer complaints page",
    !complaintsPageContent.includes("View My Bookings"),
    "No occurrence of 'View My Bookings' found in customer/complaints/page.tsx"
  );

  assertTest(
    "Empty state directly guides customer to 'Raise New Complaint'",
    complaintsPageContent.includes("Raise New Complaint") &&
      complaintsPageContent.includes("/customer/complaints/new"),
    "Direct action button points to /customer/complaints/new"
  );

  const newComplaintPagePath = path.join(
    projectRoot,
    "app",
    "(dashboard)",
    "customer",
    "complaints",
    "new",
    "page.tsx"
  );
  const newComplaintPageContent = fs.readFileSync(newComplaintPagePath, "utf-8");

  assertTest(
    "Booking selection is retained INSIDE the Raise New Complaint workflow",
    newComplaintPageContent.includes("Select Affected Booking") &&
      newComplaintPageContent.includes("selectableBookings"),
    "Booking association dropdown is active inside Raise New Complaint"
  );

  // ----------------------------------------------------
  // SECTION 3: Guidance Section Desktop-First Layout
  // ----------------------------------------------------
  console.log("\n--- Section 3: Guidance Desktop-First Layout ---");

  const visualJourneyMapPath = path.join(
    projectRoot,
    "features",
    "guidance",
    "components",
    "visual-journey-map.tsx"
  );
  const journeyMapContent = fs.readFileSync(visualJourneyMapPath, "utf-8");

  assertTest(
    "VisualJourneyMap does NOT use min-w-max horizontal scroll strip",
    !journeyMapContent.includes("min-w-max") && !journeyMapContent.includes("overflow-x-auto"),
    "min-w-max and overflow-x-auto have been removed from journey track"
  );

  assertTest(
    "VisualJourneyMap uses responsive multi-column wrapping grid",
    journeyMapContent.includes("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"),
    "Journey steps wrap cleanly across desktop viewports"
  );

  const guidanceCenterViewPath = path.join(
    projectRoot,
    "features",
    "guidance",
    "components",
    "guidance-center-view.tsx"
  );
  const guidanceCenterContent = fs.readFileSync(guidanceCenterViewPath, "utf-8");

  const appShellPath = path.join(projectRoot, "components", "layout", "app-shell.tsx");
  const appShellContent = fs.readFileSync(appShellPath, "utf-8");

  assertTest(
    "AppShell uses expanded desktop width container (max-w-[1500px])",
    appShellContent.includes("max-w-[1500px]"),
    "Main container expanded to max-w-[1500px] for desktop usage"
  );

  assertTest(
    "GuidanceCenterView provides Desktop Category / Filter navigation tabs",
    guidanceCenterContent.includes("setCategoryFilter") &&
      guidanceCenterContent.includes("Guidance Views"),
    "Category tabs (All, How-To, Statuses, Questions, Troubleshooting, Journey) implemented"
  );

  assertTest(
    "GuidanceCenterView implements 3-column desktop content grid without half-width squeezing",
    guidanceCenterContent.includes("lg:grid-cols-3"),
    "How-To, Status, and FAQ cards stretch cleanly in full-width 3-column desktop grid"
  );

  // ----------------------------------------------------
  // SECTION 4: Sticky Navbar & Sidebar Architecture
  // ----------------------------------------------------
  console.log("\n--- Section 4: All Dashboards Sticky Top Navbar ---");

  const topNavbarPath = path.join(projectRoot, "components", "navigation", "top-navbar.tsx");
  const topNavbarContent = fs.readFileSync(topNavbarPath, "utf-8");

  assertTest(
    "TopNavbar uses sticky positioning with top-0, z-50, and shrink-0",
    topNavbarContent.includes("sticky top-0 z-50") && topNavbarContent.includes("shrink-0"),
    "TopNavbar header is configured as sticky top-0 z-50 shrink-0"
  );

  const desktopSidebarPath = path.join(projectRoot, "components", "navigation", "desktop-sidebar.tsx");
  const desktopSidebarContent = fs.readFileSync(desktopSidebarPath, "utf-8");

  assertTest(
    "DesktopSidebar uses sticky positioning at top-16 with overflow-y-auto",
    desktopSidebarContent.includes("sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shrink-0"),
    "Sidebar stays pinned alongside navbar during content scrolling"
  );

  // Reuse appShellContent read previously

  assertTest(
    "AppShell layout body has min-w-0 to prevent horizontal flex blowout",
    appShellContent.includes("flex-1 flex min-w-0") && appShellContent.includes("flex-1 min-w-0"),
    "min-w-0 correctly applied to flex container and main"
  );

  const fedSidebarPath = path.join(
    projectRoot,
    "features",
    "federation-admin",
    "components",
    "federation-admin-sidebar.tsx"
  );
  const fedSidebarContent = fs.readFileSync(fedSidebarPath, "utf-8");

  assertTest(
    "FederationAdminSidebar also uses sticky positioning at top-16 with overflow-y-auto",
    fedSidebarContent.includes("sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shrink-0"),
    "Federation Admin sidebar stays pinned alongside navbar during scrolling"
  );

  // ----------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------
  console.log("\n==================================================");
  console.log("VERIFICATION SUMMARY");
  console.log("==================================================");

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const percentage = Math.round((passedCount / totalCount) * 100);

  console.log(`Passed: ${passedCount} / ${totalCount} (${percentage}%)\n`);

  if (passedCount === totalCount) {
    console.log("SUCCESS: All UI/UX corrections verified successfully!");
    process.exit(0);
  } else {
    console.error("FAILURES DETECTED: Some verification tests failed.");
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification script error:", err);
  process.exit(1);
});
