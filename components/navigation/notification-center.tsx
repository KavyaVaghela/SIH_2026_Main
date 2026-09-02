"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { NotificationItem, type NotificationItemProps } from "@/components/data-display/notification-item";
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
  notifications = sampleNotifications,
  onNotificationClick,
  onClearAll,
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-lg border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between border-b p-3">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {onClearAll && (
              <button onClick={onClearAll} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  {...item}
                  onClick={() => {
                    onNotificationClick?.(item.id);
                    setIsOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
