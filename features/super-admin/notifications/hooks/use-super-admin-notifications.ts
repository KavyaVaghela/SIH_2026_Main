"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { superAdminNotificationsService } from "../services/super-admin-notifications-service";
import type {
  SuperAdminNotification,
  NotificationFilterOptions,
  NotificationStats,
  NotificationCategory,
} from "../types";

export function useSuperAdminNotifications() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialView = (searchParams?.get("view") as "ALL" | "UNREAD" | "READ") || "ALL";
  const initialCategory = (searchParams?.get("category") as NotificationCategory) || "ALL";
  const initialSearch = searchParams?.get("q") || "";
  const initialPage = Number(searchParams?.get("page")) || 1;

  const [filters, setFilters] = React.useState<NotificationFilterOptions>({
    readStatus: initialView,
    category: initialCategory,
    searchQuery: initialSearch,
    page: initialPage,
    pageSize: 10,
  });

  const [notifications, setNotifications] = React.useState<SuperAdminNotification[]>([]);
  const [stats, setStats] = React.useState<NotificationStats>({ total: 0, unread: 0, read: 0 });
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const syncUrlParams = React.useCallback(
    (opts: NotificationFilterOptions) => {
      const params = new URLSearchParams();
      if (opts.readStatus !== "ALL") params.set("view", opts.readStatus);
      if (opts.category !== "ALL") params.set("category", opts.category);
      if (opts.searchQuery) params.set("q", opts.searchQuery);
      if (opts.page > 1) params.set("page", String(opts.page));

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await superAdminNotificationsService.getNotifications(filters);
      setNotifications(res.notifications);
      setStats(res.stats);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("An error occurred while loading notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const updateFilters = (newFilters: Partial<NotificationFilterOptions>) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        ...newFilters,
        page: newFilters.page !== undefined ? newFilters.page : 1,
      };
      syncUrlParams(updated);
      return updated;
    });
  };

  const resetFilters = () => {
    const defaults: NotificationFilterOptions = {
      readStatus: "ALL",
      category: "ALL",
      searchQuery: "",
      page: 1,
      pageSize: 10,
    };
    setFilters(defaults);
    syncUrlParams(defaults);
  };

  const markAsRead = async (id: string) => {
    await superAdminNotificationsService.markAsRead(id);
    await fetchNotifications();
  };

  const markAsUnread = async (id: string) => {
    await superAdminNotificationsService.markAsUnread(id);
    await fetchNotifications();
  };

  const markAllAsRead = async () => {
    await superAdminNotificationsService.markAllAsRead();
    await fetchNotifications();
  };

  return {
    notifications,
    stats,
    totalCount,
    filters,
    isLoading,
    error,
    updateFilters,
    resetFilters,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
