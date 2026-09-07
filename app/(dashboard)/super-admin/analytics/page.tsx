import * as React from "react";
import { Suspense } from "react";
import { AnalyticsDashboardView } from "@/features/super-admin/analytics/components/analytics-dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Platform Analytics & Benchmarks - Super Admin",
};

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-80" />
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      }
    >
      <AnalyticsDashboardView />
    </Suspense>
  );
}
