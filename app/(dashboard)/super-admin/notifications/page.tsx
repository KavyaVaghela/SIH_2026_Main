import * as React from "react";
import { Suspense } from "react";
import { NotificationsDashboardView } from "@/features/super-admin/notifications/components/notifications-dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Notifications & Alerts - Super Admin",
};

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-80" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <NotificationsDashboardView />
    </Suspense>
  );
}
