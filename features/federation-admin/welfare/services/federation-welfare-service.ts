import { createClient } from "@/lib/supabase/client";
import type { FederationWelfareMetrics } from "@/features/worker/welfare-certification/types";

export class FederationWelfareService {
  private async getDbClient() {
    if (typeof window === "undefined" && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      return createAdminClient();
    }
    return createClient();
  }

  /**
   * Resolve federation ID dynamically from session or explicit ID
   */
  async resolveFederationId(explicitId?: string): Promise<string> {
    if (explicitId) return explicitId;

    const supabase = await this.getDbClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.id) {
      // Check if user has an assigned federation in metadata or profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "FEDERATION_ADMIN") {
        // Find matching federation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: fed } = await (supabase.from("federations") as any)
          .select("id")
          .eq("status", "ACTIVE")
          .limit(1)
          .maybeSingle();
        if (fed?.id) return fed.id;
      }
    }

    // Default canonical Ahmedabad federation
    return "b765df3b-c418-4a15-b79f-3cbc09e475dc";
  }

  /**
   * Aggregate workforce welfare & development metrics strictly scoped to federation
   */
  async getFederationWelfareMetrics(fedId?: string): Promise<FederationWelfareMetrics> {
    const federationId = await this.resolveFederationId(fedId);
    const supabase = await this.getDbClient();
    const now = new Date();

    // 1. Fetch Federation Details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: federation } = await (supabase.from("federations") as any)
      .select("id, name, city, state")
      .eq("id", federationId)
      .single();

    const federationName = federation?.name || "Cooperative Labour Federation";

    // 2. Fetch Workers Scoped to This Federation Only
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawWorkers } = await (supabase.from("workers") as any)
      .select("id, profile_id, profession, experience_years, verification_status, bank_account_number, account_status, profiles(full_name, phone, email)")
      .eq("federation_id", federationId);

    const workers = rawWorkers || [];
    const totalActiveWorkers = workers.filter((w: any) => w.account_status === "ACTIVE" || !w.account_status).length;
    const workerIds = workers.map((w: any) => w.id);

    // Incomplete profiles
    const incompleteProfilesCount = workers.filter(
      (w: any) => !w.bank_account_number || w.verification_status === "pending_verification"
    ).length;

    // Skill distribution
    const skillCounts: Record<string, number> = {};
    workers.forEach((w: any) => {
      const prof = w.profession || "General Trades";
      skillCounts[prof] = (skillCounts[prof] || 0) + 1;
    });

    const skillDistribution = Object.entries(skillCounts).map(([profession, count]) => ({
      profession,
      count,
    })).sort((a, b) => b.count - a.count);

    // 3. Fetch Certifications Scoped to Federation Workers
    let totalExpiringCertifications = 0;
    let totalExpiredCertifications = 0;
    const attentionList: FederationWelfareMetrics["attentionList"] = [];
    const certCountByWorker: Record<string, number> = {};

    if (workerIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rawCerts } = await (supabase.from("worker_certifications") as any)
        .select("*, certifications(*), workers(id, profession, profiles(full_name, phone))")
        .in("worker_id", workerIds);

      (rawCerts || []).forEach((rc: any) => {
        certCountByWorker[rc.worker_id] = (certCountByWorker[rc.worker_id] || 0) + 1;

        if (rc.expiry_date) {
          const expiry = new Date(rc.expiry_date);
          const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysRemaining < 0) {
            totalExpiredCertifications++;
            attentionList.push({
              workerId: rc.worker_id,
              workerName: rc.workers?.profiles?.full_name || "Cooperative Worker",
              profession: rc.workers?.profession || "Tradesperson",
              phone: rc.workers?.profiles?.phone || null,
              certName: rc.certifications?.title || "Trade Certificate",
              expiryDate: rc.expiry_date,
              daysRemaining,
              issue: "EXPIRED",
            });
          } else if (daysRemaining <= 30) {
            totalExpiringCertifications++;
            attentionList.push({
              workerId: rc.worker_id,
              workerName: rc.workers?.profiles?.full_name || "Cooperative Worker",
              profession: rc.workers?.profession || "Tradesperson",
              phone: rc.workers?.profiles?.phone || null,
              certName: rc.certifications?.title || "Trade Certificate",
              expiryDate: rc.expiry_date,
              daysRemaining,
              issue: "EXPIRING_SOON",
            });
          }
        }
      });
    }

    // 4. Fetch Skills count per worker
    const skillCountByWorker: Record<string, number> = {};
    if (workerIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rawSkills } = await (supabase.from("worker_skills") as any)
        .select("worker_id")
        .in("worker_id", workerIds);

      (rawSkills || []).forEach((rs: any) => {
        skillCountByWorker[rs.worker_id] = (skillCountByWorker[rs.worker_id] || 0) + 1;
      });
    }

    // 5. Build Actionable Development Needs List
    const developmentNeedsList: FederationWelfareMetrics["developmentNeedsList"] = [];
    workers.forEach((w: any) => {
      const cCount = certCountByWorker[w.id] || 0;
      const sCount = skillCountByWorker[w.id] || 0;
      const exp = Number(w.experience_years || 1);

      if (cCount === 0 || (cCount === 1 && exp >= 5)) {
        let suggestedDevelopment = "Initial statutory trade certification";
        const prof = (w.profession || "").toLowerCase();
        if (prof.includes("plumb")) {
          suggestedDevelopment = "IPSC Advanced Plumbing & Pump Hydraulics Level 4";
        } else if (prof.includes("electr")) {
          suggestedDevelopment = "Solar PV Rooftop Integration & High-Voltage Safety";
        } else if (prof.includes("carpenter")) {
          suggestedDevelopment = "Architectural Joinery & CAD Blueprint Verification";
        } else {
          suggestedDevelopment = "Cooperative Occupational Safety & First-Aid Protocol";
        }

        developmentNeedsList.push({
          workerId: w.id,
          workerName: w.profiles?.full_name || "Cooperative Member",
          profession: w.profession || "Tradesperson",
          experienceYears: exp,
          skillsCount: sCount,
          certificationsCount: cCount,
          suggestedDevelopment,
        });
      }
    });

    return {
      federationId,
      federationName,
      totalActiveWorkers,
      totalExpiringCertifications,
      totalExpiredCertifications,
      workersNeedingAttention: attentionList.length,
      trainingCandidatesCount: developmentNeedsList.length,
      incompleteProfilesCount,
      skillDistribution,
      attentionList,
      developmentNeedsList,
    };
  }
}

export const federationWelfareService = new FederationWelfareService();
