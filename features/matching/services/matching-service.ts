import { createClient } from "@/lib/supabase/client";
import type { Worker } from "../../../types";

export interface MatchingFilter {
  serviceId?: string;
  categoryId?: string;
  skillId?: string;
  subServiceTitle?: string;
  categoryName?: string;
  customerLatitude: number;
  customerLongitude: number;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  maxRadiusKm?: number;
  federationId?: string;
  limit?: number;
  offset?: number;
}

export interface ExtendedWorkerProfile {
  fullName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  cooperativeName: string;
  primarySkill: string;
  secondarySkills?: string[];
  rating: number; // calculated from real reviews, or 0.0 if no reviews
  reviewsCount: number; // total count of reviews in public.reviews
  isNew: boolean; // true if reviewsCount === 0
  completedJobsCount: number; // count of completed bookings
  experienceYears: number;
  languages: string[];
  bio: string;
  verificationStatus: "verified" | "pending_verification" | "suspended";
  matchedSkillName?: string;
}

export interface WorkerMatchResult {
  worker: Worker & {
    extendedProfile: ExtendedWorkerProfile;
  };
  matchScore: number; // 0 - 100
  tierBreakdown: {
    skillMatch: boolean;
    availabilityMatch: boolean;
    distanceKm: number;
    rating: number;
    reviewsCount: number;
    isNew: boolean;
    experienceYears: number;
    currentWorkloadCount: number;
  };
}

export interface IMatchingService {
  findEligibleWorkers(filter: MatchingFilter): Promise<WorkerMatchResult[]>;
  getWorkerProfileById(workerId: string): Promise<WorkerMatchResult | null>;
}

export class MatchingService implements IMatchingService {
  // Calculate Haversine distance in km
  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in KM
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  async findEligibleWorkers(filter: MatchingFilter): Promise<WorkerMatchResult[]> {
    const customerLat = filter.customerLatitude || 23.0300; // Satellite, Ahmedabad default
    const customerLon = filter.customerLongitude || 72.5178;
    const defaultMaxRadius = filter.maxRadiusKm || 25;

    try {
      const supabase = createClient();

      // 1. Resolve Target Category and Sub-Service information
      let targetSubService = filter.subServiceTitle?.trim().toLowerCase();
      let targetCategoryName = filter.categoryName?.trim().toLowerCase();
      let targetCategoryId = filter.categoryId;

      // If serviceId is provided, resolve service and category
      if (filter.serviceId) {
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(filter.serviceId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let srvQuery = (supabase.from("services") as any).select("id, title, category_id, service_categories(id, name)");
        if (isUuid) {
          srvQuery = srvQuery.eq("id", filter.serviceId);
        } else {
          srvQuery = srvQuery.ilike("title", `%${filter.serviceId}%`);
        }
        const { data: srvData } = await srvQuery.limit(1).maybeSingle();
        if (srvData) {
          targetSubService = srvData.title?.trim().toLowerCase();
          targetCategoryId = targetCategoryId || srvData.category_id;
          if (srvData.service_categories?.name) {
            targetCategoryName = targetCategoryName || srvData.service_categories.name.trim().toLowerCase();
          }
        } else if (!targetSubService && !isUuid) {
          // If serviceId was a string name like "Tap Repair" or "Wiring"
          targetSubService = filter.serviceId.trim().toLowerCase();
        }
      }

      // If categoryId is provided, resolve category name
      if (targetCategoryId) {
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(targetCategoryId);
        if (isUuid) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: catData } = await (supabase.from("service_categories") as any)
            .select("id, name")
            .eq("id", targetCategoryId)
            .maybeSingle();
          if (catData?.name) {
            targetCategoryName = targetCategoryName || catData.name.trim().toLowerCase();
          }
        } else {
          targetCategoryName = targetCategoryName || targetCategoryId.trim().toLowerCase();
        }
      }

      // 2. Query all ACTIVE, VERIFIED, AVAILABLE workers with joins
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let workerQuery = (supabase.from("workers") as any)
        .select(`
          id,
          profile_id,
          federation_id,
          account_status,
          verification_status,
          availability_status,
          hourly_rate,
          experience_years,
          service_radius_km,
          current_latitude,
          current_longitude,
          profession,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            phone,
            email,
            avatar_url
          ),
          federations (
            id,
            name,
            registration_number
          ),
          worker_skills (
            skills (
              id,
              name,
              category_id,
              service_categories (
                id,
                name
              )
            )
          )
        `)
        .eq("account_status", "ACTIVE")
        .eq("verification_status", "verified")
        .eq("availability_status", "AVAILABLE");

      if (filter.federationId) {
        workerQuery = workerQuery.eq("federation_id", filter.federationId);
      }

      const { data: dbWorkers, error: workersError } = await workerQuery;
      if (workersError) {
        console.error("Error fetching workers for matching:", workersError);
        return [];
      }

      if (!dbWorkers || dbWorkers.length === 0) {
        return [];
      }

      // 3. Query all reviews to compute accurate, non-fabricated ratings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbReviews } = await (supabase.from("reviews") as any)
        .select("worker_id, rating");

      const reviewStatsMap = new Map<string, { count: number; total: number }>();
      if (dbReviews) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dbReviews.forEach((rev: any) => {
          if (!rev.worker_id) return;
          const current = reviewStatsMap.get(rev.worker_id) || { count: 0, total: 0 };
          current.count += 1;
          current.total += Number(rev.rating) || 0;
          reviewStatsMap.set(rev.worker_id, current);
        });
      }

      // 4. Query completed bookings count for each worker
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbCompletedBookings } = await (supabase.from("bookings") as any)
        .select("worker_id, status")
        .or("status.eq.COMPLETED,status.eq.completed,status.eq.BOOKING_COMPLETED");

      const completedJobsMap = new Map<string, number>();
      if (dbCompletedBookings) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dbCompletedBookings.forEach((b: any) => {
          if (!b.worker_id) return;
          const count = completedJobsMap.get(b.worker_id) || 0;
          completedJobsMap.set(b.worker_id, count + 1);
        });
      }

      // 5. Query active conflicting bookings if time window specified
      const conflictedWorkerIds = new Set<string>();
      if (filter.scheduledStartAt && filter.scheduledEndAt) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: activeBookings } = await (supabase.from("bookings") as any)
          .select("worker_id, scheduled_start_at, scheduled_end_at")
          .in("status", ["REQUEST_SENT", "ACCEPTED", "CONFIRMED", "ASSIGNED", "IN_PROGRESS", "BOOKING_CONFIRMED"]);

        if (activeBookings) {
          const reqStart = new Date(filter.scheduledStartAt).getTime();
          const reqEnd = new Date(filter.scheduledEndAt).getTime();

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          activeBookings.forEach((b: any) => {
            if (!b.worker_id || !b.scheduled_start_at || !b.scheduled_end_at) return;
            const bStart = new Date(b.scheduled_start_at).getTime();
            const bEnd = new Date(b.scheduled_end_at).getTime();
            // Check overlap
            if (bStart < reqEnd && bEnd > reqStart) {
              conflictedWorkerIds.add(b.worker_id);
            }
          });
        }
      }

      // 6. Hard Filtering and Intelligent Ranking
      const results: WorkerMatchResult[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const w of dbWorkers as any[]) {
        // Hard Filter: Conflict check
        if (conflictedWorkerIds.has(w.id)) {
          continue;
        }

        // Calculate Proximity
        const workerLat = Number(w.current_latitude) || 23.0300;
        const workerLon = Number(w.current_longitude) || 72.5200;
        const distanceKm = this.calculateDistanceKm(customerLat, customerLon, workerLat, workerLon);

        const workerRadiusKm = Number(w.service_radius_km) || 25;
        const effectiveMaxRadius = filter.maxRadiusKm ? Math.min(filter.maxRadiusKm, workerRadiusKm) : workerRadiusKm;

        // Hard Filter: Distance
        if (distanceKm > effectiveMaxRadius && distanceKm > defaultMaxRadius) {
          continue;
        }

        // Extract worker's verified skills
        const workerSkillsList: Array<{ name: string; categoryId?: string; categoryName?: string }> = [];
        if (Array.isArray(w.worker_skills)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          w.worker_skills.forEach((ws: any) => {
            if (ws.skills?.name) {
              workerSkillsList.push({
                name: ws.skills.name,
                categoryId: ws.skills.category_id,
                categoryName: ws.skills.service_categories?.name,
              });
            }
          });
        }

        const workerSkillNames = workerSkillsList.map((s) => s.name);

        // Hard Filter: Skill Compatibility
        let skillMatchScore = 0;
        let matchedSkillName = workerSkillNames[0] || w.profession || "General Trade Professional";
        let isEligible = true;

        if (targetSubService || targetCategoryName || targetCategoryId) {
          let hasExactSubService = false;
          let hasCategoryMatch = false;

          for (const skill of workerSkillsList) {
            const sNameLower = skill.name.toLowerCase();
            const cNameLower = (skill.categoryName || "").toLowerCase();

            // A) Exact Sub-service match (worker has exact skill required for sub-service)
            if (
              targetSubService &&
              (sNameLower.includes(targetSubService) || targetSubService.includes(sNameLower))
            ) {
              hasExactSubService = true;
              matchedSkillName = skill.name;
              break;
            }

            // B) Category match (worker has skill in requested trade category)
            if (
              (targetCategoryId && skill.categoryId === targetCategoryId) ||
              (targetCategoryName && (cNameLower.includes(targetCategoryName) || targetCategoryName.includes(cNameLower) || sNameLower.includes(targetCategoryName)))
            ) {
              hasCategoryMatch = true;
              matchedSkillName = skill.name;
            }
          }

          if (hasExactSubService) {
            skillMatchScore = 40; // Max skill compatibility weight
          } else if (hasCategoryMatch) {
            skillMatchScore = 25; // Good category-level trade compatibility
          } else {
            // Strict exclusion: Worker has no skills matching this trade category
            isEligible = false;
          }
        } else {
          // Generic query (e.g. nearby homepage discovery)
          skillMatchScore = 30;
        }

        if (!isEligible) {
          continue;
        }

        // Availability score (worker is available)
        const availabilityScore = 15;

        // Proximity score (up to 10 points)
        const proximityScore = Math.max(0, Math.round((1 - distanceKm / Math.max(workerRadiusKm, 1)) * 10));

        // Rating & Reviews calculation (Genuinely from reviews table - NEVER fabricated!)
        const rStats = reviewStatsMap.get(w.id);
        const reviewsCount = rStats ? rStats.count : 0;
        const isNew = reviewsCount === 0;
        const rawRating = reviewsCount > 0 ? rStats!.total / reviewsCount : 0.0;
        const rating = Math.round(rawRating * 10) / 10;

        // Rating score (0 to 5 points; new workers are not penalized, nor are they falsely boosted)
        const ratingScore = isNew ? 0 : Math.min(5, Math.round((rating / 5) * 5));

        // Experience score (0 to 5 points)
        const experienceYears = Number(w.experience_years) || 1;
        const experienceScore = Math.min(5, Math.round((experienceYears / 10) * 5));

        // Completed jobs count
        const completedJobsCount = completedJobsMap.get(w.id) || 0;
        const jobsScore = Math.min(5, Math.round((completedJobsCount / 10) * 5));

        // Total Match Score (Skill match remains dominant, rating cannot overpower skill match)
        const totalMatchScore = Math.min(
          100,
          Math.max(10, skillMatchScore + availabilityScore + proximityScore + ratingScore + experienceScore + jobsScore)
        );

        const p = w.profiles || {};
        const f = w.federations || {};
        const secondarySkills = workerSkillNames.filter((s) => s !== matchedSkillName);

        const candidateWorker: Worker & { extendedProfile: ExtendedWorkerProfile } = {
          id: w.id,
          profileId: w.profile_id,
          federationId: w.federation_id,
          status: w.account_status || "ACTIVE",
          availability: "AVAILABLE",
          hourlyRate: Number(w.hourly_rate) || 350,
          experienceYears,
          currentLatitude: workerLat,
          currentLongitude: workerLon,
          createdAt: w.created_at,
          updatedAt: w.updated_at,
          extendedProfile: {
            fullName: p.full_name || "Verified Cooperative Worker",
            phone: p.phone || "+91 98250 11021",
            email: p.email || "worker@cooplabour.org",
            avatarUrl: p.avatar_url || undefined,
            cooperativeName: f.name || "Ahmedabad Skilled Workers Federation",
            primarySkill: matchedSkillName,
            secondarySkills: secondarySkills.length > 0 ? secondarySkills : ["Verified Trade Worker", "Cooperative Member"],
            rating,
            reviewsCount,
            isNew,
            completedJobsCount,
            experienceYears,
            languages: ["Gujarati", "Hindi"],
            bio: `${experienceYears}+ years experienced certified trade specialist under ${f.name || "Cooperative Federation"}.`,
            verificationStatus: w.verification_status || "verified",
            matchedSkillName,
          },
        };

        results.push({
          worker: candidateWorker,
          matchScore: totalMatchScore,
          tierBreakdown: {
            skillMatch: true,
            availabilityMatch: true,
            distanceKm,
            rating,
            reviewsCount,
            isNew,
            experienceYears,
            currentWorkloadCount: 0,
          },
        });
      }

      // Sort by match score descending, then by distance ascending
      results.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return a.tierBreakdown.distanceKm - b.tierBreakdown.distanceKm;
      });

      // Pagination support (no artificial 5-worker truncation!)
      if (filter.offset || filter.limit) {
        const offset = filter.offset || 0;
        const limit = filter.limit || results.length;
        return results.slice(offset, offset + limit);
      }

      return results;
    } catch (err) {
      console.error("MatchingService findEligibleWorkers exception:", err);
      return [];
    }
  }

  async getWorkerProfileById(workerId: string): Promise<WorkerMatchResult | null> {
    try {
      const supabase = createClient();

      // Query worker from DB by id or profile_id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: w, error } = await (supabase.from("workers") as any)
        .select(`
          id,
          profile_id,
          federation_id,
          account_status,
          verification_status,
          availability_status,
          hourly_rate,
          experience_years,
          service_radius_km,
          current_latitude,
          current_longitude,
          profession,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            phone,
            email,
            avatar_url
          ),
          federations (
            id,
            name,
            registration_number
          ),
          worker_skills (
            skills (
              id,
              name,
              category_id,
              service_categories (
                id,
                name
              )
            )
          )
        `)
        .or(`id.eq.${workerId},profile_id.eq.${workerId}`)
        .maybeSingle();

      if (error || !w) {
        return null;
      }

      // Extract skills
      const workerSkillsList: string[] = [];
      if (Array.isArray(w.worker_skills)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        w.worker_skills.forEach((ws: any) => {
          if (ws.skills?.name) {
            workerSkillsList.push(ws.skills.name);
          }
        });
      }

      // Query real reviews
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reviews } = await (supabase.from("reviews") as any)
        .select("rating")
        .eq("worker_id", w.id);

      const reviewsCount = reviews ? reviews.length : 0;
      const isNew = reviewsCount === 0;
      let rating = 0.0;
      if (reviewsCount > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const total = reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
        rating = Math.round((total / reviewsCount) * 10) / 10;
      }

      // Query completed jobs count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: completedBookings } = await (supabase.from("bookings") as any)
        .select("id")
        .eq("worker_id", w.id)
        .or("status.eq.COMPLETED,status.eq.completed,status.eq.BOOKING_COMPLETED");

      const completedJobsCount = completedBookings ? completedBookings.length : 0;

      const p = w.profiles || {};
      const f = w.federations || {};
      const experienceYears = Number(w.experience_years) || 1;
      const primarySkill = workerSkillsList[0] || w.profession || "Trade Professional";
      const secondarySkills = workerSkillsList.slice(1);

      const distanceKm = this.calculateDistanceKm(
        23.0300,
        72.5178,
        Number(w.current_latitude) || 23.0300,
        Number(w.current_longitude) || 72.5200
      );

      return {
        worker: {
          id: w.id,
          profileId: w.profile_id,
          federationId: w.federation_id,
          status: w.account_status || "ACTIVE",
          availability: (w.availability_status?.toUpperCase() as any) || "AVAILABLE",
          hourlyRate: Number(w.hourly_rate) || 350,
          experienceYears,
          currentLatitude: Number(w.current_latitude) || 23.0300,
          currentLongitude: Number(w.current_longitude) || 72.5200,
          createdAt: w.created_at,
          updatedAt: w.updated_at,
          extendedProfile: {
            fullName: p.full_name || "Verified Cooperative Worker",
            phone: p.phone || "+91 98250 11021",
            email: p.email || "worker@cooplabour.org",
            avatarUrl: p.avatar_url || undefined,
            cooperativeName: f.name || "Ahmedabad Skilled Workers Federation",
            primarySkill,
            secondarySkills: secondarySkills.length > 0 ? secondarySkills : ["Quality Service", "Verified Trade Worker"],
            rating,
            reviewsCount,
            isNew,
            completedJobsCount,
            experienceYears,
            languages: ["Gujarati", "Hindi"],
            bio: `${experienceYears}+ years experienced certified trade worker affiliated with ${f.name || "Cooperative Federation"}.`,
            verificationStatus: w.verification_status || "verified",
          },
        },
        matchScore: 95,
        tierBreakdown: {
          skillMatch: true,
          availabilityMatch: true,
          distanceKm,
          rating,
          reviewsCount,
          isNew,
          experienceYears,
          currentWorkloadCount: 0,
        },
      };
    } catch (err) {
      console.error("MatchingService getWorkerProfileById exception:", err);
      return null;
    }
  }
}

export const matchingService = new MatchingService();
