"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ArrowRight, CheckCheck } from "lucide-react";
import { NotificationItem, type NotificationItemProps } from "@/components/data-display/notification-item";
import {
  getRoleFromPathname,
  getStaticNotificationsForRole,
  type RoleNotificationItem,
} from "@/constants/static-notifications";
import type { PlatformRole } from "@/config/navigation";
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
  const [items, setItems] = React.useState<RoleNotificationItem[]>(() =>
    propNotifications ? [] : getStaticNotificationsForRole(currentRole)
  );
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!propNotifications) {
      setItems(getStaticNotificationsForRole(currentRole));
    }
  }, [currentRole, propNotifications]);

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

  // Resolve active items
  const activeItems = propNotifications || items;
  const unreadCount = activeItems.filter((item) => !item.isRead).length;

  // Handle Mark All Read
  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onClearAll?.();
  };

  // Handle individual notification click with navigation
  const handleItemClick = (id: string, targetRoute?: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    onNotificationClick?.(id);
    setIsOpen(false);

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
            {activeItems.length === 0 ? (
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
                  timestamp={item.timestamp}
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
