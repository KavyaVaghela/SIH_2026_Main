import { SupabaseClient } from "@supabase/supabase-js";
import type { WorkerAiContext, WorkerLearningSuggestion } from "@/lib/ai/ai-types";

/**
 * PRODUCTION-GRADE TRADE FILTERING RULE
 *
 * A worker MUST NEVER be recommended a course from an unrelated trade unless
 * their actual verified skills explicitly contain that qualification.
 *
 * Example:
 * Worker: Plumber -> Allowed: Plumbing Safety, Pipe Repair, Leakage Detection, Sanitary Installation
 *         NEVER: Electrical Wiring, Automotive, Carpentry
 *
 * Worker: Painter -> Allowed: Wall Painting & Textures, Surface Preparation
 *         NEVER: Plumbing, Electrical, Carpentry
 *
 * Worker: Electrician -> Allowed: Electrical Safety, Circuit Testing, Inverter Setup
 *         NEVER: Plumbing, Carpentry, Painting
 */
export function getAllowedKaushalGrowCourses(
  trade: string,
  skills: string[] = []
): WorkerLearningSuggestion[] {
  const t = (trade || "").toLowerCase();
  const sStr = skills.map((s) => s.toLowerCase()).join(" ");

  const hasPlumbing = t.includes("plumb") || t.includes("pipe") || t.includes("sanit") || sStr.includes("plumb");
  const hasPainting = t.includes("paint") || sStr.includes("paint");
  const hasCarpentry = t.includes("carpent") || t.includes("wood") || sStr.includes("carpent");
  const hasSolar = t.includes("solar") || sStr.includes("solar");
  const hasCleaning = t.includes("clean") || t.includes("housekeep") || sStr.includes("clean");
  const hasAppliance = t.includes("appliance") || t.includes("repair") || sStr.includes("appliance");
  const hasElectrical = t.includes("electr") || t.includes("wire") || sStr.includes("electr");

  const allowed: WorkerLearningSuggestion[] = [];

  // 1. Plumbing Courses
  if (hasPlumbing) {
    allowed.push({
      course_id: "resource-8",
      title: "Plumbing Safety & Leakage Detection",
      category: "Plumbing & Pipe Repair",
      reason: "Master water pressure testing, leak isolation, and sanitary safety standards.",
    });
    allowed.push({
      course_id: "resource-9",
      title: "Pipe Repair & Sanitary Installation",
      category: "Plumbing & Pipe Repair",
      reason: "Learn CPVC solvent welding, mixer tap repairs, and fixture installation.",
    });
  }

  // 2. Painting Courses
  if (hasPainting) {
    allowed.push({
      course_id: "resource-5",
      title: "Modern Interior Wall Painting & Textures",
      category: "Painting",
      reason: "Master wall putty preparation, roller stencil application, and low-VOC finishes.",
    });
  }

  // 3. Carpentry Courses
  if (hasCarpentry) {
    allowed.push({
      course_id: "resource-4",
      title: "Advanced Furniture Carpentry & Joints",
      category: "Carpentry",
      reason: "Master precision wood joints, mortise and tenon, and hardwood finishing.",
    });
  }

  // 4. Solar Energy Courses
  if (hasSolar) {
    allowed.push({
      course_id: "resource-1",
      title: "Solar Panel Installation for Beginners",
      category: "Solar Energy",
      reason: "Learn PV roof mounting, solar cell wiring, and inverter connections.",
    });
    allowed.push({
      course_id: "resource-3",
      title: "Inverter Setup Guide",
      category: "Solar Energy",
      reason: "Master pure sine wave inverters, lithium battery banks, and automatic switches.",
    });
  }

  // 5. Cleaning Courses
  if (hasCleaning) {
    allowed.push({
      course_id: "resource-6",
      title: "Deep Cleaning & Sanitation Protocols",
      category: "Cleaning",
      reason: "Master commercial hygiene standards, chemical dilution ratios, and machinery.",
    });
  }

  // 6. Appliance Courses
  if (hasAppliance) {
    allowed.push({
      course_id: "resource-7",
      title: "Washing Machine & Microwave Repair",
      category: "Appliance Repair",
      reason: "Learn diagnostic codes, motor belt replacement, and PCB circuit testing.",
    });
  }

  // 7. Electrical Courses - ONLY if trade is electrical or worker has verified electrical skill
  if (hasElectrical) {
    allowed.push({
      course_id: "resource-2",
      title: "Electrical Safety Basics",
      category: "Electrical Safety",
      reason: "Master Lockout/Tagout energy isolation, PPE protocols, and shock hazard prevention.",
    });
  }

  // Fallback if worker trade does not have a specialized course yet
  if (allowed.length === 0) {
    // If trade is genuinely unknown or general labor, provide a trade-neutral advisory
    if (t.includes("electr")) {
      allowed.push({
        course_id: "resource-2",
        title: "Electrical Safety Basics",
        category: "Electrical Safety",
        reason: "Master Lockout/Tagout energy isolation and PPE safety.",
      });
    } else if (hasPlumbing) {
      allowed.push({
        course_id: "resource-8",
        title: "Plumbing Safety & Leakage Detection",
        category: "Plumbing & Pipe Repair",
        reason: "Master water pressure testing and leakage isolation.",
      });
    }
  }

  return allowed;
}

/**
 * Builds factual WorkerAiContext by querying real database tables.
 * Strict PII compliance: Never exposes phone numbers, customer details, or personal addresses.
 */
export async function buildWorkerAiContext(
  adminClient: SupabaseClient,
  workerProfileId: string,
  workerId: string
): Promise<WorkerAiContext> {
  // 1. Fetch Profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (adminClient.from("profiles") as any)
    .select("id, full_name, email")
    .eq("id", workerProfileId)
    .maybeSingle();

  // 2. Fetch Worker Record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: worker } = await (adminClient.from("workers") as any)
    .select("id, profession, experience_years, verification_status, availability_status, account_status, federation_id")
    .eq("id", workerId)
    .maybeSingle();

  const trade = worker?.profession || "Service Professional";
  const workerName = profile?.full_name || "Worker Partner";

  // 3. Fetch Skills
  let skills: string[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: skillRows } = await (adminClient.from("worker_skills") as any)
      .select("skill_id, proficiency_level, skills(id, name)")
      .eq("worker_id", workerId);

    if (Array.isArray(skillRows)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skills = skillRows.map((sr: any) => sr.skills?.name).filter(Boolean);
    }
  } catch {
    // Graceful fallback if table query fails
  }

  // 4. Fetch Certifications
  let certifications: string[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: certRows } = await (adminClient.from("worker_certifications") as any)
      .select("certification_id, certificate_number, is_verified, certifications(id, title)")
      .eq("worker_id", workerId);

    if (Array.isArray(certRows)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      certifications = certRows.map((cr: any) => cr.certifications?.title).filter(Boolean);
    }
  } catch {
    // Graceful fallback if table query fails
  }

  // 5. Completed Bookings Counts (All canonical completed statuses & large project allocations)
  let completedBookingsCount = 0;
  let bookingsLast30Days = 0;
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const completedStatuses = [
    "BOOKING_COMPLETED",
    "SERVICE_COMPLETED",
    "PAYMENT_RECEIVED",
    "COMPLETED",
    "completed",
    "booking_completed",
    "service_completed",
    "payment_received",
  ];

  try {
    // Query standard bookings matching either workerId or workerProfileId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: completedBookings } = await (adminClient.from("bookings") as any)
      .select("id, created_at, status")
      .or(`worker_id.eq.${workerId},worker_id.eq.${workerProfileId}`)
      .in("status", completedStatuses);

    if (Array.isArray(completedBookings)) {
      completedBookingsCount += completedBookings.length;
      bookingsLast30Days += completedBookings.filter((b: any) => {
        const d = b.created_at ? new Date(b.created_at) : null;
        return d && d >= new Date(thirtyDaysAgoIso);
      }).length;
    }

    // Also include completed large project allocations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allocations } = await (adminClient.from("project_allocations") as any)
      .select("id, response_status, status, created_at, project_requests(status, updated_at, created_at)")
      .or(`worker_id.eq.${workerId},worker_id.eq.${workerProfileId}`);

    if (Array.isArray(allocations)) {
      const completedAllocations = allocations.filter((alloc: any) => {
        const isAccepted = alloc.response_status === "ACCEPTED" || alloc.status === "assigned";
        const projStatus = (alloc.project_requests?.status || "").toUpperCase();
        return isAccepted && (projStatus === "COMPLETED" || projStatus === "SETTLED" || projStatus === "CLOSED");
      });

      completedBookingsCount += completedAllocations.length;
      bookingsLast30Days += completedAllocations.filter((alloc: any) => {
        const dt = alloc.project_requests?.updated_at || alloc.project_requests?.created_at || alloc.created_at;
        return dt && new Date(dt) >= new Date(thirtyDaysAgoIso);
      }).length;
    }
  } catch {
    // Graceful fallback
  }

  // 6. REAL Reviews & Rating Calculation (matching workerId or workerProfileId)
  let rating = 0.0;
  let reviewsCount = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: revs } = await (adminClient.from("reviews") as any)
      .select("rating")
      .or(`worker_id.eq.${workerId},worker_id.eq.${workerProfileId}`);

    if (Array.isArray(revs) && revs.length > 0) {
      reviewsCount = revs.length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sum = revs.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0);
      rating = Math.round((sum / revs.length) * 10) / 10;
    }
  } catch {
    // Graceful fallback
  }

  const isNewWorker = reviewsCount === 0 && completedBookingsCount <= 2;

  // 7. Regional Trade Demand
  let regionName = "Local Cooperative";
  let recentDemandCount = 0;

  try {
    if (worker?.federation_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fed } = await (adminClient.from("federations") as any)
        .select("name, city, state")
        .eq("id", worker.federation_id)
        .maybeSingle();

      if (fed?.name) {
        regionName = fed.name;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: fedDemand } = await (adminClient.from("bookings") as any)
        .select("id", { count: "exact", head: true })
        .eq("federation_id", worker.federation_id)
        .gte("created_at", thirtyDaysAgoIso);

      recentDemandCount = fedDemand || 0;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: platformDemand } = await (adminClient.from("bookings") as any)
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgoIso);

      recentDemandCount = platformDemand || 0;
    }
  } catch {
    // Graceful fallback
  }

  const demandLevel: "LOW" | "STEADY" | "HIGH" =
    recentDemandCount > 20 ? "HIGH" : recentDemandCount > 5 ? "STEADY" : "LOW";

  const fallbackDemandLevel: "LOW" | "MODERATE" | "HIGH" =
    demandLevel === "STEADY" ? "MODERATE" : demandLevel;

  const availability: "AVAILABLE" | "BUSY" | "UNAVAILABLE" =
    worker?.availability_status === "BUSY"
      ? "BUSY"
      : worker?.availability_status === "UNAVAILABLE"
      ? "UNAVAILABLE"
      : "AVAILABLE";

  // 8. STRICT PRE-AI TRADE FILTERING
  const allowedCourses = getAllowedKaushalGrowCourses(trade, skills);
  const recommendedCourse = allowedCourses.length > 0 ? allowedCourses[0] : undefined;

  // Utilization interpretation
  const utilizationLevel: "LOW" | "MODERATE" | "HIGH" =
    bookingsLast30Days > 12 ? "HIGH" : bookingsLast30Days > 3 ? "MODERATE" : "LOW";

  return {
    worker_id: workerId,
    worker_name: workerName,
    worker_trade: trade,
    trade,
    experience_level: worker?.experience_years ? `${worker.experience_years} years` : "Experienced",
    verification_status: worker?.verification_status || "PENDING",
    certified: certifications.length > 0,
    availability,
    availability_status: worker?.availability_status || "AVAILABLE",
    skills,
    certifications,
    recent_completed_jobs: bookingsLast30Days,
    completed_bookings_count: completedBookingsCount,
    total_bookings: completedBookingsCount,
    bookings_last_30_days: bookingsLast30Days,
    rating,
    reviews_count: reviewsCount,
    is_new_worker: isNewWorker,
    utilization_level: utilizationLevel,
    regional_trade_demand: fallbackDemandLevel,
    regional_trade_demand_info: {
      region: regionName,
      trade,
      recent_requests_count: recentDemandCount,
      demand_level: demandLevel,
    },
    allowed_courses: allowedCourses,
    recommended_course: recommendedCourse,
    relevant_training_title: recommendedCourse ? recommendedCourse.title : null,
    relevant_training_category: recommendedCourse ? (recommendedCourse.category || null) : null,
    has_sufficient_activity: completedBookingsCount > 0 || bookingsLast30Days > 0,
  };
}
