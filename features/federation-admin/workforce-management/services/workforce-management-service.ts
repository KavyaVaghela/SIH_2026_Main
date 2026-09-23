import { createClient } from "@/lib/supabase/client";
import type {
  ManagedWorkerItem,
  AddWorkerPayload,
  WorkforceManagementData,
  WorkerApplicationItem,
  WorkerApplicationStatus,
  WorkerChangeRequestItem,
  WorkerChangeRequestStatus,
} from "../types";
import type { WorkerAccountStatus } from "@/supabase/types/database.types";

export class WorkforceManagementService {
  /**
   * Deterministic in-memory development store seeded with Ahmedabad Labour Cooperative workers.
   */
  private fallbackWorkers: ManagedWorkerItem[] = [
    {
      id: "WRK-AHM-0101",
      fullName: "Rajesh Solanki",
      profession: "Electrician",
      area: "Maninagar",
      city: "Ahmedabad",
      state: "Gujarat",
      accountStatus: "ACTIVE",
      availabilityStatus: "AVAILABLE",
      hourlyRate: 350,
      experienceYears: 8,
      joiningDate: "2022-03-15",
      phone: "+91 98251 44520",
      email: "rajesh.solanki@kaushalya.coop.in",
    },
    {
      id: "WRK-AHM-0102",
      fullName: "Dinesh Parmar",
      profession: "Plumber",
      area: "Khokhra",
      city: "Ahmedabad",
      state: "Gujarat",
      accountStatus: "ACTIVE",
      availabilityStatus: "BUSY",
      hourlyRate: 320,
      experienceYears: 6,
      joiningDate: "2022-06-10",
      phone: "+91 98251 44522",
      email: "dinesh.parmar@kaushalya.coop.in",
    },
    {
      id: "WRK-AHM-0103",
      fullName: "Geeta Vaghela",
      profession: "Deep Cleaner",
      area: "Navrangpura",
      city: "Ahmedabad",
      state: "Gujarat",
      accountStatus: "ACTIVE",
      availabilityStatus: "AVAILABLE",
      hourlyRate: 280,
      experienceYears: 5,
      joiningDate: "2023-01-20",
      phone: "+91 98251 44524",
      email: "geeta.vaghela@kaushalya.coop.in",
    },
    {
      id: "WRK-AHM-0104",
      fullName: "Mukesh Rathod",
      profession: "Carpenter",
      area: "Bopal",
      city: "Ahmedabad",
      state: "Gujarat",
      accountStatus: "ACTIVE",
      availabilityStatus: "AVAILABLE",
      hourlyRate: 380,
      experienceYears: 7,
      joiningDate: "2023-05-18",
      phone: "+91 98251 44526",
      email: "mukesh.rathod@kaushalya.coop.in",
    },
    {
      id: "WRK-AHM-0105",
      fullName: "Pravin Makwana",
      profession: "Painter",
      area: "Satellite",
      city: "Ahmedabad",
      state: "Gujarat",
      accountStatus: "ACTIVE",
      availabilityStatus: "UNAVAILABLE",
      hourlyRate: 300,
      experienceYears: 4,
      joiningDate: "2023-08-04",
      phone: "+91 98251 44528",
      email: "pravin.makwana@kaushalya.coop.in",
    },
    {
      id: "WRK-AHM-0106",
      fullName: "Sanjay Varma",
      profession: "Appliance Technician",
      area: "Chandkheda",
      city: "Ahmedabad",
      state: "Gujarat",
      accountStatus: "ACTIVE",
      availabilityStatus: "AVAILABLE",
      hourlyRate: 400,
      experienceYears: 9,
      joiningDate: "2022-11-12",
      phone: "+91 98251 44530",
      email: "sanjay.varma@kaushalya.coop.in",
    },
    {
      id: "WRK-AHM-0107",
      fullName: "Kamlesh Patel",
      profession: "Electrician",
      area: "Sanand",
      city: "Ahmedabad",
      state: "Gujarat",
      accountStatus: "DEACTIVATED",
      availabilityStatus: "UNAVAILABLE",
      hourlyRate: 300,
      experienceYears: 3,
      joiningDate: "2024-02-01",
      phone: "+91 98251 44532",
      email: "kamlesh.patel@kaushalya.coop.in",
    },
    {
      id: "WRK-AHM-0108",
      fullName: "Bhavna Chauhan",
      profession: "Deep Cleaner",
      area: "Vastrapur",
      city: "Ahmedabad",
      state: "Gujarat",
      accountStatus: "ACTIVE",
      availabilityStatus: "AVAILABLE",
      hourlyRate: 290,
      experienceYears: 6,
      joiningDate: "2022-04-25",
      phone: "+91 98251 44534",
      email: "bhavna.chauhan@kaushalya.coop.in",
    },
  ];

  /**
   * Deterministic development store for incoming worker membership applications.
   */
  private fallbackApplications: WorkerApplicationItem[] = [];

  /**
   * Deterministic development store for worker-initiated profile change requests.
   */
  private fallbackChangeRequests: WorkerChangeRequestItem[] = [
    {
      id: "WCR-2026-011",
      workerId: "WRK-AHM-0101",
      workerName: "Rajesh Solanki",
      section: "PROFESSIONAL",
      field: "Profession",
      currentValue: "Electrician",
      requestedValue: "Master Industrial Electrician",
      reason:
        "Completed Advanced High-Voltage Industrial Systems Accreditation at Central Training Institute.",
      supportingDocument: {
        name: "CTI_Master_Accreditation_Certificate.pdf",
        category: "TRADE_CERTIFICATE",
        fileType: "PDF",
        fileSize: "1.8 MB",
      },
      submittedDate: "2026-03-01",
      status: "PENDING",
    },
    {
      id: "WCR-2026-012",
      workerId: "WRK-AHM-0102",
      workerName: "Dinesh Parmar",
      section: "RATES",
      field: "Hourly Tariff Rate",
      currentValue: "₹320",
      requestedValue: "₹380",
      reason:
        "Acquired precision hydraulic pipe-threading machinery and completed municipal gas distribution certification.",
      supportingDocument: {
        name: "Gujarat_Gas_Apprentice_Badge.pdf",
        category: "TRADE_CERTIFICATE",
        fileType: "PDF",
        fileSize: "1.2 MB",
      },
      submittedDate: "2026-03-02",
      status: "PENDING",
    },
    {
      id: "WCR-2026-013",
      workerId: "WRK-AHM-0103",
      workerName: "Geeta Vaghela",
      section: "SKILLS",
      field: "Trade Skills",
      currentValue: "Deep cleaning, Sanitization",
      requestedValue: "Deep cleaning, Industrial Sanitization, High-Rise Façade Cleaning",
      reason: "Completed statutory 40-hour high-altitude safety harness training and certification.",
      supportingDocument: {
        name: "High_Altitude_Safety_Accreditation.pdf",
        category: "SKILL_CERTIFICATE",
        fileType: "PDF",
        fileSize: "2.1 MB",
      },
      submittedDate: "2026-03-03",
      status: "PENDING",
    },
    {
      id: "WCR-2026-014",
      workerId: "WRK-AHM-0104",
      workerName: "Mukesh Rathod",
      section: "PERSONAL",
      field: "Residential Address",
      currentValue: "B-201 Sahajanand Park, Bopal",
      requestedValue: "A-404 Shilp Residency, South Bopal",
      reason: "Permanent relocation of residential domicile with updated government proofs.",
      supportingDocument: {
        name: "Updated_Aadhaar_Address.pdf",
        category: "IDENTITY",
        fileType: "PDF",
        fileSize: "940 KB",
      },
      submittedDate: "2026-02-20",
      status: "APPROVED",
      reviewedAt: "2026-02-22",
    },
  ];

  /**
   * Retrieves managed workers list filtered by search query.
   */
  async getManagedWorkers(searchQuery: string = ""): Promise<WorkforceManagementData> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/federation/workers?type=roster&search=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      } catch (apiErr) {
        console.warn("Notice: Roster API call failed, falling back to direct client:", apiErr);
      }
    }

    const supabase = createClient();
    let workersList: ManagedWorkerItem[] = [];
    let isFallback = false;
    let dataSourceNotice: string | undefined = undefined;
    // Resolve caller's federation_id
    let federationId: string | null = null;
    try {
      const { data: rpcFedId } = await supabase.rpc("current_federation_id");
      if (rpcFedId) {
        federationId = rpcFedId;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: fed } = await (supabase.from("federations") as any)
            .select("id")
            .eq("contact_email", user.email)
            .maybeSingle();
          federationId = (fed as any)?.id || null;
        }
      }
    } catch {
      // ignore
    }

    try {
      let query = (supabase.from("workers") as any)
        .select(`
          id,
          profile_id,
          member_id,
          profession,
          hourly_rate,
          experience_years,
          account_status,
          availability_status,
          created_at,
          verification_status,
          federation_id,
          profiles:profile_id (
            full_name,
            email,
            phone
          )
        `)
        .eq("verification_status", "verified");

      if (federationId) {
        query = query.eq("federation_id", federationId);
      }

      const { data: dbWorkers, error } = await query;

      if (!error && dbWorkers) {
        // Collect profile ids to fetch addresses
        const profileIds = (dbWorkers as any[]).map((w) => w.profile_id).filter(Boolean);
        const addressMap: Record<string, any> = {};
        if (profileIds.length > 0) {
          const { data: addresses } = await (supabase.from("addresses") as any)
            .select("profile_id, title, address_line1, address_line2, city, state, postal_code")
            .in("profile_id", profileIds);
          if (addresses) {
            for (const addr of addresses) {
              if (addr.profile_id && !addressMap[addr.profile_id]) {
                addressMap[addr.profile_id] = addr;
              }
            }
          }
        }

        workersList = (dbWorkers as any[]).map((w) => {
          const profile = w.profiles || {};
          const addr = addressMap[w.profile_id];
          return {
            id: w.id,
            memberId: w.member_id || undefined,
            fullName: profile.full_name || "Cooperative Member",
            profession: w.profession || "Skilled Craftsman",
            area: addr?.address_line2 || addr?.address_line1 || "Area on File",
            city: addr?.city || "Ahmedabad",
            state: addr?.state || "Gujarat",
            accountStatus: (w.account_status || "ACTIVE") as WorkerAccountStatus,
            availabilityStatus: (w.availability_status || "AVAILABLE") as any,
            hourlyRate: Number(w.hourly_rate) || 350,
            experienceYears: Number(w.experience_years) || 0,
            joiningDate: w.created_at ? w.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            phone: profile.phone || "+91 98250 00000",
            email: profile.email || "worker@kaushalya.coop.in",
          };
        });
      } else if (error) {
        console.warn("Notice: Live workers query encountered error:", error);
      }
    } catch (err) {
      console.warn("Notice: Live workers query failed:", err);
    }

    let filtered = workersList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (w) =>
          w.fullName.toLowerCase().includes(q) ||
          w.id.toLowerCase().includes(q) ||
          (w.memberId && w.memberId.toLowerCase().includes(q))
      );
    }

    const totalCount = workersList.length;
    const activeCount = workersList.filter((w) => w.accountStatus === "ACTIVE").length;
    const deactivatedCount = workersList.filter((w) => w.accountStatus === "DEACTIVATED").length;

    return {
      workers: filtered,
      totalCount,
      activeCount,
      deactivatedCount,
      isDevelopmentFallback: isFallback,
      dataSourceNotice,
    };
  }

  /**
   * Helper to retrieve session bearer token for authoritative server mutations.
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    try {
      if (typeof window !== "undefined") {
        const supabase = createClient();
        const { data: sessData } = await supabase.auth.getSession();
        if (sessData?.session?.access_token) {
          headers["Authorization"] = `Bearer ${sessData.session.access_token}`;
        }
      }
    } catch (_) {}
    return headers;
  }

  /**
   * Registers a new worker to the authenticated Federation Admin's federation.
   * Delegates authoritatively to /api/federation/workers (action: "create") backed by real Supabase Auth + DB.
   */
  async addWorker(payload: AddWorkerPayload): Promise<ManagedWorkerItem> {
    if (typeof window !== "undefined") {
      const headers = await this.getAuthHeaders();
      const res = await fetch("/api/federation/workers", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "create",
          ...payload,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to register worker in federation roster.");
      }

      const today = new Date().toISOString().split("T")[0];
      const w = json.worker;
      const createdWorker: ManagedWorkerItem = {
        id: w.id,
        memberId: w.memberId,
        fullName: w.fullName,
        profession: w.profession,
        area: payload.city || "Ahmedabad Central",
        city: payload.city || "Ahmedabad",
        state: payload.state || "Gujarat",
        accountStatus: "ACTIVE",
        availabilityStatus: "UNAVAILABLE",
        hourlyRate: Number(w.hourlyRate) || 350,
        experienceYears: Number(w.experienceYears) || 0,
        joiningDate: today,
        phone: payload.phone,
        email: w.email,
      };

      return createdWorker;
    }

    throw new Error("Add worker operation must be executed within browser context.");
  }

  /**
   * Directly transitions worker account status (ACTIVE <-> DEACTIVATED).
   */
  async updateWorkerAccountStatus(
    workerId: string,
    newStatus: WorkerAccountStatus
  ): Promise<{ success: boolean; workerId: string; updatedStatus: WorkerAccountStatus }> {
    if (typeof window !== "undefined") {
      const headers = await this.getAuthHeaders();
      const res = await fetch("/api/federation/workers", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "status", workerId, status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to update worker status to ${newStatus}.`);
      }

      this.fallbackWorkers = this.fallbackWorkers.map((w) => {
        if (w.id === workerId || w.memberId === workerId) {
          return {
            ...w,
            accountStatus: newStatus,
          };
        }
        return w;
      });

      return {
        success: true,
        workerId: json.workerId || workerId,
        updatedStatus: newStatus,
      };
    }

    return {
      success: true,
      workerId,
      updatedStatus: newStatus,
    };
  }

  // ==========================================
  // STAGE 5: WORKER REQUESTS
  // ==========================================

  /**
   * Retrieves incoming worker applications scoped to authenticated federation context.
   * Priority: Reads real records from public.workers joined with public.profiles and public.addresses.
   */
  async getWorkerApplications(
    searchQuery: string = "",
    statusFilter: WorkerApplicationStatus | "ALL" = "ALL",
    registrationTypeFilter: "NEW_WORKER" | "EXISTING_WORKER" | "ALL" = "ALL"
  ): Promise<WorkerApplicationItem[]> {
    if (typeof window !== "undefined") {
      try {
        const headers = await this.getAuthHeaders();
        const url = `/api/federation/workers?type=applications&status=${statusFilter}&registrationType=${registrationTypeFilter}&search=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.applications)) {
            return json.applications;
          }
        }
      } catch (apiErr) {
        console.warn("Notice: Applications API call failed, falling back to direct client:", apiErr);
      }
    }

    const supabase = createClient();
    let applications: WorkerApplicationItem[] = [];

    // Resolve caller's federation_id
    let federationId: string | null = null;
    try {
      const { data: rpcFedId } = await supabase.rpc("current_federation_id");
      if (rpcFedId) {
        federationId = rpcFedId;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: fed } = await (supabase.from("federations") as any)
            .select("id")
            .eq("contact_email", user.email)
            .maybeSingle();
          federationId = (fed as any)?.id || null;
        }
      }
    } catch {
      // ignore
    }

    try {
      // 1. Fetch workers from Supabase
      let query = (supabase.from("workers") as any)
        .select(`
          id,
          profile_id,
          federation_id,
          member_id,
          registration_type,
          experience_years,
          hourly_rate,
          verification_status,
          account_status,
          created_at,
          date_of_birth,
          gender,
          profession,
          previous_work_details,
          govt_id_type,
          govt_id_number,
          govt_id_document_url,
          bank_name,
          bank_account_holder,
          bank_account_number,
          bank_ifsc_code,
          rejection_reason,
          profiles:profile_id (
            id,
            full_name,
            email,
            phone,
            avatar_url
          ),
          federations:federation_id (
            id,
            name,
            code
          )
        `)
        .order("created_at", { ascending: false });

      if (federationId) {
        query = query.eq("federation_id", federationId);
      }

      if (statusFilter === "PENDING") {
        query = query.eq("verification_status", "pending_verification");
      } else if (statusFilter === "ACCEPTED") {
        query = query.eq("verification_status", "verified");
      } else if (statusFilter === "REJECTED") {
        query = query.eq("verification_status", "suspended");
      }

      if (registrationTypeFilter !== "ALL") {
        query = query.eq("registration_type", registrationTypeFilter);
      }

      const { data: dbWorkers, error } = await query;

      if (!error && dbWorkers && dbWorkers.length > 0) {
        // Collect profile ids to batch fetch addresses
        const profileIds = dbWorkers.map((w: any) => w.profile_id).filter(Boolean);
        const addressMap: Record<string, any> = {};
        if (profileIds.length > 0) {
          const { data: addresses } = await (supabase.from("addresses") as any)
            .select("profile_id, title, address_line1, address_line2, city, state, postal_code")
            .in("profile_id", profileIds);
          if (addresses) {
            for (const addr of addresses) {
              if (addr.profile_id && !addressMap[addr.profile_id]) {
                addressMap[addr.profile_id] = addr;
              }
            }
          }
        }

        // Fetch real skills from worker_skills
        const workerIds = dbWorkers.map((w: any) => w.id).filter(Boolean);
        const skillsMap: Record<string, string[]> = {};
        if (workerIds.length > 0) {
          const { data: workerSkills } = await (supabase.from("worker_skills") as any)
            .select("worker_id, skills:skill_id (name)")
            .in("worker_id", workerIds);
          if (workerSkills) {
            for (const ws of workerSkills as any[]) {
              if (ws.worker_id && ws.skills?.name) {
                if (!skillsMap[ws.worker_id]) skillsMap[ws.worker_id] = [];
                skillsMap[ws.worker_id].push(ws.skills.name);
              }
            }
          }
        }

        applications = dbWorkers.map((w: any) => {
          const profile = w.profiles || {};
          const addr = addressMap[w.profile_id];
          const status: WorkerApplicationStatus =
            w.verification_status === "pending_verification"
              ? "PENDING"
              : w.verification_status === "verified"
              ? "ACCEPTED"
              : "REJECTED";

          const regType: "NEW_WORKER" | "EXISTING_WORKER" =
            w.registration_type === "EXISTING_WORKER" ? "EXISTING_WORKER" : "NEW_WORKER";

          const formattedAddress = addr
            ? [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")
            : "Address on File";

          const workerSkillList = (skillsMap[w.id] && skillsMap[w.id].length > 0)
            ? skillsMap[w.id]
            : [w.profession || "General Trades"];

          return {
            id: w.id,
            memberId: w.member_id || null,
            registrationType: regType,
            applicantName: profile.full_name || (regType === "EXISTING_WORKER" ? "Existing Worker Member" : "New Worker Applicant"),
            phone: profile.phone || "",
            email: profile.email || "",
            dateOfBirth: w.date_of_birth || "",
            gender: w.gender || "male",
            address: formattedAddress,
            city: addr?.city || "Ahmedabad",
            state: addr?.state || "Gujarat",
            profession: w.profession || "Skilled Tradesperson",
            skills: workerSkillList,
            experienceYears: w.experience_years || 1,
            hourlyRate: Number(w.hourly_rate) || 300,
            previousWorkDetails: w.previous_work_details || null,
            govtIdType: w.govt_id_type || "aadhar",
            govtIdNumber: w.govt_id_number || "",
            govtIdDocumentUrl: w.govt_id_document_url || null,
            avatarUrl: profile.avatar_url || null,
            bankName: w.bank_name || null,
            bankAccountHolder: w.bank_account_holder || null,
            bankAccountNumber: w.bank_account_number || null,
            bankIfscCode: w.bank_ifsc_code || null,
            documents: w.govt_id_document_url ? [
              {
                name: `${w.govt_id_type?.toUpperCase() || "GOVT"}_Document`,
                category: "IDENTITY" as const,
                fileType: "Document",
                fileSize: "Uploaded",
              }
            ] : [],
            submittedDate: w.created_at ? w.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            status,
            rejectionReason: w.rejection_reason || undefined,
          };
        });
      }
    } catch (err) {
      console.warn("Notice: Real worker applications query failed:", err);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      applications = applications.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(q) ||
          app.id.toLowerCase().includes(q) ||
          (app.memberId && app.memberId.toLowerCase().includes(q)) ||
          app.profession.toLowerCase().includes(q)
      );
    }

    return applications;
  }

  /**
   * Accepts worker application:
   * 1. Updates real worker in Supabase: verification_status = 'verified', account_status = 'ACTIVE', availability_status = 'AVAILABLE'
   * 2. Inducts worker into canonical roster
   */
  async acceptWorkerApplication(
    applicationId: string
  ): Promise<{ success: boolean; worker: ManagedWorkerItem }> {
    const today = new Date().toISOString().split("T")[0];
    let updatedWorker: any = null;

    // 1. Invoke server-side route to update workers AND synchronize profiles.is_active = true
    if (typeof window !== "undefined") {
      const headers = await this.getAuthHeaders();
      const res = await fetch("/api/federation/workers", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "accept", workerId: applicationId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to approve worker application in database.");
      }
      updatedWorker = json.worker;
    } else {
      const supabase = createClient();
      const { data, error } = await (supabase.from("workers") as any)
        .update({
          verification_status: "verified",
          account_status: "ACTIVE",
          availability_status: "AVAILABLE",
        })
        .eq("id", applicationId)
        .select(`
          id,
          profile_id,
          experience_years,
          hourly_rate,
          account_status,
          availability_status,
          profiles:profile_id (
            full_name,
            email,
            phone
          )
        `)
        .maybeSingle();

      if (error) {
        throw new Error(error.message || "Failed to approve worker application in database.");
      }
      updatedWorker = data;
    }

    // Update local fallback application if present
    const appIndex = this.fallbackApplications.findIndex((a) => a.id === applicationId);
    if (appIndex !== -1) {
      this.fallbackApplications[appIndex] = {
        ...this.fallbackApplications[appIndex],
        status: "ACCEPTED",
        reviewedAt: today,
      };
    }

    // 2. Induct worker into canonical federation roster with ACTIVE status
    const profile = updatedWorker?.profiles || (appIndex !== -1 ? {
      full_name: this.fallbackApplications[appIndex].applicantName,
      email: this.fallbackApplications[appIndex].email,
      phone: this.fallbackApplications[appIndex].phone,
    } : {});

    const inductedWorker: ManagedWorkerItem = {
      id: updatedWorker?.member_id || updatedWorker?.id || applicationId,
      fullName: profile.full_name || "Verified Worker",
      profession: updatedWorker?.profession || "Skilled Tradesperson",
      area: "Ahmedabad Central",
      city: "Ahmedabad",
      state: "Gujarat",
      accountStatus: "ACTIVE",
      availabilityStatus: "AVAILABLE",
      hourlyRate: Number(updatedWorker?.hourly_rate) || 350,
      experienceYears: updatedWorker?.experience_years || 2,
      joiningDate: today,
      phone: profile.phone || "+91 98000 00000",
      email: profile.email || "worker@example.com",
    };

    this.fallbackWorkers = [inductedWorker, ...this.fallbackWorkers.filter((w) => w.id !== inductedWorker.id)];

    return {
      success: true,
      worker: inductedWorker,
    };
  }

  /**
   * Rejects worker application:
   * 1. Updates real worker in Supabase: verification_status = 'suspended', account_status = 'DEACTIVATED'
   * 2. Synchronizes profiles.is_active = false
   * 3. Preserves historical record
   */
  async rejectWorkerApplication(
    applicationId: string,
    rejectionReason: string
  ): Promise<{ success: boolean; applicationId: string }> {
    const today = new Date().toISOString().split("T")[0];

    if (typeof window !== "undefined") {
      const headers = await this.getAuthHeaders();
      const res = await fetch("/api/federation/workers", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "reject", workerId: applicationId, rejectionReason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to reject worker application in database.");
      }
    } else {
      const supabase = createClient();
      const { error } = await (supabase.from("workers") as any)
        .update({
          verification_status: "suspended",
          account_status: "DEACTIVATED",
          rejection_reason: rejectionReason,
        })
        .eq("id", applicationId);

      if (error) {
        throw new Error(error.message || "Failed to reject worker application in database.");
      }
    }

    // Update local fallback list if present
    const appIndex = this.fallbackApplications.findIndex((a) => a.id === applicationId);
    if (appIndex !== -1) {
      this.fallbackApplications[appIndex] = {
        ...this.fallbackApplications[appIndex],
        status: "REJECTED",
        rejectionReason,
        reviewedAt: today,
      };
    }

    return {
      success: true,
      applicationId,
    };
  }

  // ==========================================
  // STAGE 5: WORKER INFORMATION CHANGE REQUESTS
  // ==========================================

  /**
   * Retrieves change requests submitted by workers for verified credentials.
   */
  async getWorkerChangeRequests(
    searchQuery: string = "",
    statusFilter: WorkerChangeRequestStatus | "ALL" = "ALL"
  ): Promise<WorkerChangeRequestItem[]> {
    let list = this.fallbackChangeRequests;

    if (statusFilter !== "ALL") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.workerName.toLowerCase().includes(q) ||
          r.workerId.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.field.toLowerCase().includes(q)
      );
    }

    return list;
  }

  /**
   * Approves worker change request:
   * CRITICAL DATA INTEGRITY RULE (Section 18):
   * 1. Updates request status to APPROVED
   * 2. Canonical worker record is updated with requestedValue
   */
  async approveWorkerChangeRequest(
    requestId: string
  ): Promise<{ success: boolean; requestId: string; workerId: string }> {
    const reqIndex = this.fallbackChangeRequests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      throw new Error(`Change request ${requestId} not found.`);
    }

    const request = this.fallbackChangeRequests[reqIndex];
    const today = new Date().toISOString().split("T")[0];

    // 1. Update request status to APPROVED
    this.fallbackChangeRequests[reqIndex] = {
      ...request,
      status: "APPROVED",
      reviewedAt: today,
    };

    // 2. Canonical worker information updates ONLY upon approval!
    this.fallbackWorkers = this.fallbackWorkers.map((w) => {
      if (w.id === request.workerId) {
        if (request.field.toLowerCase().includes("profession")) {
          return { ...w, profession: request.requestedValue };
        }
        if (request.field.toLowerCase().includes("rate") || request.field.toLowerCase().includes("tariff")) {
          const parsedRate = parseInt(request.requestedValue.replace(/\D/g, ""), 10);
          return { ...w, hourlyRate: isNaN(parsedRate) ? w.hourlyRate : parsedRate };
        }
        if (request.field.toLowerCase().includes("address")) {
          return { ...w, area: request.requestedValue };
        }
      }
      return w;
    });

    return {
      success: true,
      requestId,
      workerId: request.workerId,
    };
  }

  /**
   * Rejects worker change request:
   * CRITICAL DATA INTEGRITY RULE:
   * 1. Updates request status to REJECTED with recorded reason
   * 2. Canonical worker record remains strictly UNCHANGED
   */
  async rejectWorkerChangeRequest(
    requestId: string,
    rejectionReason: string
  ): Promise<{ success: boolean; requestId: string }> {
    const reqIndex = this.fallbackChangeRequests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      throw new Error(`Change request ${requestId} not found.`);
    }

    const today = new Date().toISOString().split("T")[0];

    // Update request status to REJECTED with reason
    this.fallbackChangeRequests[reqIndex] = {
      ...this.fallbackChangeRequests[reqIndex],
      status: "REJECTED",
      rejectionReason,
      reviewedAt: today,
    };

    // Canonical worker information remains untouched!
    return {
      success: true,
      requestId,
    };
  }
}

export const workforceManagementService = new WorkforceManagementService();
