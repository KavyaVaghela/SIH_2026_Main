"use client";

import * as React from "react";
import { Bell, CheckCircle2, AlertTriangle, Info, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface CustomerNotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timeAgo: string;
  isRead: boolean;
}

export const SAMPLE_CUSTOMER_NOTIFICATIONS: CustomerNotificationItem[] = [
  {
    id: "notif-1",
    title: "Worker Accepted Request",
    message: "Chandu Patel from ABC Labour Cooperative accepted your electrical repair job.",
    type: "success",
    timeAgo: "10 mins ago",
    isRead: false,
  },
  {
    id: "notif-2",
    title: "OTP Verification Required",
    message: "Share Service Start OTP 940218 with worker upon arrival at Satellite address.",
    type: "info",
    timeAgo: "25 mins ago",
    isRead: false,
  },
  {
    id: "notif-3",
    title: "Payment Invoice Generated",
    message: "Invoice INV-901823 of ₹350 for plumbing service is ready for review.",
    type: "info",
    timeAgo: "1 hour ago",
    isRead: true,
  },
];

export interface CustomerNotificationsCardProps {
  notifications?: CustomerNotificationItem[];
  onViewAll?: () => void;
}

export function CustomerNotificationsCard({
  notifications = SAMPLE_CUSTOMER_NOTIFICATIONS,
  onViewAll,
}: CustomerNotificationsCardProps) {
  if (notifications.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 p-5 text-center shadow-sm rounded-xl">
        <Bell className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-xs">No Recent Notifications</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          You are all caught up on updates.
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Recent Activity & Alerts
          </CardTitle>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 p-0 h-auto gap-1 font-medium"
          onClick={onViewAll}
        >
          All Notifications
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="p-4 divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.map((item) => (
          <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {item.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {item.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              {item.type === "info" && <Info className="w-4 h-4 text-sky-500" />}
              {item.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-500" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs">
                <h4 className={`font-semibold ${item.isRead ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
                  {item.title}
                </h4>
                <span className="text-[10px] text-slate-400">{item.timeAgo}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                {item.message}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
