import * as React from "react";
import { Suspense } from "react";
import { WelfareDashboardView } from "@/features/super-admin/worker-welfare/components/welfare-dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Worker Welfare & Social Protection - Super Admin",
};

export default function WelfarePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-80" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <WelfareDashboardView />
    </Suspense>
  );
}
