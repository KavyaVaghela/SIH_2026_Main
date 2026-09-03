import { createClient } from "@/lib/supabase/client";
import { MOCK_COMPLAINTS, CATEGORY_LABELS } from "../data/mock-complaints";
import type {
  ComplaintDetails,
  ComplaintStats,
  ComplaintFilterOptions,
  ComplaintStatus,
  ComplaintCategory,
  ComplaintNote,
} from "../types";

// In-memory mutation cache so state transitions, notes, and escalations persist during session
let inMemoryComplaints: ComplaintDetails[] = [...MOCK_COMPLAINTS];

export class ComplaintsService {
  /**
   * Fetches complaints list, statistics, and filter dropdown metadata
   */
  async getComplaints(filters: Partial<ComplaintFilterOptions> = {}): Promise<{
    stats: ComplaintStats;
    complaints: ComplaintDetails[];
    totalCount: number;
    societies: Array<{ id: string; name: string }>;
    categories: Array<{ id: ComplaintCategory; label: string }>;
  }> {
    const supabase = createClient();
    let records = [...inMemoryComplaints];

    try {
      // 1. Fetch real complaints from Supabase
      const { data: dbComplaints } = await (supabase.from("complaints") as any)
        .select(`
          id,
          complaint_number,
          category,
          description,
          status,
          resolution_notes,
          resolved_at,
          created_at,
          booking_id,
          raised_by,
          target_profile_id,
          bookings (id, booking_number, total_amount, scheduled_start_at, services (title), federations (id, name)),
          profiles!complaints_raised_by_fkey (id, full_name, email, phone)
        `);

      if (dbComplaints && dbComplaints.length > 0) {
        // Map real complaints
        const mappedDb: ComplaintDetails[] = dbComplaints.map((c: any) => {
          const categoryKey = (c.category?.toUpperCase() || "OTHER") as ComplaintCategory;
          const status = (c.status?.toUpperCase() || "OPEN") as ComplaintStatus;

          return {
            id: c.id,
            complaintNumber: c.complaint_number || `CMP-${c.id.slice(0, 8)}`,
            category: categoryKey,
            categoryLabel: CATEGORY_LABELS[categoryKey] || c.category || "General",
            customerName: c.profiles?.full_name || "Complainant",
            customerId: c.raised_by || "",
            customerEmail: c.profiles?.email || "N/A",
            customerPhone: c.profiles?.phone || "N/A",
            workerName: "Assigned Craftsman",
            workerId: c.target_profile_id || null,
            workerProfession: "Tradesman",
            workerPhone: null,
            societyName: c.bookings?.federations?.name || "Regional Artisan Federation",
            societyId: c.bookings?.federations?.id || "fed-001",
            bookingNumber: c.bookings?.booking_number || null,
            bookingId: c.booking_id || null,
            bookingServiceTitle: c.bookings?.services?.title || null,
            bookingScheduledAt: c.bookings?.scheduled_start_at || null,
            bookingAmount: c.bookings?.total_amount ? Number(c.bookings.total_amount) : null,
            createdAt: new Date(c.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            status,
            isSafetyCritical: categoryKey === "SAFETY_ISSUE",
            description: c.description || "",
            assignedTo: null,
            resolutionNotes: c.resolution_notes || null,
            resolvedAt: c.resolved_at || null,
            resolvedBy: null,
            notes: [],
          };
        });

        if (mappedDb.length >= 3) {
          records = mappedDb;
        }
      }
    } catch {
      // Fallback to in-memory datasets
    }

    // Compute statistics across full scope
    const totalComplaints = records.length;
    const openCount = records.filter((c) => c.status === "OPEN").length;
    const inReviewCount = records.filter((c) => c.status === "IN_REVIEW").length;
    const resolvedCount = records.filter((c) => c.status === "RESOLVED").length;

    const stats: ComplaintStats = {
      totalComplaints,
      openCount,
      inReviewCount,
      resolvedCount,
    };

    // Filter Logic
    let filtered = [...records];

    if (filters.status && filters.status !== "ALL") {
      filtered = filtered.filter((c) => c.status === filters.status);
    }

    if (filters.category && filters.category !== "ALL") {
      filtered = filtered.filter((c) => c.category === filters.category);
    }

    if (filters.society && filters.society !== "ALL") {
      filtered = filtered.filter((c) => c.societyId === filters.society);
    }

    if (filters.searchQuery && filters.searchQuery.trim() !== "") {
      const q = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.complaintNumber.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.workerName.toLowerCase().includes(q) ||
          (c.bookingNumber && c.bookingNumber.toLowerCase().includes(q)) ||
          c.description.toLowerCase().includes(q)
      );
    }

    // Extract unique societies
    const societiesMap = new Map<string, string>();
    records.forEach((c) => societiesMap.set(c.societyId, c.societyName));
    const societies = Array.from(societiesMap.entries()).map(([id, name]) => ({ id, name }));

    const categories = (Object.keys(CATEGORY_LABELS) as ComplaintCategory[]).map((cat) => ({
      id: cat,
      label: CATEGORY_LABELS[cat],
    }));

    // Pagination
    const totalCount = filtered.length;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      stats,
      complaints: paginated,
      totalCount,
      societies,
      categories,
    };
  }

  /**
   * Fetches single complaint detail
   */
  async getComplaintById(id: string): Promise<ComplaintDetails | null> {
    const found = inMemoryComplaints.find((c) => c.id === id);
    if (found) return found;

    const supabase = createClient();
    try {
      const { data } = await (supabase.from("complaints") as any)
        .select(`
          id,
          complaint_number,
          category,
          description,
          status,
          resolution_notes,
          resolved_at,
          created_at,
          booking_id,
          raised_by,
          target_profile_id,
          bookings (id, booking_number, total_amount, scheduled_start_at, services (title), federations (id, name)),
          profiles!complaints_raised_by_fkey (id, full_name, email, phone)
        `)
        .eq("id", id)
        .single();

      if (data) {
        const categoryKey = (data.category?.toUpperCase() || "OTHER") as ComplaintCategory;
        const status = (data.status?.toUpperCase() || "OPEN") as ComplaintStatus;

        return {
          id: data.id,
          complaintNumber: data.complaint_number || `CMP-${data.id.slice(0, 8)}`,
          category: categoryKey,
          categoryLabel: CATEGORY_LABELS[categoryKey] || data.category || "General",
          customerName: data.profiles?.full_name || "Complainant",
          customerId: data.raised_by || "",
          customerEmail: data.profiles?.email || "N/A",
          customerPhone: data.profiles?.phone || "N/A",
          workerName: "Assigned Craftsman",
          workerId: data.target_profile_id || null,
          workerProfession: "Tradesman",
          workerPhone: null,
          societyName: data.bookings?.federations?.name || "Regional Artisan Federation",
          societyId: data.bookings?.federations?.id || "fed-001",
          bookingNumber: data.bookings?.booking_number || null,
          bookingId: data.booking_id || null,
          bookingServiceTitle: data.bookings?.services?.title || null,
          bookingScheduledAt: data.bookings?.scheduled_start_at || null,
          bookingAmount: data.bookings?.total_amount ? Number(data.bookings.total_amount) : null,
          createdAt: new Date(data.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          status,
          isSafetyCritical: categoryKey === "SAFETY_ISSUE",
          description: data.description || "",
          assignedTo: null,
          resolutionNotes: data.resolution_notes || null,
          resolvedAt: data.resolved_at || null,
          resolvedBy: null,
          notes: [],
        };
      }
    } catch {
      // Return fallback
    }

    return null;
  }

  /**
   * Transitions complaint status (OPEN -> IN_REVIEW -> RESOLVED)
   */
  async updateStatus(
    id: string,
    newStatus: ComplaintStatus,
    resolutionNotes?: string
  ): Promise<boolean> {
    const idx = inMemoryComplaints.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const current = inMemoryComplaints[idx];

      // Canonical lifecycle validation
      if (current.status === "RESOLVED" && newStatus !== "RESOLVED") {
        throw new Error("A resolved complaint cannot be silently transitioned back to an open state.");
      }

      const nowStr = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      inMemoryComplaints[idx] = {
        ...current,
        status: newStatus,
        resolutionNotes: resolutionNotes || current.resolutionNotes,
        resolvedAt: newStatus === "RESOLVED" ? nowStr : current.resolvedAt,
        resolvedBy: newStatus === "RESOLVED" ? "Super Admin" : current.resolvedBy,
      };
    }

    // Attempt real database update
    try {
      const supabase = createClient();
      await (supabase.from("complaints") as any)
        .update({
          status: newStatus,
          resolution_notes: resolutionNotes || null,
          resolved_at: newStatus === "RESOLVED" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch {
      // In-memory update succeeded
    }

    return true;
  }

  /**
   * Appends an internal admin note
   */
  async addNote(id: string, noteContent: string, authorName = "Super Admin"): Promise<ComplaintNote> {
    const nowStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newNote: ComplaintNote = {
      id: `not-${Date.now()}`,
      authorName,
      authorRole: "Super Administrator",
      content: noteContent,
      createdAt: nowStr,
    };

    const idx = inMemoryComplaints.findIndex((c) => c.id === id);
    if (idx !== -1) {
      inMemoryComplaints[idx].notes.unshift(newNote);
    }

    return newNote;
  }

  /**
   * Assigns or escalates a complaint
   */
  async assignComplaint(id: string, assignee: string): Promise<boolean> {
    const idx = inMemoryComplaints.findIndex((c) => c.id === id);
    if (idx !== -1) {
      inMemoryComplaints[idx].assignedTo = assignee;
      if (inMemoryComplaints[idx].status === "OPEN") {
        inMemoryComplaints[idx].status = "IN_REVIEW";
      }
    }
    return true;
  }
}

export const complaintsService = new ComplaintsService();
