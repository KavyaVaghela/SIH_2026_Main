import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

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

import { analyticsService } from "../features/super-admin/analytics/services/analytics-service";

async function verifyPhase5Ratings() {
  console.log("==================================================");
  console.log("PHASE 5 — RATINGS & FEEDBACK INTELLIGENCE VERIFICATION");
  console.log("==================================================");

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // 1. Direct Supabase Query for Ground Truth
  console.log("\n[1] Querying real reviews from Supabase directly...");
  const { data: dbReviews, error: reviewsErr } = await adminClient
    .from("reviews")
    .select("id, rating, comment, booking_id, worker_id, created_at");

  if (reviewsErr) {
    throw new Error(`Failed to query reviews: ${reviewsErr.message}`);
  }

  const totalDbReviews = dbReviews?.length || 0;
  console.log(`Direct DB review count: ${totalDbReviews}`);

  const ratingsSum = (dbReviews || []).reduce((acc, r) => acc + (r.rating || 0), 0);
  const dbAvgRating = totalDbReviews > 0 ? parseFloat((ratingsSum / totalDbReviews).toFixed(2)) : null;
  console.log(`Direct DB average rating: ${dbAvgRating}`);

  const dbDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of dbReviews || []) {
    const stars = Math.min(5, Math.max(1, Math.round(r.rating || 0)));
    dbDist[stars] = (dbDist[stars] || 0) + 1;
  }
  console.log("Direct DB rating distribution:", dbDist);

  // 2. Call analyticsService for Super Admin Analytics
  console.log("\n[2] Fetching Analytics Data via analyticsService...");
  const analyticsData = await analyticsService.getAnalyticsData({ range: "year" }, adminClient);
  const quality = analyticsData.qualityAnalytics;

  if (!quality) {
    throw new Error("qualityAnalytics is missing from analyticsService output!");
  }

  // 3. Compare Service Output with Ground Truth
  console.log("\n[3] Comparing Quality Intelligence with DB Ground Truth:");
  console.log(`- Service Total Reviews: ${quality.overview.totalReviews} (Expected DB: ${totalDbReviews})`);
  console.log(`- Service Avg Rating: ${quality.overview.averageWorkerRating} (Expected DB: ${dbAvgRating})`);
  console.log(`- Service 5-Star Share: ${quality.overview.fiveStarShare}%`);
  console.log(`- Service 1-2 Star Share: ${quality.overview.oneTwoStarShare}%`);
  console.log(`- Service Workers with Reviews: ${quality.overview.workersReviewedCount}`);

  if (quality.overview.totalReviews !== totalDbReviews) {
    throw new Error(`Review count mismatch! Got ${quality.overview.totalReviews}, expected ${totalDbReviews}`);
  }

  if (quality.overview.averageWorkerRating !== dbAvgRating) {
    throw new Error(`Average rating mismatch! Got ${quality.overview.averageWorkerRating}, expected ${dbAvgRating}`);
  }

  // Check distribution match
  for (const distItem of quality.distribution) {
    const dbCount = dbDist[distItem.stars];
    if (distItem.count !== dbCount) {
      throw new Error(`Distribution mismatch for ${distItem.stars} stars: Got ${distItem.count}, expected ${dbCount}`);
    }
  }
  console.log("✓ Rating distribution matches exact database counts for all star tiers 1-5.");

  // 4. Verify Federation Quality & Empty States
  console.log("\n[4] Verifying Federation Quality Governance & Empty States:");
  const withReviews = quality.federationQuality.filter((f) => f.reviewCount > 0);
  const withoutReviews = quality.federationQuality.filter((f) => f.reviewCount === 0);

  console.log(`- Federations with reviews: ${withReviews.length}`);
  console.log(`- Federations with zero reviews: ${withoutReviews.length}`);

  for (const f of withReviews) {
    console.log(`  * ${f.federationName}: ${f.averageRating}★ across ${f.reviewCount} reviews`);
    if (f.averageRating === null) {
      throw new Error(`Federation ${f.federationName} has reviews but rating is null!`);
    }
  }

  // Check zero review federations: MUST NOT be 5.0 or non-null fallback!
  let zeroReviewFallbackViolations = 0;
  for (const f of withoutReviews) {
    if (f.averageRating !== null) {
      console.error(`VIOLATION: Federation ${f.federationName} has 0 reviews but averageRating is ${f.averageRating}!`);
      zeroReviewFallbackViolations++;
    }
  }

  if (zeroReviewFallbackViolations > 0) {
    throw new Error(`${zeroReviewFallbackViolations} federations with 0 reviews have fake/fallback ratings!`);
  }
  console.log("✓ All federations without reviews correctly show null (truthful empty state '—'), NOT 5.0.");

  // 5. Verify Customer Comments Realness
  console.log("\n[5] Verifying Recent Customer Comments Realness:");
  console.log(`- Total comments loaded: ${quality.recentComments.length}`);
  for (const c of quality.recentComments.slice(0, 3)) {
    console.log(`  * [${c.rating}★] "${c.comment.substring(0, 40)}..." (Federation: ${c.federationName}, Service: ${c.serviceTitle})`);
  }

  console.log("\n==================================================");
  console.log("✓ PHASE 5 VERIFICATION PASSED SUCCESSFULLY");
  console.log("==================================================");
}

verifyPhase5Ratings().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
