"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CheckCheck, Bell, ShieldAlert } from "lucide-react";
import type { NotificationStats } from "../types";

interface NotificationsStatsBarProps {
  stats: NotificationStats;
  onMarkAllAsRead: () => void;
  isLoading?: boolean;
}

export function NotificationsStatsBar({
  stats,
  onMarkAllAsRead,
  isLoading,
}: NotificationsStatsBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-xs">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>Administrative Alert Dispatch</span>
            {stats.unread > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300">
                {stats.unread} Pending Action
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            System-wide exceptions, federation compliance flags, and marketplace anomalies
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 self-end sm:self-auto">
        <div className="text-right text-xs text-muted-foreground hidden sm:block">
          <span className="font-bold text-foreground">{stats.total}</span> Total Events |{" "}
          <span className="font-bold text-foreground">{stats.read}</span> Read
        </div>

        {stats.unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAllAsRead}
            disabled={isLoading}
            className="text-xs font-semibold border-emerald-800/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
            Mark All as Read
          </Button>
        )}
      </div>
    </div>
  );
}
