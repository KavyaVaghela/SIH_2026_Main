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
    id: "cust-notif-01",
    title: "New estimate received",
    message: "A worker has submitted an estimate for your service request.",
    type: "info",
    timeAgo: "15 min ago",
    isRead: false,
  },
  {
    id: "cust-notif-02",
    title: "Booking confirmed",
    message: "Your booking with the selected worker has been confirmed.",
    type: "success",
    timeAgo: "1 hour ago",
    isRead: false,
  },
  {
    id: "cust-notif-03",
    title: "Payment required",
    message: "Your final service bill is ready. Please complete payment to continue.",
    type: "warning",
    timeAgo: "3 hours ago",
    isRead: false,
  },
  {
    id: "cust-notif-04",
    title: "Complaint update",
    message: "Your complaint has been reviewed by the federation. Open the complaint to view the latest update.",
    type: "info",
    timeAgo: "Yesterday",
    isRead: true,
  },
  {
    id: "cust-notif-05",
    title: "Service completed",
    message: "Your service has been marked as completed. Please review the final bill and payment details.",
    type: "success",
    timeAgo: "Yesterday",
    isRead: true,
  },
];

export interface CustomerNotificationsCardProps {
  notifications?: CustomerNotificationItem[];
  onViewAll?: () => void;
}

export function CustomerNotificationsCard({
  notifications: initialNotifs,
  onViewAll,
}: CustomerNotificationsCardProps) {
  const [items] = React.useState<CustomerNotificationItem[]>(initialNotifs || SAMPLE_CUSTOMER_NOTIFICATIONS);

  const notifications = items;

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
