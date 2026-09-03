"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ArrowRight, CheckCheck } from "lucide-react";
import { NotificationItem, type NotificationItemProps } from "@/components/data-display/notification-item";
import { superAdminNotificationsService } from "@/features/super-admin/notifications/services/super-admin-notifications-service";
import type { SuperAdminNotification } from "@/features/super-admin/notifications/types";
import { cn } from "@/lib/utils";

export interface NotificationCenterProps {
  notifications?: NotificationItemProps[];
  onNotificationClick?: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

const sampleNotifications: NotificationItemProps[] = [
  {
    id: "n1",
    title: "Booking Confirmed",
    message: "Your plumbing service booking #BK-9021 has been verified by the cooperative.",
    timestamp: "10m ago",
    isRead: false,
    type: "success",
  },
  {
    id: "n2",
    title: "Worker Arriving Soon",
    message: "Ramesh Kumar is 1.5 km away and heading to your location.",
    timestamp: "1h ago",
    isRead: true,
    type: "info",
  },
];

export function NotificationCenter({
  notifications: propNotifications,
  onNotificationClick,
  onClearAll,
  className,
}: NotificationCenterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isSuperAdmin = pathname?.startsWith("/super-admin");

  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [adminNotifications, setAdminNotifications] = React.useState<SuperAdminNotification[]>([]);
  const [adminUnreadCount, setAdminUnreadCount] = React.useState(0);

  // If in Super Admin, fetch and sync operational notifications
  const loadAdminNotifications = React.useCallback(async () => {
    if (isSuperAdmin) {
      const res = await superAdminNotificationsService.getNotifications();
      setAdminNotifications(res.notifications);
      setAdminUnreadCount(res.stats.unread);
    }
  }, [isSuperAdmin]);

  React.useEffect(() => {
    loadAdminNotifications();
  }, [loadAdminNotifications, isOpen]);

  const activeItems: NotificationItemProps[] = isSuperAdmin
    ? adminNotifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.description,
        timestamp: n.createdAt,
        isRead: n.isRead,
        type: n.severity === "HIGH" ? "warning" : n.severity === "MEDIUM" ? "info" : "success",
      }))
    : propNotifications || sampleNotifications;

  const unreadCount = isSuperAdmin
    ? adminUnreadCount
    : activeItems.filter((n) => !n.isRead).length;

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdminClearAll = async () => {
    if (isSuperAdmin) {
      await superAdminNotificationsService.markAllAsRead();
      await loadAdminNotifications();
    } else if (onClearAll) {
      onClearAll();
    }
  };

  const handleItemClick = async (id: string) => {
    if (isSuperAdmin) {
      const matched = adminNotifications.find((n) => n.id === id);
      await superAdminNotificationsService.markAsRead(id);
      await loadAdminNotifications();
      setIsOpen(false);
      if (matched?.targetRoute) {
        router.push(matched.targetRoute);
        return;
      }
    }
    onNotificationClick?.(id);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none"
        title="Notifications Center"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-xl border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between border-b p-3 bg-muted/20 rounded-t-xl">
            <h4 className="text-sm font-bold flex items-center gap-1.5">
              <span>{isSuperAdmin ? "Super Admin Alerts" : "Notifications"}</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleAdminClearAll}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium flex items-center"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
            {activeItems.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">No alerts recorded.</p>
            ) : (
              activeItems.map((item) => (
                <NotificationItem
                  key={item.id}
                  {...item}
                  onClick={() => handleItemClick(item.id)}
                />
              ))
            )}
          </div>

          {isSuperAdmin && (
            <div className="p-2.5 border-t bg-muted/10 rounded-b-xl text-center">
              <Link
                href="/super-admin/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 inline-flex items-center"
              >
                <span>Open Super Admin Notification Hub</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
