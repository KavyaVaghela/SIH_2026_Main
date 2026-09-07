"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { BellOff, CheckCircle2 } from "lucide-react";
import { NotificationCardItem } from "./notification-card-item";
import type { SuperAdminNotification } from "../types";

interface NotificationsListProps {
  notifications: SuperAdminNotification[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  isLoading?: boolean;
}

export function NotificationsList({
  notifications,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onMarkAsRead,
  onMarkAsUnread,
  isLoading,
}: NotificationsListProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-card space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-800 dark:text-emerald-300" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Notifications Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No operational notifications match your selected filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notif) => (
        <NotificationCardItem
          key={notif.id}
          notification={notif}
          onMarkAsRead={onMarkAsRead}
          onMarkAsUnread={onMarkAsUnread}
        />
      ))}

      <div className="pt-2">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
