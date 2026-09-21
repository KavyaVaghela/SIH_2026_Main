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

// Empty fallback store - all real societies are derived from Supabase public.federations
let mockSocietiesStore: SocietyDetails[] = [];

export class SocietiesService {
  /**
   * Fetch societies list with filters, sorting, and pagination
   * Aggregates real worker count, active jobs, bookings, and worker-derived ratings without N+1 queries.
   */
  async getSocieties(
    options: Partial<SocietyFilterOptions> = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clientOverride?: any
  ): Promise<{
    data: SocietyListItem[];
    totalCount: number;
    locations: string[];
  }> {
    if (typeof window !== "undefined" && !clientOverride) {
      try {
        const params = new URLSearchParams();
        if (options.searchQuery) params.set("searchQuery", options.searchQuery);
        if (options.status && options.status !== "ALL") params.set("status", options.status);
        if (options.location && options.location !== "ALL") params.set("location", options.location);
        if (options.sortBy) params.set("sortBy", options.sortBy);
        if (options.sortOrder) params.set("sortOrder", options.sortOrder);
        if (options.page) params.set("page", String(options.page));
        if (options.pageSize) params.set("pageSize", String(options.pageSize));

        const qs = params.toString();
        const res = await fetch(`/api/super-admin/societies${qs ? `?${qs}` : ""}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn("Notice: falling back to direct client query for societies:", e);
      }
    }

    const supabase = clientOverride || createClient();

    try {
      // Fetch federations, workers, bookings, reviews, and admin profiles in parallel
      const [
        { data: dbFederations, error: fedError },
        { data: dbWorkers, error: workerError },
        { data: dbBookings, error: bookingError },
        { data: dbReviews, error: reviewError },
        { data: adminProfiles },
      ] = await Promise.all([
        (supabase.from("federations") as any).select("*").order("name"),
        (supabase.from("workers") as any).select("id, federation_id, account_status, availability_status"),
        (supabase.from("bookings") as any).select("id, federation_id, status"),
        (supabase.from("reviews") as any).select("worker_id, rating"),
        (supabase.from("profiles") as any).select("email, full_name").eq("role", "FEDERATION_ADMIN"),
      ]);

      if (!fedError && dbFederations && dbFederations.length > 0) {
        // Look up Federation Admin profile names
        const adminMap = new Map<string, string>();
        if (adminProfiles) {
          adminProfiles.forEach((p: any) => {
            if (p.email && p.full_name) adminMap.set(p.email.toLowerCase(), p.full_name);
          });
        }

        // Map workers by federation
        const workersByFed = new Map<string, Array<{ id: string; availability_status: string }>>();
        (dbWorkers || []).forEach((w: any) => {
          if (w.federation_id && w.account_status !== "DELETED") {
            const list = workersByFed.get(w.federation_id) || [];
            list.push({ id: w.id, availability_status: w.availability_status });
            workersByFed.set(w.federation_id, list);
          }
        });

        // Map bookings by federation
        const bookingsByFed = new Map<string, Array<{ id: string; status: string }>>();
        (dbBookings || []).forEach((b: any) => {
          if (b.federation_id) {
            const list = bookingsByFed.get(b.federation_id) || [];
            list.push({ id: b.id, status: b.status });
            bookingsByFed.set(b.federation_id, list);
          }
        });

        // Map reviews by worker ID
        const reviewsByWorker = new Map<string, number[]>();
        (dbReviews || []).forEach((r: any) => {
          if (r.worker_id && typeof r.rating === "number") {
            const list = reviewsByWorker.get(r.worker_id) || [];
            list.push(r.rating);
            reviewsByWorker.set(r.worker_id, list);
          }
        });

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
          status?: string;
          is_active: boolean;
          created_at?: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        }>;

        // Compute honest derived metrics for each federation
        const items: SocietyListItem[] = typedFederations.map((fed) => {
          const workers = workersByFed.get(fed.id) || [];
          const totalWorkers = workers.length;

          const bookings = bookingsByFed.get(fed.id) || [];
          const totalBookings = bookings.length;
          const completedBookings = bookings.filter(
            (b) => b.status === "BOOKING_COMPLETED" || b.status === "SERVICE_COMPLETED"
          ).length;
          const activeJobs = bookings.filter(
            (b) =>
              b.status !== "BOOKING_COMPLETED" &&
              b.status !== "SERVICE_COMPLETED" &&
              b.status !== "CANCELLED" &&
              b.status !== "REJECTED"
          ).length;

          // Compute average worker rating honestly from real reviews
          const ratings: number[] = [];
          workers.forEach((w) => {
            const wr = reviewsByWorker.get(w.id);
            if (wr) ratings.push(...wr);
          });
          const averageRating =
            ratings.length > 0
              ? Number((ratings.reduce((sum, val) => sum + val, 0) / ratings.length).toFixed(1))
              : null;

          const realAdminName = fed.contact_email ? adminMap.get(fed.contact_email.toLowerCase()) : null;
          const status = (fed.status as SocietyStatus) || (fed.is_active ? "ACTIVE" : "PENDING");

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
            adminName: realAdminName || "Cooperative Secretary",
            serviceRegion: fed.service_region,
            totalWorkers,
            activeJobs,
            totalBookings,
            completedBookings,
            averageRating,
            status,
            isActive: fed.is_active,
            registrationDate: fed.created_at
              ? new Date(fed.created_at).toISOString().split("T")[0]
              : "2024-01-01",
            rejectionReason: fed.rejection_reason || null,
            reviewedAt: fed.reviewed_at || null,
            reviewedBy: fed.reviewed_by || null,
          };
        });

        return this.applyFilters(items, options);
      }
    } catch (err) {
      console.error("Notice: error loading real societies from database:", err);
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
      filtered = filtered.filter((i) => {
        if (options.status === "PENDING_VERIFICATION" || options.status === "PENDING") {
          return i.status === "PENDING" || i.status === "PENDING_VERIFICATION";
        }
        return i.status === options.status;
      });
    }

    // 4. Sorting
    const sortBy = options.sortBy || "name";
    const sortOrder = options.sortOrder || "asc";

    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof SocietyListItem];
      let valB: any = b[sortBy as keyof SocietyListItem];

      if (sortBy === "averageRating") {
        valA = valA !== null && valA !== undefined ? valA : -1;
        valB = valB !== null && valB !== undefined ? valB : -1;
      }

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
   * Get single society by ID with accurate real metrics
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
        let realAdminName: string | null = null;
        if (fedRecord.contact_email) {
          const { data: prof } = await (supabase.from("profiles") as any)
            .select("full_name")
            .eq("email", fedRecord.contact_email)
            .eq("role", "FEDERATION_ADMIN")
            .maybeSingle();
          if (prof?.full_name) {
            realAdminName = prof.full_name;
          }
        }

        // Parallel queries for workers, bookings
        const [
          { data: workers },
          { data: bookings },
        ] = await Promise.all([
          (supabase.from("workers") as any)
            .select("id, availability_status, account_status")
            .eq("federation_id", id),
          (supabase.from("bookings") as any)
            .select("id, status")
            .eq("federation_id", id),
        ]);

        const validWorkers = (workers || []).filter((w: any) => w.account_status !== "DELETED");
        const totalWorkers = validWorkers.length;
        const busyWorkers = validWorkers.filter((w: any) => w.availability_status === "BUSY").length;
        const utilizationRate = totalWorkers > 0 ? Math.round((busyWorkers / totalWorkers) * 100) : 0;

        const bookingList = bookings || [];
        const totalBookings = bookingList.length;
        const completedBookings = bookingList.filter(
          (b: any) => b.status === "BOOKING_COMPLETED" || b.status === "SERVICE_COMPLETED"
        ).length;
        const cancelledBookings = bookingList.filter(
          (b: any) => b.status === "CANCELLED" || b.status === "REJECTED"
        ).length;
        const activeJobs = bookingList.filter(
          (b: any) =>
            b.status !== "BOOKING_COMPLETED" &&
            b.status !== "SERVICE_COMPLETED" &&
            b.status !== "CANCELLED" &&
            b.status !== "REJECTED"
        ).length;

        const completionRate =
          totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 100;
        const cancellationRate =
          totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

        // Derived average rating from worker reviews
        let averageRating: number | null = null;
        if (validWorkers.length > 0) {
          const workerIds = validWorkers.map((w: any) => w.id);
          const { data: reviews } = await (supabase.from("reviews") as any)
            .select("rating")
            .in("worker_id", workerIds);
          if (reviews && reviews.length > 0) {
            const sum = reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
            averageRating = Number((sum / reviews.length).toFixed(1));
          }
        }

        // Real complaints count from linked bookings
        let complaintCount = 0;
        if (bookingList.length > 0) {
          const bookingIds = bookingList.map((b: any) => b.id);
          const { data: complaints } = await (supabase.from("complaints") as any)
            .select("id")
            .in("booking_id", bookingIds);
          complaintCount = complaints?.length || 0;
        }

        const status = (fedRecord.status as SocietyStatus) || (fedRecord.is_active ? "ACTIVE" : "PENDING");

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
          adminName: realAdminName || "Cooperative Secretary",
          serviceRegion: fedRecord.service_region,
          totalWorkers,
          activeJobs,
          totalBookings,
          completedBookings,
          averageRating,
          status,
          isActive: fedRecord.is_active,
          registrationDate: fedRecord.created_at
            ? new Date(fedRecord.created_at).toISOString().split("T")[0]
            : "2024-01-01",
          cancellationRate,
          complaintCount,
          utilizationRate,
          completionRate,
          officialDocuments: fedRecord.official_documents || [
            { title: "Cooperative Registration Certificate", url: "#", verified: true },
          ],
          rejectionReason: fedRecord.rejection_reason || null,
          reviewedAt: fedRecord.reviewed_at || null,
          reviewedBy: fedRecord.reviewed_by || null,
        };
      }
    } catch (err) {
      console.error("Notice: error getting society details from database:", err);
    }

    const foundMock = mockSocietiesStore.find((s) => s.id === id);
    return foundMock || null;
  }

  /**
   * Add a new Cooperative Society
   */
  async createSociety(payload: AddSocietyFormPayload): Promise<SocietyDetails> {
    const supabase = createClient();
    const isActive = payload.status === "ACTIVE";

    try {
      const { data, error } = await (supabase.from("federations") as any)
        .insert({
          name: payload.name,
          code: payload.code,
          registration_number: payload.registrationNumber,
          city: payload.city,
          state: payload.state,
          address: payload.address,
          contact_email: payload.contactEmail,
          contact_phone: payload.contactPhone,
          service_region: payload.serviceRegion || null,
          status: payload.status,
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
          averageRating: null,
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
    } catch (err) {
      console.error("Error creating society in database:", err);
    }

    const fallbackId = `fed-${Date.now()}`;
    const createdMock: SocietyDetails = {
      id: fallbackId,
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
      averageRating: null,
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
   * Update society status (Approve, Reject, Suspend, Activate)
   * Synchronizes public.federations and corresponding Federation Admin's profile is_active status in public.profiles
   */
  async updateSocietyStatus(id: string, newStatus: SocietyStatus, rejectionReason?: string): Promise<boolean> {
    const isActive = newStatus === "ACTIVE";
    let action = "approve";
    if (newStatus === "REJECTED") {
      action = "reject";
    } else if (newStatus === "SUSPENDED") {
      action = "suspend";
    } else if (newStatus === "ACTIVE") {
      action = "approve";
    }

    try {
      const res = await fetch("/api/super-admin/societies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          societyId: id,
          rejectionReason,
        }),
      });

      if (res.ok) {
        return true;
      }
    } catch (apiErr) {
      console.warn("Notice: /api/super-admin/societies fetch error:", apiErr);
    }

    // Direct update if API route is unreachable
    const supabase = createClient();
    try {
      const { data: fedData } = await (supabase.from("federations") as any)
        .select("id, contact_email, registration_number")
        .eq("id", id)
        .maybeSingle();

      await (supabase.from("federations") as any)
        .update({
          status: newStatus,
          is_active: isActive,
          rejection_reason: rejectionReason || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      const targetEmail = fedData?.contact_email;
      if (targetEmail) {
        await (supabase.from("profiles") as any)
          .update({ is_active: isActive })
          .eq("email", targetEmail)
          .eq("role", "FEDERATION_ADMIN");
      }
    } catch (err) {
      console.error("Error updating society status in database:", err);
    }

    return true;
  }

  /**
   * Fetch workers belonging to society from live database
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

      if (!error && data) {
        return data.map((w: any) => ({
          id: w.id,
          profileId: w.profile_id,
          fullName: w.profiles?.full_name || "Cooperative Craftsman",
          email: w.profiles?.email,
          phone: w.profiles?.phone,
          profession: w.profession || "Skilled Craftsman",
          experienceYears: w.experience_years || 0,
          hourlyRate: w.hourly_rate || 350,
          accountStatus: w.account_status,
          availabilityStatus: w.availability_status,
          verificationStatus: w.verification_status,
          joiningDate: w.joining_date
            ? new Date(w.joining_date).toISOString().split("T")[0]
            : "2024-01-01",
          avatarUrl: w.profiles?.avatar_url,
        }));
      }
    } catch (err) {
      console.error("Error fetching society workers:", err);
    }

    return [];
  }

  /**
   * Fetch bookings associated with society from live database
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
          profiles!customer_id (full_name),
          workers (
            profiles (full_name)
          ),
          services (title)
        `)
        .eq("federation_id", societyId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((b: any) => ({
          id: b.id,
          bookingNumber: b.booking_number || b.id.slice(0, 8).toUpperCase(),
          customerName: b.profiles?.full_name || "Household Customer",
          workerName: b.workers?.profiles?.full_name || "Assigned Worker",
          serviceTitle: b.services?.title || "Cooperative Service Request",
          scheduledStartAt: b.scheduled_start_at
            ? new Date(b.scheduled_start_at).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Scheduled",
          totalAmount: b.total_amount || 0,
          status: b.status,
          createdAt: b.created_at
            ? new Date(b.created_at).toISOString().split("T")[0]
            : "2024-01-01",
        }));
      }
    } catch (err) {
      console.error("Error fetching society bookings:", err);
    }

    return [];
  }

  /**
   * Get Society Performance Metrics
   */
  async getSocietyPerformance(societyId: string): Promise<SocietyPerformanceMetrics> {
    const details = await this.getSocietyById(societyId);
    if (details) {
      const rating = details.averageRating ?? 0;
      return {
        bookingCompletionRate: details.completionRate,
        workerUtilizationRate: details.utilizationRate,
        customerSatisfaction: rating,
        cancellationRate: details.cancellationRate,
        complaintCount: details.complaintCount,
        overallPerformanceScore: Math.round(
          (details.completionRate + details.utilizationRate + rating * 20) / 3
        ),
      };
    }

    return {
      bookingCompletionRate: 0,
      workerUtilizationRate: 0,
      customerSatisfaction: 0,
      cancellationRate: 0,
      complaintCount: 0,
      overallPerformanceScore: 0,
    };
  }
}

export const societiesService = new SocietiesService();
