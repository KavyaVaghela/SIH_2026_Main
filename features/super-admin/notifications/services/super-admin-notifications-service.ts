import { createClient } from "@/lib/supabase/client";
import { MOCK_NOTIFICATIONS } from "../data/mock-notifications";
import type {
  SuperAdminNotification,
  NotificationFilterOptions,
  NotificationStats,
  NotificationCategory,
} from "../types";

// In-memory cache for deterministic persistence across page navigations
let inMemoryNotifications: SuperAdminNotification[] = [...MOCK_NOTIFICATIONS];

export class SuperAdminNotificationsService {
  async getNotifications(filters: Partial<NotificationFilterOptions> = {}): Promise<{
    notifications: SuperAdminNotification[];
    stats: NotificationStats;
    totalCount: number;
  }> {
    let records = [...inMemoryNotifications];

    // Attempt to fetch any real notifications for Super Admin from Supabase
    try {
      const supabase = createClient();
      const { data } = await (supabase.from("notifications") as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const realMapped: SuperAdminNotification[] = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          description: n.message,
          createdAt: new Date(n.created_at).toLocaleDateString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "short",
          }),
          isRead: Boolean(n.is_read),
          category: (n.metadata?.category as NotificationCategory) || "WORKER_SHORTAGE",
          severity: n.type === "error" ? "HIGH" : n.type === "warning" ? "MEDIUM" : "LOW",
          targetRoute: n.metadata?.targetRoute || "/super-admin",
          actionLabel: n.metadata?.actionLabel || "View Details",
          entityId: n.metadata?.entityId,
          entityType: n.metadata?.entityType,
        }));

        if (realMapped.length >= 3) {
          records = realMapped;
        }
      }
    } catch {
      // Fallback to in-memory records
    }

    // Compute global stats before filters
    const total = records.length;
    const unread = records.filter((n) => !n.isRead).length;
    const read = records.filter((n) => n.isRead).length;

    const stats: NotificationStats = { total, unread, read };

    // Apply Filter Logic
    let filtered = [...records];

    if (filters.readStatus === "UNREAD") {
      filtered = filtered.filter((n) => !n.isRead);
    } else if (filters.readStatus === "READ") {
      filtered = filtered.filter((n) => n.isRead);
    }

    if (filters.category && filters.category !== "ALL") {
      filtered = filtered.filter((n) => n.category === filters.category);
    }

    if (filters.searchQuery && filters.searchQuery.trim() !== "") {
      const q = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
      );
    }

    // Pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      notifications: paginated,
      stats,
      totalCount: filtered.length,
    };
  }

  async markAsRead(id: string): Promise<boolean> {
    const idx = inMemoryNotifications.findIndex((n) => n.id === id);
    if (idx !== -1) {
      inMemoryNotifications[idx] = {
        ...inMemoryNotifications[idx],
        isRead: true,
      };
    }

    try {
      const supabase = createClient();
      await (supabase.from("notifications") as any)
        .update({ is_read: true })
        .eq("id", id);
    } catch {
      // Offline fallback
    }

    return true;
  }

  async markAsUnread(id: string): Promise<boolean> {
    const idx = inMemoryNotifications.findIndex((n) => n.id === id);
    if (idx !== -1) {
      inMemoryNotifications[idx] = {
        ...inMemoryNotifications[idx],
        isRead: false,
      };
    }

    try {
      const supabase = createClient();
      await (supabase.from("notifications") as any)
        .update({ is_read: false })
        .eq("id", id);
    } catch {
      // Offline fallback
    }

    return true;
  }

  async markAllAsRead(): Promise<boolean> {
    inMemoryNotifications = inMemoryNotifications.map((n) => ({
      ...n,
      isRead: true,
    }));

    try {
      const supabase = createClient();
      await (supabase.from("notifications") as any)
        .update({ is_read: true })
        .neq("id", "00000000-0000-0000-0000-000000000000");
    } catch {
      // Offline fallback
    }

    return true;
  }
}

export const superAdminNotificationsService = new SuperAdminNotificationsService();
