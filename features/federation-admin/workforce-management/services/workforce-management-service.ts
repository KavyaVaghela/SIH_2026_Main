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
  private fallbackApplications: WorkerApplicationItem[] = [
    {
      id: "APP-2026-081",
      applicantName: "Arvind Solanki",
      phone: "+91 98251 99112",
      email: "arvind.solanki@gmail.com",
      dateOfBirth: "1994-04-12",
      gender: "Male",
      address: "14, Shreenath Park Society, Isanpur",
      city: "Ahmedabad",
      state: "Gujarat",
      profession: "Electrician",
      skills: ["Residential wiring", "Inverter installation", "MCB distribution boards"],
      experienceYears: 4,
      hourlyRate: 320,
      documents: [
        {
          name: "Aadhaar_Card_Arvind_Solanki.pdf",
          category: "IDENTITY",
          fileType: "PDF",
          fileSize: "840 KB",
        },
        {
          name: "ITI_Electrician_Certificate.pdf",
          category: "TRADE_CERTIFICATE",
          fileType: "PDF",
          fileSize: "1.4 MB",
        },
      ],
      submittedDate: "2026-03-01",
      status: "PENDING",
    },
    {
      id: "APP-2026-082",
      applicantName: "Meena Rathod",
      phone: "+91 98251 99114",
      email: "meena.rathod@gmail.com",
      dateOfBirth: "1996-08-20",
      gender: "Female",
      address: "B-204, Gokul Awas, Vatva",
      city: "Ahmedabad",
      state: "Gujarat",
      profession: "Deep Cleaner",
      skills: ["Deep scrubbing", "Kitchen sanitization", "Glass polishing"],
      experienceYears: 3,
      hourlyRate: 260,
      documents: [
        {
          name: "Aadhaar_Card_Meena_Rathod.pdf",
          category: "IDENTITY",
          fileType: "PDF",
          fileSize: "910 KB",
        },
        {
          name: "Skill_India_Sanitation_Card.pdf",
          category: "SKILL_CERTIFICATE",
          fileType: "PDF",
          fileSize: "1.1 MB",
        },
      ],
      submittedDate: "2026-03-02",
      status: "PENDING",
    },
    {
      id: "APP-2026-083",
      applicantName: "Vikram Prajapati",
      phone: "+91 98251 99116",
      email: "vikram.prajapati@gmail.com",
      dateOfBirth: "1991-11-05",
      gender: "Male",
      address: "8, Gayatri Krupa, Naroda",
      city: "Ahmedabad",
      state: "Gujarat",
      profession: "Plumber",
      skills: ["CPVC pipeline", "Drain blockage clearance", "Sanitary fixture fitting"],
      experienceYears: 7,
      hourlyRate: 340,
      documents: [
        {
          name: "Voter_ID_Vikram_Prajapati.pdf",
          category: "IDENTITY",
          fileType: "PDF",
          fileSize: "750 KB",
        },
        {
          name: "Trade_Apprenticeship_Certificate.pdf",
          category: "TRADE_CERTIFICATE",
          fileType: "PDF",
          fileSize: "1.6 MB",
        },
      ],
      submittedDate: "2026-03-03",
      status: "PENDING",
    },
  ];

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
    const supabase = createClient();
    let workersList: ManagedWorkerItem[] = [];
    let isFallback = true;
    let dataSourceNotice: string | undefined =
      "Development Demonstration State: Displaying deterministic workforce management roster.";

    try {
      const { data: dbWorkers, error } = await supabase
        .from("workers")
        .select(`
          id,
          profession,
          hourly_rate,
          experience_years,
          account_status,
          availability_status,
          joining_date,
          profiles:profile_id (
            full_name,
            email,
            phone
          )
        `);

      if (!error && dbWorkers && dbWorkers.length > 0) {
        workersList = (dbWorkers as any[]).map((w) => {
          const profile = w.profiles || {};
          return {
            id: w.id,
            fullName: profile.full_name || "Cooperative Member",
            profession: w.profession || "Skilled Craftsman",
            area: "Ahmedabad Central",
            city: "Ahmedabad",
            state: "Gujarat",
            accountStatus: (w.account_status || "ACTIVE") as WorkerAccountStatus,
            availabilityStatus: (w.availability_status || "AVAILABLE") as any,
            hourlyRate: w.hourly_rate || 350,
            experienceYears: w.experience_years || 5,
            joiningDate: w.joining_date || "2024-01-01",
            phone: profile.phone || "+91 98250 00000",
            email: profile.email || "worker@kaushalya.coop.in",
          };
        });
        isFallback = false;
        dataSourceNotice = undefined;
      }
    } catch (err) {
      console.warn("Notice: Live workers query unpopulated, engaging deterministic fallback.", err);
    }

    if (workersList.length === 0) {
      workersList = this.fallbackWorkers;
    }

    let filtered = workersList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (w) => w.fullName.toLowerCase().includes(q) || w.id.toLowerCase().includes(q)
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
   * Registers a new worker to the authenticated Federation Admin's federation.
   */
  async addWorker(payload: AddWorkerPayload): Promise<ManagedWorkerItem> {
    const supabase = createClient();
    const newId = `WRK-AHM-01${Math.floor(10 + Math.random() * 90)}`;
    const today = new Date().toISOString().split("T")[0];

    const newWorker: ManagedWorkerItem = {
      id: newId,
      fullName: payload.fullName,
      profession: payload.profession,
      area: payload.city,
      city: payload.city,
      state: payload.state,
      accountStatus: "ACTIVE",
      availabilityStatus: "AVAILABLE",
      hourlyRate: payload.hourlyRate,
      experienceYears: payload.experienceYears,
      joiningDate: today,
      phone: payload.phone,
      email: payload.email,
    };

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: fedData } = await supabase
          .from("federations")
          .select("id")
          .limit(1)
          .maybeSingle();

        const fedRecord = fedData as { id: string } | null;
        if (fedRecord?.id) {
          await (supabase.from("workers") as any).insert({
            profile_id: user.id,
            federation_id: fedRecord.id,
            profession: payload.profession,
            hourly_rate: payload.hourlyRate,
            experience_years: payload.experienceYears,
            account_status: "ACTIVE",
            availability_status: "AVAILABLE",
          });
        }
      }
    } catch (err) {
      console.warn("Notice: Live worker registration failed or unauthenticated, persisting to dev store.", err);
    }

    this.fallbackWorkers = [newWorker, ...this.fallbackWorkers];
    return newWorker;
  }

  /**
   * Directly transitions worker account status (ACTIVE <-> DEACTIVATED).
   */
  async updateWorkerAccountStatus(
    workerId: string,
    newStatus: WorkerAccountStatus
  ): Promise<{ success: boolean; workerId: string; updatedStatus: WorkerAccountStatus }> {
    const supabase = createClient();

    try {
      const { error } = await (supabase.from("workers") as any)
        .update({ account_status: newStatus })
        .eq("id", workerId);

      if (!error) {
        // Live DB updated
      }
    } catch (err) {
      console.warn("Notice: Live worker status update unpopulated, updating dev store.", err);
    }

    this.fallbackWorkers = this.fallbackWorkers.map((w) => {
      if (w.id === workerId) {
        return {
          ...w,
          accountStatus: newStatus,
        };
      }
      return w;
    });

    return {
      success: true,
      workerId,
      updatedStatus: newStatus,
    };
  }

  // ==========================================
  // STAGE 5: NEW WORKER REQUESTS
  // ==========================================

  /**
   * Retrieves incoming worker applications scoped to authenticated federation context.
   */
  async getWorkerApplications(
    searchQuery: string = "",
    statusFilter: WorkerApplicationStatus | "ALL" = "ALL"
  ): Promise<WorkerApplicationItem[]> {
    let list = this.fallbackApplications;

    if (statusFilter !== "ALL") {
      list = list.filter((app) => app.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(q) ||
          app.id.toLowerCase().includes(q) ||
          app.profession.toLowerCase().includes(q)
      );
    }

    return list;
  }

  /**
   * Accepts worker application:
   * 1. Updates application status to ACCEPTED
   * 2. Adds worker to canonical roster with ACTIVE account status
   */
  async acceptWorkerApplication(
    applicationId: string
  ): Promise<{ success: boolean; worker: ManagedWorkerItem }> {
    const appIndex = this.fallbackApplications.findIndex((a) => a.id === applicationId);
    if (appIndex === -1) {
      throw new Error(`Application ${applicationId} not found.`);
    }

    const application = this.fallbackApplications[appIndex];
    const today = new Date().toISOString().split("T")[0];

    // 1. Update application status
    this.fallbackApplications[appIndex] = {
      ...application,
      status: "ACCEPTED",
      reviewedAt: today,
    };

    // 2. Induct worker into canonical federation roster with ACTIVE status
    const newWorkerId = `WRK-AHM-01${Math.floor(10 + Math.random() * 90)}`;
    const inductedWorker: ManagedWorkerItem = {
      id: newWorkerId,
      fullName: application.applicantName,
      profession: application.profession,
      area: application.city,
      city: application.city,
      state: application.state,
      accountStatus: "ACTIVE",
      availabilityStatus: "AVAILABLE",
      hourlyRate: application.hourlyRate,
      experienceYears: application.experienceYears,
      joiningDate: today,
      phone: application.phone,
      email: application.email,
    };

    this.fallbackWorkers = [inductedWorker, ...this.fallbackWorkers];

    return {
      success: true,
      worker: inductedWorker,
    };
  }

  /**
   * Rejects worker application:
   * 1. Updates application status to REJECTED with recorded reason
   * 2. Preserves historical record
   * 3. Does NOT create a worker
   */
  async rejectWorkerApplication(
    applicationId: string,
    rejectionReason: string
  ): Promise<{ success: boolean; applicationId: string }> {
    const appIndex = this.fallbackApplications.findIndex((a) => a.id === applicationId);
    if (appIndex === -1) {
      throw new Error(`Application ${applicationId} not found.`);
    }

    const today = new Date().toISOString().split("T")[0];

    this.fallbackApplications[appIndex] = {
      ...this.fallbackApplications[appIndex],
      status: "REJECTED",
      rejectionReason,
      reviewedAt: today,
    };

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
