"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ArrowRight, CheckCheck } from "lucide-react";
import { NotificationItem, type NotificationItemProps } from "@/components/data-display/notification-item";
import { getRoleFromPathname } from "@/constants/static-notifications";
import type { PlatformRole } from "@/config/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface NotificationCenterProps {
  role?: PlatformRole;
  notifications?: NotificationItemProps[];
  onNotificationClick?: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

const ROLE_DISPLAY_TITLES: Record<PlatformRole, string> = {
  CUSTOMER: "Customer Notifications",
  WORKER: "Worker Notifications",
  FEDERATION_ADMIN: "Federation Alerts",
  SUPER_ADMIN: "Super Admin Alerts",
};

interface LiveNotification {
  id: string;
  profileId?: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "alert";
  isRead: boolean;
  createdAt: string;
  targetRoute?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  metadata?: Record<string, any> | null;
}

export function NotificationCenter({
  role: propRole,
  notifications: propNotifications,
  onNotificationClick,
  onClearAll,
  className,
}: NotificationCenterProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentRole: PlatformRole = propRole || getRoleFromPathname(pathname);
  const isSuperAdmin = currentRole === "SUPER_ADMIN";

  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [liveItems, setLiveItems] = React.useState<LiveNotification[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Resolve current authenticated user profile
  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        setProfileId(user.id);
      }
    });
  }, []);

  // 2. Fetch live real notifications from database
  const fetchLiveNotifications = React.useCallback(async () => {
    if (propNotifications) {
      // If parent explicitly passed custom notifications array, use it
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("role", currentRole);
      if (profileId) {
        params.set("profileId", profileId);
      }

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.notifications)) {
          setLiveItems(
            json.notifications.map((n: any) => ({
              id: n.id,
              profileId: n.profileId,
              title: n.title,
              message: n.message,
              type: n.type === "error" ? "alert" : n.type || "info",
              isRead: Boolean(n.isRead),
              createdAt: n.createdAt,
              targetRoute: n.targetRoute,
              priority: n.priority,
              metadata: n.metadata,
            }))
          );
        }
      }
    } catch (err) {
      console.warn("Notice: failed to fetch live notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentRole, profileId, propNotifications]);

  React.useEffect(() => {
    fetchLiveNotifications();
  }, [fetchLiveNotifications]);

  // 3. Supabase Realtime Subscription
  React.useEffect(() => {
    const supabase = createClient();

    // Unique channel per active role / profile to prevent duplicate subscriptions
    const channelName = `realtime-notifications-${currentRole}-${profileId || "all"}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newRow = payload.new as any;
            // Role-awareness and recipient filter
            const isRelevant =
              (profileId && newRow.profile_id === profileId) ||
              (isSuperAdmin && (!newRow.profile_id || newRow.profile_id === profileId));

            if (isRelevant) {
              setLiveItems((prev) => {
                // Deduplication by notification ID
                if (prev.some((item) => item.id === newRow.id)) {
                  return prev;
                }
                const mapped: LiveNotification = {
                  id: newRow.id,
                  profileId: newRow.profile_id,
                  title: newRow.title,
                  message: newRow.message,
                  type: newRow.type === "error" ? "alert" : newRow.type || "info",
                  isRead: Boolean(newRow.is_read),
                  createdAt: newRow.created_at,
                  targetRoute:
                    newRow.metadata?.targetRoute ||
                    (newRow.metadata?.bookingId
                      ? isSuperAdmin
                        ? `/super-admin/bookings/${newRow.metadata.bookingId}`
                        : `/customer/bookings/${newRow.metadata.bookingId}`
                      : isSuperAdmin
                      ? "/super-admin/bookings"
                      : undefined),
                  priority: newRow.type === "error" ? "urgent" : "high",
                  metadata: newRow.metadata,
                };
                return [mapped, ...prev];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedRow = payload.new as any;
            setLiveItems((prev) =>
              prev.map((item) =>
                item.id === updatedRow.id
                  ? { ...item, isRead: Boolean(updatedRow.is_read) }
                  : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as any;
            setLiveItems((prev) => prev.filter((item) => item.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRole, profileId, isSuperAdmin]);

  // Handle outside click to close notification drawer
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format timestamps safely without hydration mismatches
  const formatTimestamp = (isoStr?: string) => {
    if (!isoStr) return "";
    if (!isMounted) {
      // Deterministic SSR/initial render
      return isoStr.split("T")[0];
    }
    try {
      const diffMs = Date.now() - new Date(isoStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return new Date(isoStr).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoStr.split("T")[0];
    }
  };

  // Resolve active items
  const activeItems = propNotifications || liveItems;
  const unreadCount = activeItems.filter((item) => !item.isRead).length;

  // Handle Mark All Read with DB persistence
  const handleMarkAllRead = async () => {
    // Optimistic UI update
    setLiveItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onClearAll?.();

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "markAllRead",
          role: currentRole,
          profileId,
        }),
      });
    } catch (err) {
      console.warn("Notice: error persisting markAllRead to database:", err);
    }
  };

  // Handle individual notification click with DB persistence and navigation
  const handleItemClick = async (id: string, targetRoute?: string) => {
    // Optimistic UI update
    setLiveItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    onNotificationClick?.(id);
    setIsOpen(false);

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "markRead",
          id,
        }),
      });
    } catch (err) {
      console.warn("Notice: error persisting markRead to database:", err);
    }

    if (targetRoute) {
      router.push(targetRoute);
    }
  };

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        title="Notifications Center"
        aria-label={`Open notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-xl border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-3.5 bg-muted/30 rounded-t-xl">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <span>{ROLE_DISPLAY_TITLES[currentRole] || "Notifications"}</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1 focus:outline-none"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications Feed */}
          <div className="max-h-84 sm:max-h-96 overflow-y-auto p-2.5 space-y-2">
            {isLoading && activeItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Loading live alerts...
              </div>
            ) : activeItems.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-medium text-muted-foreground">No notifications recorded.</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">You are up to date on platform updates.</p>
              </div>
            ) : (
              activeItems.map((item) => (
                <NotificationItem
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  message={item.message}
                  timestamp={"timestamp" in item ? item.timestamp : formatTimestamp(item.createdAt)}
                  isRead={item.isRead}
                  type={item.type}
                  priority={item.priority}
                  targetRoute={item.targetRoute}
                  onClick={() => handleItemClick(item.id, item.targetRoute)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {isSuperAdmin && (
            <div className="p-2.5 border-t bg-muted/15 rounded-b-xl text-center">
              <Link
                href="/super-admin/bookings"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 inline-flex items-center gap-1 transition-colors"
              >
                <span>View Platform Operational Bookings</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
