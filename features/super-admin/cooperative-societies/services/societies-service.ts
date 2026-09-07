import { createClient } from "@/lib/supabase/client";
import type {
  SocietyListItem,
  SocietyDetails,
  SocietyWorkerItem,
  SocietyBookingItem,
  SocietyPerformanceMetrics,
  AddSocietyFormPayload,
  SocietyFilterOptions,
  SocietyStatus,
} from "../types";

// Dev Fallback Data Store
let mockSocietiesStore: SocietyDetails[] = [
  {
    id: "fed-001",
    name: "Mumbai Central Worker Cooperative",
    code: "MCWC-01",
    registrationNumber: "REG-MH-2024-001",
    city: "Mumbai",
    state: "Maharashtra",
    location: "Mumbai, Maharashtra",
    address: "Unit 402, Trade Hub, Dadar West, Mumbai - 400028",
    adminName: "Rajesh Sharma",
    contactEmail: "admin@mumbaicoop.org",
    contactPhone: "+91 98200 12345",
    serviceRegion: "Central Mumbai & Suburbs",
    totalWorkers: 184,
    activeJobs: 18,
    totalBookings: 840,
    completedBookings: 790,
    averageRating: 4.8,
    status: "ACTIVE",
    isActive: true,
    registrationDate: "2024-01-15",
    cancellationRate: 3.2,
    complaintCount: 2,
    utilizationRate: 82,
    completionRate: 94.0,
    officialDocuments: [
      { title: "Cooperative Society Registration Certificate", url: "#", verified: true },
      { title: "GST Registration Certificate", url: "#", verified: true },
      { title: "Bylaws & Governance Charter", url: "#", verified: true },
    ],
  },
  {
    id: "fed-002",
    name: "Navi Mumbai Skilled Trades Federation",
    code: "NMSTF-02",
    registrationNumber: "REG-MH-2024-002",
    city: "Navi Mumbai",
    state: "Maharashtra",
    location: "Navi Mumbai, Maharashtra",
    address: "Plot 12, Sector 17, Vashi, Navi Mumbai - 400703",
    adminName: "Sanjay Patil",
    contactEmail: "contact@nmstf.co.in",
    contactPhone: "+91 98333 45678",
    serviceRegion: "Vashi, Nerul & Belapur Corridor",
    totalWorkers: 142,
    activeJobs: 12,
    totalBookings: 620,
    completedBookings: 570,
    averageRating: 4.6,
    status: "ACTIVE",
    isActive: true,
    registrationDate: "2024-02-10",
    cancellationRate: 4.5,
    complaintCount: 4,
    utilizationRate: 75,
    completionRate: 91.9,
    officialDocuments: [
      { title: "Cooperative Registration Certificate", url: "#", verified: true },
      { title: "GST Certificate", url: "#", verified: true },
    ],
  },
  {
    id: "fed-003",
    name: "Thane District Artisans Cooperative",
    code: "TDAC-03",
    registrationNumber: "REG-MH-2024-003",
    city: "Thane",
    state: "Maharashtra",
    location: "Thane, Maharashtra",
    address: "7th Floor, Commerce Center, Naupada, Thane - 400602",
    adminName: "Sunita Deshmukh",
    contactEmail: "admin@thanecoop.org",
    contactPhone: "+91 97690 98765",
    serviceRegion: "Thane West, Majiwada & Ghodbunder",
    totalWorkers: 96,
    activeJobs: 4,
    totalBookings: 390,
    completedBookings: 350,
    averageRating: 4.9,
    status: "PENDING_VERIFICATION",
    isActive: false,
    registrationDate: "2024-04-05",
    cancellationRate: 2.1,
    complaintCount: 1,
    utilizationRate: 68,
    completionRate: 89.7,
    officialDocuments: [
      { title: "Draft Registration Copy", url: "#", verified: false },
    ],
  },
  {
    id: "fed-004",
    name: "Pune Metro Gig Workers Society",
    code: "PMGWS-04",
    registrationNumber: "REG-MH-2024-004",
    city: "Pune",
    state: "Maharashtra",
    location: "Pune, Maharashtra",
    address: "Block B, Tech Park Road, Hinjewadi, Pune - 411057",
    adminName: "Vikram Joshi",
    contactEmail: "info@punegig.org",
    contactPhone: "+91 91234 56789",
    serviceRegion: "Hinjewadi, Baner & Wakad",
    totalWorkers: 210,
    activeJobs: 24,
    totalBookings: 1120,
    completedBookings: 1040,
    averageRating: 4.7,
    status: "ACTIVE",
    isActive: true,
    registrationDate: "2023-11-20",
    cancellationRate: 3.8,
    complaintCount: 3,
    utilizationRate: 88,
    completionRate: 92.8,
    officialDocuments: [
      { title: "Registration Certificate", url: "#", verified: true },
      { title: "PAN & Tax Audit File", url: "#", verified: true },
    ],
  },
  {
    id: "fed-005",
    name: "Nashik Green & Solar Tech Guild",
    code: "NGSTG-05",
    registrationNumber: "REG-MH-2024-005",
    city: "Nashik",
    state: "Maharashtra",
    location: "Nashik, Maharashtra",
    address: "MIDC Ambad Complex, Nashik - 422010",
    adminName: "Anil Kulkarni",
    contactEmail: "support@nashiksolarguild.org",
    contactPhone: "+91 94222 11223",
    serviceRegion: "Nashik Urban & MIDC Zone",
    totalWorkers: 64,
    activeJobs: 0,
    totalBookings: 180,
    completedBookings: 160,
    averageRating: 4.4,
    status: "SUSPENDED",
    isActive: false,
    registrationDate: "2024-03-01",
    cancellationRate: 8.4,
    complaintCount: 7,
    utilizationRate: 42,
    completionRate: 88.8,
    officialDocuments: [
      { title: "Registration Copy", url: "#", verified: true },
    ],
  },
];

export class SocietiesService {
  /**
   * Fetch societies list with filters, sorting, and pagination
   */
  async getSocieties(options: Partial<SocietyFilterOptions> = {}): Promise<{
    data: SocietyListItem[];
    totalCount: number;
    locations: string[];
  }> {
    const supabase = createClient();

    try {
      const { data: dbFederations, error } = await (supabase.from("federations") as any)
        .select("*");

      if (!error && dbFederations && dbFederations.length > 0) {
        const typedFederations = dbFederations as Array<{
          id: string;
          name: string;
          code: string;
          registration_number: string;
          city: string;
          state: string;
          address: string;
          contact_email: string;
          contact_phone: string;
          service_region?: string | null;
          is_active: boolean;
          created_at?: string;
        }>;

        // Merge DB data with populated metrics
        const items: SocietyListItem[] = typedFederations.map((fed) => {
          const matchedMock = mockSocietiesStore.find((m) => m.id === fed.id || m.code === fed.code);
          return {
            id: fed.id,
            name: fed.name,
            code: fed.code,
            registrationNumber: fed.registration_number,
            city: fed.city,
            state: fed.state,
            location: `${fed.city}, ${fed.state}`,
            contactEmail: fed.contact_email,
            contactPhone: fed.contact_phone,
            adminName: matchedMock?.adminName || "Cooperative Secretary",
            serviceRegion: fed.service_region,
            totalWorkers: matchedMock?.totalWorkers || 45,
            activeJobs: matchedMock?.activeJobs || 3,
            totalBookings: matchedMock?.totalBookings || 210,
            completedBookings: matchedMock?.completedBookings || 195,
            averageRating: matchedMock?.averageRating || 4.7,
            status: fed.is_active ? "ACTIVE" : matchedMock?.status || "PENDING_VERIFICATION",
            isActive: fed.is_active,
            registrationDate: fed.created_at ? new Date(fed.created_at).toISOString().split("T")[0] : "2024-01-01",
          };
        });

        return this.applyFilters(items, options);
      }
    } catch {
      // Ignore DB fetch failure and fallback to mock dataset
    }

    return this.applyFilters(mockSocietiesStore, options);
  }

  private applyFilters(
    items: SocietyListItem[],
    options: Partial<SocietyFilterOptions>
  ): { data: SocietyListItem[]; totalCount: number; locations: string[] } {
    let filtered = [...items];

    // Unique list of locations for filter dropdown
    const locations = Array.from(new Set(items.map((i) => i.location))).sort();

    // 1. Search Query (name or code or registration number)
    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          i.registrationNumber.toLowerCase().includes(q) ||
          i.adminName.toLowerCase().includes(q)
      );
    }

    // 2. Filter by Location
    if (options.location && options.location !== "ALL") {
      filtered = filtered.filter((i) => i.location === options.location);
    }

    // 3. Filter by Status
    if (options.status && options.status !== "ALL") {
      filtered = filtered.filter((i) => i.status === options.status);
    }

    // 4. Sorting
    const sortBy = options.sortBy || "name";
    const sortOrder = options.sortOrder || "asc";

    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof SocietyListItem];
      let valB: any = b[sortBy as keyof SocietyListItem];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const totalCount = filtered.length;

    // 5. Pagination
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      data: paginated,
      totalCount,
      locations,
    };
  }

  /**
   * Get single society by ID
   */
  async getSocietyById(id: string): Promise<SocietyDetails | null> {
    const supabase = createClient();

    try {
      const { data: fed, error } = await (supabase.from("federations") as any)
        .select("*")
        .eq("id", id)
        .single();

      if (!error && fed) {
        const fedRecord = fed as any;
        const matchedMock = mockSocietiesStore.find((m) => m.id === id || m.code === fedRecord.code);
        return {
          id: fedRecord.id,
          name: fedRecord.name,
          code: fedRecord.code,
          registrationNumber: fedRecord.registration_number,
          city: fedRecord.city,
          state: fedRecord.state,
          location: `${fedRecord.city}, ${fedRecord.state}`,
          address: fedRecord.address,
          contactEmail: fedRecord.contact_email,
          contactPhone: fedRecord.contact_phone,
          adminName: matchedMock?.adminName || "Cooperative Secretary",
          serviceRegion: fedRecord.service_region,
          totalWorkers: matchedMock?.totalWorkers || 45,
          activeJobs: matchedMock?.activeJobs || 3,
          totalBookings: matchedMock?.totalBookings || 210,
          completedBookings: matchedMock?.completedBookings || 195,
          averageRating: matchedMock?.averageRating || 4.7,
          status: fedRecord.is_active ? "ACTIVE" : matchedMock?.status || "PENDING_VERIFICATION",
          isActive: fedRecord.is_active,
          registrationDate: fedRecord.created_at ? new Date(fedRecord.created_at).toISOString().split("T")[0] : "2024-01-01",
          cancellationRate: matchedMock?.cancellationRate || 3.5,
          complaintCount: matchedMock?.complaintCount || 2,
          utilizationRate: matchedMock?.utilizationRate || 78,
          completionRate: matchedMock?.completionRate || 92.5,
          officialDocuments: matchedMock?.officialDocuments || [
            { title: "Cooperative Registration Certificate", url: "#", verified: true },
          ],
        };
      }
    } catch {
      // Fallback to local store lookup
    }

    const foundMock = mockSocietiesStore.find((s) => s.id === id);
    return foundMock || null;
  }

  /**
   * Add a new Cooperative Society
   */
  async createSociety(payload: AddSocietyFormPayload): Promise<SocietyDetails> {
    const supabase = createClient();

    const newId = `fed-${Date.now()}`;
    const isActive = payload.status === "ACTIVE";

    try {
      const { data, error } = await (supabase.from("federations") as any)
        .insert({
          id: newId,
          name: payload.name,
          code: payload.code,
          registration_number: payload.registrationNumber,
          city: payload.city,
          state: payload.state,
          address: payload.address,
          contact_email: payload.contactEmail,
          contact_phone: payload.contactPhone,
          service_region: payload.serviceRegion || null,
          is_active: isActive,
        })
        .select()
        .single();

      if (!error && data) {
        const createdData = data as any;
        const createdDetails: SocietyDetails = {
          id: createdData.id,
          name: createdData.name,
          code: createdData.code,
          registrationNumber: createdData.registration_number,
          city: createdData.city,
          state: createdData.state,
          location: `${createdData.city}, ${createdData.state}`,
          address: createdData.address,
          contactEmail: createdData.contact_email,
          contactPhone: createdData.contact_phone,
          adminName: payload.adminName,
          serviceRegion: createdData.service_region,
          totalWorkers: 0,
          activeJobs: 0,
          totalBookings: 0,
          completedBookings: 0,
          averageRating: 5.0,
          status: payload.status,
          isActive: createdData.is_active,
          registrationDate: new Date().toISOString().split("T")[0],
          cancellationRate: 0,
          complaintCount: 0,
          utilizationRate: 0,
          completionRate: 100,
          officialDocuments: [],
        };
        mockSocietiesStore.unshift(createdDetails);
        return createdDetails;
      }
    } catch {
      // Fallback for unseeded / offline mode
    }

    const createdMock: SocietyDetails = {
      id: newId,
      name: payload.name,
      code: payload.code,
      registrationNumber: payload.registrationNumber,
      city: payload.city,
      state: payload.state,
      location: `${payload.city}, ${payload.state}`,
      address: payload.address,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      adminName: payload.adminName,
      serviceRegion: payload.serviceRegion || null,
      totalWorkers: 0,
      activeJobs: 0,
      totalBookings: 0,
      completedBookings: 0,
      averageRating: 5.0,
      status: payload.status,
      isActive: isActive,
      registrationDate: new Date().toISOString().split("T")[0],
      cancellationRate: 0,
      complaintCount: 0,
      utilizationRate: 0,
      completionRate: 100,
      officialDocuments: [],
    };
    mockSocietiesStore.unshift(createdMock);
    return createdMock;
  }

  /**
   * Update society status (Approve, Activate, Suspend)
   */
  async updateSocietyStatus(id: string, newStatus: SocietyStatus): Promise<boolean> {
    const supabase = createClient();
    const isActive = newStatus === "ACTIVE";

    try {
      await (supabase.from("federations") as any)
        .update({ is_active: isActive })
        .eq("id", id);
    } catch {
      // Fallback mutation
    }

    // Update in-memory fallback store
    const target = mockSocietiesStore.find((s) => s.id === id);
    if (target) {
      target.status = newStatus;
      target.isActive = isActive;
    }
    return true;
  }

  /**
   * Fetch workers belonging to society
   */
  async getSocietyWorkers(societyId: string): Promise<SocietyWorkerItem[]> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("workers")
        .select(`
          id,
          profile_id,
          account_status,
          availability_status,
          verification_status,
          profession,
          hourly_rate,
          experience_years,
          joining_date,
          profiles (
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq("federation_id", societyId);

      if (!error && data && data.length > 0) {
        return data.map((w: any) => ({
          id: w.id,
          profileId: w.profile_id,
          fullName: w.profiles?.full_name || "Cooperative Worker",
          email: w.profiles?.email,
          phone: w.profiles?.phone,
          profession: w.profession || "Skilled Craftsman",
          experienceYears: w.experience_years || 3,
          hourlyRate: w.hourly_rate || 350,
          accountStatus: w.account_status,
          availabilityStatus: w.availability_status,
          verificationStatus: w.verification_status,
          joiningDate: w.joining_date ? new Date(w.joining_date).toISOString().split("T")[0] : "2024-01-01",
          avatarUrl: w.profiles?.avatar_url,
        }));
      }
    } catch {
      // Fallback
    }

    // Dev Fallback Workers List
    return [
      {
        id: "wrk-101",
        profileId: "prf-101",
        fullName: "Aarav Mehta",
        email: "aarav.m@kaushalyasetu.in",
        phone: "+91 98111 22334",
        profession: "Master Electrician",
        experienceYears: 7,
        hourlyRate: 450,
        accountStatus: "ACTIVE",
        availabilityStatus: "AVAILABLE",
        verificationStatus: "verified",
        joiningDate: "2024-01-20",
      },
      {
        id: "wrk-102",
        profileId: "prf-102",
        fullName: "Rohan Verma",
        email: "rohan.v@kaushalyasetu.in",
        phone: "+91 98222 33445",
        profession: "Sanitation Specialist",
        experienceYears: 5,
        hourlyRate: 400,
        accountStatus: "ACTIVE",
        availabilityStatus: "BUSY",
        verificationStatus: "verified",
        joiningDate: "2024-02-01",
      },
      {
        id: "wrk-103",
        profileId: "prf-103",
        fullName: "Priya Nair",
        email: "priya.n@kaushalyasetu.in",
        phone: "+91 98333 44556",
        profession: "Solar Technician",
        experienceYears: 4,
        hourlyRate: 500,
        accountStatus: "ACTIVE",
        availabilityStatus: "AVAILABLE",
        verificationStatus: "verified",
        joiningDate: "2024-02-15",
      },
      {
        id: "wrk-104",
        profileId: "prf-104",
        fullName: "Amit Chawla",
        email: "amit.c@kaushalyasetu.in",
        phone: "+91 98444 55667",
        profession: "Carpenter",
        experienceYears: 8,
        hourlyRate: 380,
        accountStatus: "ACTIVE",
        availabilityStatus: "UNAVAILABLE",
        verificationStatus: "pending_verification",
        joiningDate: "2024-03-10",
      },
    ];
  }

  /**
   * Fetch bookings associated with society
   */
  async getSocietyBookings(societyId: string): Promise<SocietyBookingItem[]> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_number,
          scheduled_start_at,
          total_amount,
          status,
          created_at,
          profiles!customer_id (full_name)
        `)
        .eq("federation_id", societyId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((b: any) => ({
          id: b.id,
          bookingNumber: b.booking_number,
          customerName: b.profiles?.full_name || "Household Customer",
          workerName: "Assigned Worker",
          serviceTitle: "Cooperative Service Request",
          scheduledStartAt: new Date(b.scheduled_start_at).toLocaleDateString(),
          totalAmount: b.total_amount,
          status: b.status,
          createdAt: new Date(b.created_at).toLocaleDateString(),
        }));
      }
    } catch {
      // Fallback
    }

    // Dev Fallback Bookings List
    return [
      {
        id: "bk-901",
        bookingNumber: "BKG-2026-901",
        customerName: "Kavya Vaghela",
        workerName: "Aarav Mehta",
        serviceTitle: "Electrical Circuit Repair & Inspection",
        scheduledStartAt: "2026-09-02 10:00 AM",
        totalAmount: 850,
        status: "SERVICE_COMPLETED",
        createdAt: "2026-09-01",
      },
      {
        id: "bk-902",
        bookingNumber: "BKG-2026-902",
        customerName: "Ananya Iyer",
        workerName: "Priya Nair",
        serviceTitle: "Solar Panel Meter Installation",
        scheduledStartAt: "2026-09-03 02:00 PM",
        totalAmount: 1400,
        status: "SERVICE_STARTED",
        createdAt: "2026-09-02",
      },
      {
        id: "bk-903",
        bookingNumber: "BKG-2026-903",
        customerName: "Devendra Patel",
        workerName: "Rohan Verma",
        serviceTitle: "Bathroom Sanitation & Plumbing",
        scheduledStartAt: "2026-09-04 11:30 AM",
        totalAmount: 650,
        status: "BOOKING_CONFIRMED",
        createdAt: "2026-09-03",
      },
    ];
  }

  /**
   * Get Society Performance Metrics
   */
  async getSocietyPerformance(societyId: string): Promise<SocietyPerformanceMetrics> {
    const details = await this.getSocietyById(societyId);
    if (details) {
      return {
        bookingCompletionRate: details.completionRate,
        workerUtilizationRate: details.utilizationRate,
        customerSatisfaction: details.averageRating,
        cancellationRate: details.cancellationRate,
        complaintCount: details.complaintCount,
        overallPerformanceScore: Math.round((details.completionRate + details.utilizationRate + details.averageRating * 20) / 3),
      };
    }

    return {
      bookingCompletionRate: 92.5,
      workerUtilizationRate: 78.0,
      customerSatisfaction: 4.8,
      cancellationRate: 3.2,
      complaintCount: 2,
      overallPerformanceScore: 88,
    };
  }
}

export const societiesService = new SocietiesService();
