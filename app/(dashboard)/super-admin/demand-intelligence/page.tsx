import * as React from "react";
import { Suspense } from "react";
import { DemandIntelligenceView } from "@/features/super-admin/demand-intelligence/components/demand-intelligence-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Demand Intelligence & Workforce Allocation - Super Admin",
};

export default function DemandIntelligencePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-80" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <DemandIntelligenceView />
    </Suspense>
  );
}
