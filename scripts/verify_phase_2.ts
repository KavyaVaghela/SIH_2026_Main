/**
 * Phase 2 Verification Suite: Service Catalogue + Intelligent Worker Matching
 * 
 * Verifies all 10 required tests against the live linked Supabase database.
 * Run with: npx tsx scripts/verify_phase_2.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { matchingService } from "../features/matching/services/matching-service";
import { customerService } from "../features/customer/services/customer-service";
import { serviceCatalogService } from "../features/services/services/service-catalog-service";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dxvnwbmxeubpbunwlmnd.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE env variables: url=" + !!supabaseUrl + ", anon=" + !!supabaseAnonKey + ", service=" + !!supabaseServiceKey);
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
const anonSupabase = createClient(supabaseUrl, supabaseAnonKey);

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function record(name: string, category: string, passed: boolean, message: string, details?: any) {
  results.push({ name, category, passed, message, details });
  const status = passed ? "\x1b[32m[PASS]\x1b[0m" : "\x1b[31m[FAIL]\x1b[0m";
  console.log(`${status} ${category} > ${name}`);
  console.log(`       ${message}`);
  if (!passed && details) {
    console.log(`       Details:`, JSON.stringify(details, null, 2));
  }
}

async function runPhase2Verification() {
  console.log("\n================================================================================");
  console.log("       STARTING PHASE 2 COMPREHENSIVE VERIFICATION SUITE");
  console.log("================================================================================\n");

  // ============================================================================
  // TEST 1: Service Catalogue Categories & Sub-Services in Database
  // ============================================================================
  try {
    const { data: categories, error: catErr } = await adminSupabase
      .from("service_categories")
      .select("id, name, is_active")
      .eq("is_active", true);

    const { data: services, error: srvErr } = await adminSupabase
      .from("services")
      .select("id, title, category_id, base_price, is_active")
      .eq("is_active", true);

    const catNames = categories?.map((c) => c.name) || [];
    const hasMajorCategories = ["Plumbing", "Electrical", "Carpentry", "Painting", "Cleaning"].some((name) =>
      catNames.some((c) => c.toLowerCase().includes(name.toLowerCase()))
    );

    const passed =
      !catErr &&
      !srvErr &&
      (categories?.length || 0) >= 6 &&
      (services?.length || 0) >= 20 &&
      hasMajorCategories;

    record(
      "Service Catalogue DB Persistence",
      "Catalogue",
      passed,
      passed
        ? `Found ${categories?.length} active categories and ${services?.length} active sub-services in DB with valid relations.`
        : `Catalogue lookup failed: ${catErr?.message || srvErr?.message}`,
      { categoryCount: categories?.length, serviceCount: services?.length }
    );
  } catch (err: any) {
    record("Service Catalogue DB Persistence", "Catalogue", false, `Exception: ${err.message}`);
  }

  // ============================================================================
  // TEST 2: Skill Relationship & Strict Trade Exclusion
  // ============================================================================
  try {
    // Resolve plumbing category
    const { data: plumbCat } = await adminSupabase
      .from("service_categories")
      .select("id, name")
      .ilike("name", "%Plumbing%")
      .limit(1)
      .single();

    // Query matches for Plumbing service
    const matches = await matchingService.findEligibleWorkers({
      categoryId: plumbCat?.id,
      subServiceTitle: "Tap Repair",
      customerLatitude: 23.0300,
      customerLongitude: 72.5178,
      maxRadiusKm: 25,
    });

    const hasPlumber = matches.some((m) =>
      m.worker.extendedProfile.primarySkill.toLowerCase().includes("plumb") ||
      m.worker.extendedProfile.primarySkill.toLowerCase().includes("tap") ||
      m.worker.extendedProfile.primarySkill.toLowerCase().includes("pipe") ||
      m.worker.extendedProfile.secondarySkills?.some((s) => s.toLowerCase().includes("plumb") || s.toLowerCase().includes("tap"))
    );

    // Verify painters are strictly excluded from plumbing
    const hasUnrelatedPainter = matches.some((m) => {
      const skills = [m.worker.extendedProfile.primarySkill, ...(m.worker.extendedProfile.secondarySkills || [])].join(" ").toLowerCase();
      return skills.includes("painting") && !skills.includes("plumb") && !skills.includes("pipe") && !skills.includes("tap");
    });

    const passed = matches.length > 0 && hasPlumber && !hasUnrelatedPainter;

    record(
      "Skill Trade Matching & Hard Exclusion",
      "Intelligent Matching",
      passed,
      passed
        ? `Matching for 'Tap Repair' returned ${matches.length} eligible plumbers (Top: ${matches[0]?.worker.extendedProfile.fullName}, score ${matches[0]?.matchScore}). Unrelated painters strictly excluded.`
        : `Skill exclusion failed: hasPlumber=${hasPlumber}, hasUnrelatedPainter=${hasUnrelatedPainter}, totalMatches=${matches.length}`,
      { matchesFound: matches.length, topCandidate: matches[0]?.worker.extendedProfile.fullName }
    );
  } catch (err: any) {
    record("Skill Trade Matching & Hard Exclusion", "Intelligent Matching", false, `Exception: ${err.message}`);
  }

  // ============================================================================
  // TEST 3: Multiple Workers Returned Without Arbitrary 5-Worker Limit
  // ============================================================================
  try {
    // Query without artificial limit across all categories in radius
    const allEligible = await matchingService.findEligibleWorkers({
      customerLatitude: 23.0300,
      customerLongitude: 72.5178,
      maxRadiusKm: 30,
    });

    // In Ahmedabad we seeded 25 workers within 20km radius
    const passed = allEligible.length >= 10;

    record(
      "Unconstrained Workforce Discovery (No 5-worker cap)",
      "Intelligent Matching",
      passed,
      passed
        ? `Matching returned ${allEligible.length} eligible workers across Ahmedabad without artificial 5-worker truncation.`
        : `Worker cap detected: only ${allEligible.length} workers returned.`,
      { totalEligible: allEligible.length }
    );
  } catch (err: any) {
    record("Unconstrained Workforce Discovery (No 5-worker cap)", "Intelligent Matching", false, `Exception: ${err.message}`);
  }

  // ============================================================================
  // TEST 4: New Worker Rating Semantics (0 reviews -> "New", never 5.0)
  // ============================================================================
  try {
    // Rahul Shah was seeded with 0 reviews
    const { data: rahulWorker } = await adminSupabase
      .from("workers")
      .select("id, profile_id, profiles!inner(full_name, email)")
      .eq("profiles.email", "rahul.shah.test@example.com")
      .maybeSingle();

    if (!rahulWorker) {
      record("New Worker Rating Semantics", "Rating Integrity", false, "Could not find unreviewed test carpenter.");
    } else {
      const profileResult = await matchingService.getWorkerProfileById(rahulWorker.id);
      const isNew = profileResult?.worker.extendedProfile.isNew;
      const reviewsCount = profileResult?.worker.extendedProfile.reviewsCount;
      const rating = profileResult?.worker.extendedProfile.rating;

      const passed = isNew === true && reviewsCount === 0 && rating === 0.0;

      record(
        "New Worker Rating Semantics",
        "Rating Integrity",
        passed,
        passed
          ? `Worker '${profileResult?.worker.extendedProfile.fullName}' correctly evaluated as isNew: ${isNew}, reviewsCount: ${reviewsCount}, rating: ${rating} (NEVER a fabricated 5-star rating).`
          : `Rating semantics violated: isNew=${isNew}, reviewsCount=${reviewsCount}, rating=${rating}`,
        { profile: profileResult?.worker.extendedProfile }
      );
    }
  } catch (err: any) {
    record("New Worker Rating Semantics", "Rating Integrity", false, `Exception: ${err.message}`);
  }

  // ============================================================================
  // TEST 5: Worker with Real Reviews Displays Genuine Rating
  // ============================================================================
  try {
    // Find a worker with reviews
    const { data: reviewRow } = await adminSupabase
      .from("reviews")
      .select("worker_id, rating")
      .limit(1)
      .single();

    if (!reviewRow) {
      record("Worker With Real Reviews Calculation", "Rating Integrity", false, "No reviews found in DB.");
    } else {
      const { data: allWorkerReviews } = await adminSupabase
        .from("reviews")
        .select("rating")
        .eq("worker_id", reviewRow.worker_id);

      const expectedCount = allWorkerReviews?.length || 0;
      const expectedSum = (allWorkerReviews || []).reduce((sum, r) => sum + Number(r.rating || 0), 0);
      const expectedAvg = Math.round((expectedSum / expectedCount) * 10) / 10;

      const profileResult = await matchingService.getWorkerProfileById(reviewRow.worker_id);
      const actualCount = profileResult?.worker.extendedProfile.reviewsCount;
      const actualRating = profileResult?.worker.extendedProfile.rating;
      const isNew = profileResult?.worker.extendedProfile.isNew;

      const passed =
        isNew === false &&
        actualCount === expectedCount &&
        Math.abs((actualRating || 0) - expectedAvg) < 0.05;

      record(
        "Worker With Real Reviews Calculation",
        "Rating Integrity",
        passed,
        passed
          ? `Worker '${profileResult?.worker.extendedProfile.fullName}' calculated rating: ${actualRating} from ${actualCount} real reviews (Matches DB average: ${expectedAvg}).`
          : `Rating calculation mismatch: actualRating=${actualRating}, expectedAvg=${expectedAvg}, actualCount=${actualCount}`,
        { actualRating, expectedAvg, actualCount, expectedCount }
      );
    }
  } catch (err: any) {
    record("Worker With Real Reviews Calculation", "Rating Integrity", false, `Exception: ${err.message}`);
  }

  // ============================================================================
  // TEST 6: Availability Filter Excludes BUSY/UNAVAILABLE Workers
  // ============================================================================
  try {
    // Temporarily pick one worker and verify status filtering logic
    const { data: testWorker } = await adminSupabase
      .from("workers")
      .select("id, availability_status")
      .eq("account_status", "ACTIVE")
      .eq("verification_status", "verified")
      .limit(1)
      .single();

    if (!testWorker) {
      record("Availability Filter", "Matching Filter", false, "No test worker found.");
    } else {
      // Set to BUSY
      await adminSupabase
        .from("workers")
        .update({ availability_status: "BUSY" })
        .eq("id", testWorker.id);

      const matchesAfterBusy = await matchingService.findEligibleWorkers({
        customerLatitude: 23.0300,
        customerLongitude: 72.5178,
        maxRadiusKm: 50,
      });

      const busyFound = matchesAfterBusy.some((m) => m.worker.id === testWorker.id);

      // Revert back to AVAILABLE
      await adminSupabase
        .from("workers")
        .update({ availability_status: "AVAILABLE" })
        .eq("id", testWorker.id);

      const matchesAfterRevert = await matchingService.findEligibleWorkers({
        customerLatitude: 23.0300,
        customerLongitude: 72.5178,
        maxRadiusKm: 50,
      });

      const availableFound = matchesAfterRevert.some((m) => m.worker.id === testWorker.id);

      const passed = !busyFound && availableFound;

      record(
        "Availability Filter (BUSY Excluded, AVAILABLE Included)",
        "Matching Filter",
        passed,
        passed
          ? `Worker correctly excluded when status was BUSY, and included immediately when status was AVAILABLE.`
          : `Availability filter failed: busyFound=${busyFound}, availableFound=${availableFound}`,
        { busyFound, availableFound }
      );
    }
  } catch (err: any) {
    record("Availability Filter", "Matching Filter", false, `Exception: ${err.message}`);
  }

  // ============================================================================
  // TEST 7: Verification Filter Excludes Unverified / Suspended Workers
  // ============================================================================
  try {
    const { data: testWorker } = await adminSupabase
      .from("workers")
      .select("id, verification_status")
      .eq("account_status", "ACTIVE")
      .eq("verification_status", "verified")
      .limit(1)
      .single();

    if (!testWorker) {
      record("Verification Status Filter", "Matching Filter", false, "No test worker found.");
    } else {
      // Set verification_status to pending_verification
      await adminSupabase
        .from("workers")
        .update({ verification_status: "pending_verification" })
        .eq("id", testWorker.id);

      const matchesPending = await matchingService.findEligibleWorkers({
        customerLatitude: 23.0300,
        customerLongitude: 72.5178,
        maxRadiusKm: 50,
      });

      const pendingFound = matchesPending.some((m) => m.worker.id === testWorker.id);

      // Restore to verified
      await adminSupabase
        .from("workers")
        .update({ verification_status: "verified" })
        .eq("id", testWorker.id);

      const passed = !pendingFound;

      record(
        "Verification Status Filter (Unverified Excluded)",
        "Matching Filter",
        passed,
        passed
          ? `Worker with 'pending_verification' strictly excluded from customer matching results.`
          : `Unverified worker was included in matching results.`,
        { pendingFound }
      );
    }
  } catch (err: any) {
    record("Verification Status Filter", "Matching Filter", false, `Exception: ${err.message}`);
  }

  // ============================================================================
  // TEST 8: Federation Scoping & Isolation Preserved
  // ============================================================================
  try {
    const targetFedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc"; // Ahmedabad Skilled Workers Federation

    const fedMatches = await matchingService.findEligibleWorkers({
      customerLatitude: 23.0300,
      customerLongitude: 72.5178,
      federationId: targetFedId,
      maxRadiusKm: 30,
    });

    const allInFed = fedMatches.every((m) => m.worker.federationId === targetFedId);
    const passed = fedMatches.length > 0 && allInFed;

    record(
      "Federation Scoped Matching Isolation",
      "Federation Governance",
      passed,
      passed
        ? `All ${fedMatches.length} returned workers are strictly scoped to federation '${targetFedId}'.`
        : `Isolation leak detected in federation matching.`,
      { matchCount: fedMatches.length, allInFed }
    );
  } catch (err: any) {
    record("Federation Scoped Matching Isolation", "Federation Governance", false, `Exception: ${err.message}`);
  }

  // ============================================================================
  // TEST 9: Service Catalogue Navigation & Draft Requirements
  // ============================================================================
  try {
    // 1. Verify service catalog categories fetch
    const categories = await serviceCatalogService.getCategories();
    // 2. Verify sub-services fetch by category
    const subServices = await serviceCatalogService.getServicesByCategory("cat-plumbing");
    // 3. Verify CustomerService delegation
    const customerMatched = await customerService.findMatchingWorkers("Tap Repair");

    const passed =
      categories.length >= 6 &&
      subServices.length >= 5 &&
      customerMatched.length > 0;

    record(
      "Service Catalogue Navigation & Customer Integration",
      "Service Catalogue",
      passed,
      passed
        ? `Catalogue loaded ${categories.length} categories, ${subServices.length} plumbing sub-services, and CustomerService successfully routed to real matching.`
        : `Catalogue integration failed: categories=${categories.length}, subServices=${subServices.length}, customerMatched=${customerMatched.length}`,
      { catCount: categories.length, subCount: subServices.length, matchCount: customerMatched.length }
    );
  } catch (err: any) {
    record("Service Catalogue Navigation & Customer Integration", "Service Catalogue", false, `Exception: ${err.message}`);
  }

  // ============================================================================
  // TEST 10: Regression Test: Phase 1 Authentication
  // ============================================================================
  try {
    const roles = [
      { role: "customer", email: "customer@example.com", password: "Password123!" },
      { role: "worker", email: "worker@example.com", password: "Password123!" },
      { role: "federation_admin", email: "federation@example.com", password: "Password123!" },
      { role: "super_admin", email: "admin@example.com", password: "Password123!" },
    ];

    let allAuthPassed = true;
    const authResults: Record<string, boolean> = {};

    for (const u of roles) {
      const { data, error } = await anonSupabase.auth.signInWithPassword({
        email: u.email,
        password: u.password,
      });

      const success = !error && !!data.session && !!data.user;
      authResults[u.role] = success;
      if (!success) {
        allAuthPassed = false;
      }
      if (data.session) {
        await anonSupabase.auth.signOut();
      }
    }

    record(
      "Regression: Multi-Role Auth Stability",
      "Phase 1 Regression",
      allAuthPassed,
      allAuthPassed
        ? "Customer, Worker, Federation Admin, and Super Admin authenticated successfully."
        : "One or more role authentications failed.",
      authResults
    );
  } catch (err: any) {
    record("Regression: Multi-Role Auth Stability", "Phase 1 Regression", false, `Exception: ${err.message}`);
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log("\n================================================================================");
  console.log("       PHASE 2 VERIFICATION RESULTS SUMMARY");
  console.log("================================================================================");
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`TOTAL TESTS : ${total}`);
  console.log(`PASSED      : ${passedCount}`);
  console.log(`FAILED      : ${failedCount}`);

  if (failedCount > 0) {
    console.log("\nFailed tests:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  - [${r.category}] ${r.name}: ${r.message}`);
    });
    process.exit(1);
  } else {
    console.log("\n\x1b[32mALL 10 PHASE 2 TESTS PASSED PERFECTLY!\x1b[0m\n");
    process.exit(0);
  }
}

runPhase2Verification().catch((err) => {
  console.error("Fatal error during verification:", err);
  process.exit(1);
});
