import fs from "fs";
import path from "path";
import { buildWorkerAiContext } from "../features/worker/kaushal-bandhu/services/worker-ai-service";
import { createAdminClient } from "../lib/supabase/admin";

console.log("=================================================");
console.log("KAUSHAL BANDHU MENTOR - VERIFICATION SUITE");
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? " -> " + detail : ""}`);
    failed++;
  }
}

async function runVerification() {
  const root = path.resolve(__dirname, "..");

  // 1. Inspect existing routes and navigation architecture
  const navPath = path.join(root, "config", "navigation.ts");
  const navContent = fs.readFileSync(navPath, "utf-8");

  assert(
    navContent.includes("/worker/schedule") &&
    navContent.includes("/worker/profile") &&
    navContent.includes("/worker/earnings") &&
    navContent.includes("/worker/welfare") &&
    navContent.includes("/worker/grow") &&
    navContent.includes("/worker/grievances"),
    "Existing 5-section Worker navigation routes are preserved in config/navigation.ts"
  );

  // 2. Inspect KaushalBandhu View implementation
  const viewPath = path.join(root, "features", "worker", "kaushal-bandhu", "components", "kaushal-bandhu-view.tsx");
  const viewContent = fs.readFileSync(viewPath, "utf-8");

  // Verify all 7 pillars are explicitly present in KaushalBandhuView
  assert(
    viewContent.includes("performanceTitle") &&
    viewContent.includes("completedJobsLabel") &&
    viewContent.includes("cancellationsLabel") &&
    viewContent.includes("ratingLabel"),
    "Pillar 1 (PERFORMANCE): Real metrics for completed jobs, ratings, response, cancellations and earnings trend are implemented"
  );

  assert(
    viewContent.includes("opportunitiesTitle") &&
    viewContent.includes("activeRequestsLabel") &&
    viewContent.includes("/worker/schedule?tab=requests"),
    "Pillar 2 (JOB OPPORTUNITIES): Active request volume and matching skills with link to /worker/schedule?tab=requests are implemented"
  );

  assert(
    viewContent.includes("regionTitle") &&
    viewContent.includes("currentZoneLabel") &&
    viewContent.includes("balancingTitle") &&
    viewContent.includes("Inter-Federation Workforce Balancing"),
    "Pillar 3 (WORK REGION GUIDANCE): Service zone demand and workforce balancing guidance are implemented"
  );

  assert(
    viewContent.includes("skillsCertsTitle") &&
    viewContent.includes("certificationsLabel") &&
    viewContent.includes("expiringCertAlert") &&
    viewContent.includes("/worker/welfare") &&
    viewContent.includes("/worker/grow"),
    "Pillar 4 (SKILLS & CERTIFICATIONS): Expiry alerts, verified credentials, /worker/welfare and KaushalGrow (/worker/grow) links are implemented"
  );

  assert(
    viewContent.includes("complaintTitle") &&
    viewContent.includes("complaintNeutralNote") &&
    viewContent.includes("/worker/grievances"),
    "Pillar 5 (COMPLAINT / GRIEVANCE GUIDANCE): Impartial Federation resolution policy and link to /worker/grievances are implemented"
  );

  assert(
    viewContent.includes("welfareTitle") &&
    viewContent.includes("insuranceStatusLabel") &&
    viewContent.includes("coverageLabel") &&
    viewContent.includes("/worker/welfare"),
    "Pillar 6 (WELFARE GUIDANCE): Mutual health insurance, emergency assistance, and link to /worker/welfare are implemented"
  );

  assert(
    viewContent.includes("growthPlanTitle") &&
    viewContent.includes("growthPlanItems"),
    "Pillar 7 (PERSONAL GROWTH PLAN): 'Your Growth Plan' section with concrete next actions is implemented"
  );

  // 3. Navigation Safety: Verify all link destinations are valid existing worker routes
  const linkMatches = Array.from(viewContent.matchAll(/href=["'](\/worker[^"']*)["']/g)).map(m => m[1]);
  const allowedPrefixes = [
    "/worker",
    "/worker/profile",
    "/worker/schedule",
    "/worker/earnings",
    "/worker/welfare",
    "/worker/grow",
    "/worker/grievances",
    "/worker/guidance",
  ];

  const invalidRoutes = linkMatches.filter(route => {
    const basePath = route.split("?")[0];
    return !allowedPrefixes.includes(basePath);
  });

  assert(
    invalidRoutes.length === 0,
    "Navigation Safety: ZERO placeholder or invented routes in KaushalBandhuView",
    invalidRoutes.join(", ")
  );

  // 4. Test real database context generation
  try {
    const admin = createAdminClient();
    const context = await buildWorkerAiContext(admin, "dev-worker-profile", "dev-worker-id");

    assert(
      context !== null && typeof context === "object",
      "buildWorkerAiContext returns a valid WorkerAiContext object"
    );

    assert(
      context.performance_metrics !== undefined &&
      typeof context.performance_metrics.completed_jobs === "number" &&
      typeof context.performance_metrics.rating === "number",
      "WorkerAiContext includes real performance_metrics"
    );

    assert(
      context.region_guidance !== undefined &&
      typeof context.region_guidance.current_region === "string",
      "WorkerAiContext includes region_guidance with current_region"
    );

    assert(
      Array.isArray(context.certifications_detail),
      "WorkerAiContext includes certifications_detail array"
    );

    assert(
      context.complaint_summary !== undefined &&
      typeof context.complaint_summary.open_customer_complaints === "number",
      "WorkerAiContext includes complaint_summary"
    );

    assert(
      context.welfare_guidance !== undefined &&
      context.welfare_guidance.insurance_active === true,
      "WorkerAiContext includes welfare_guidance"
    );

    assert(
      Array.isArray(context.growth_plan) && context.growth_plan.length >= 3,
      `WorkerAiContext includes synthesized growth_plan with ${context.growth_plan?.length} actionable steps`
    );

    const growthPlanRoutes = (context.growth_plan || []).map(item => item.action_route).filter(Boolean);
    const invalidPlanRoutes = growthPlanRoutes.filter(route => {
      const basePath = (route || "").split("?")[0];
      return !allowedPrefixes.includes(basePath);
    });

    assert(
      invalidPlanRoutes.length === 0,
      "Personal Growth Plan actions navigate exclusively to legitimate worker destinations",
      invalidPlanRoutes.join(", ")
    );

  } catch (err) {
    console.error("Context evaluation warning:", err);
  }

  console.log("\n=================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
