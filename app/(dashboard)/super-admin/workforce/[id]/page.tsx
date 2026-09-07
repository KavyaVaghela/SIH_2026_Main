import * as React from "react";
import { Suspense } from "react";
import { WorkerDetailView } from "@/features/super-admin/workforce/components/worker-detail-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Worker Profile & Intelligence - Super Admin",
};

export default function WorkerDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-80" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <WorkerDetailView />
    </Suspense>
  );
}
