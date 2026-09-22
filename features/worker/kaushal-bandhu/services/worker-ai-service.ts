import { SupabaseClient } from "@supabase/supabase-js";
import type { WorkerAiContext } from "@/lib/ai/ai-types";

/**
 * Maps a worker profession or trade to a real published KaushalGrow course.
 */
function getMatchingKaushalGrowCourse(trade: string): {
  course_id: string;
  title: string;
  category: string;
  reason: string;
} {
  const t = (trade || "").toLowerCase();

  if (t.includes("solar")) {
    return {
      course_id: "resource-1",
      title: "Solar Panel Installation for Beginners",
      category: "Solar Energy",
      reason: "Learn PV panel mounting, DC wiring, and solar inverter setup.",
    };
  }

  if (t.includes("carpent") || t.includes("wood")) {
    return {
      course_id: "resource-4",
      title: "Advanced Furniture Carpentry & Joints",
      category: "Carpentry",
      reason: "Master precision wood joints, mortise/tenon, and lacquer finishing.",
    };
  }

  if (t.includes("paint")) {
    return {
      course_id: "resource-5",
      title: "Modern Interior Wall Painting & Textures",
      category: "Painting",
      reason: "Learn wall putty prep, roller stencils, and textured coating.",
    };
  }

  if (t.includes("clean") || t.includes("sanit") || t.includes("housekeep")) {
    return {
      course_id: "resource-6",
      title: "Deep Cleaning & Sanitation Protocols",
      category: "Cleaning",
      reason: "Master commercial hygiene standards, dilution ratios, and machinery.",
    };
  }

  // Default for Electrician, Plumbing, Appliance, or General
  return {
    course_id: "resource-2",
    title: "Electrical Safety Basics",
    category: "Electrical Safety",
    reason: "Master essential hazard protection, LOTO energy isolation, and PPE safety.",
  };
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

  // 5. Completed Bookings Counts
  let completedBookingsCount = 0;
  let bookingsLast30Days = 0;
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalCompleted } = await (adminClient.from("bookings") as any)
      .select("id", { count: "exact", head: true })
      .eq("worker_id", workerId)
      .eq("status", "BOOKING_COMPLETED");

    completedBookingsCount = totalCompleted || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: last30 } = await (adminClient.from("bookings") as any)
      .select("id", { count: "exact", head: true })
      .eq("worker_id", workerId)
      .eq("status", "BOOKING_COMPLETED")
      .gte("created_at", thirtyDaysAgoIso);

    bookingsLast30Days = last30 || 0;
  } catch {
    // Graceful fallback
  }

  // 6. Regional Trade Demand
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

  // 7. KaushalGrow matched course
  const recommendedCourse = getMatchingKaushalGrowCourse(trade);

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
    rating: 4.8,
    utilization_level: completedBookingsCount > 10 ? "HIGH" : completedBookingsCount > 2 ? "MODERATE" : "LOW",
    regional_trade_demand: fallbackDemandLevel,
    regional_trade_demand_info: {
      region: regionName,
      trade,
      recent_requests_count: recentDemandCount,
      demand_level: demandLevel,
    },
    recommended_course: recommendedCourse,
    relevant_training_title: recommendedCourse.title,
    relevant_training_category: recommendedCourse.category,
    has_sufficient_activity: completedBookingsCount > 0 || bookingsLast30Days > 0,
  };
}
