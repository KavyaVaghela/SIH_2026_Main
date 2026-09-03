import * as React from "react";
import { Suspense } from "react";
import { ComplaintDetailView } from "@/features/super-admin/complaints/components/complaint-detail-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Complaint Investigation - Super Admin",
};

export default function ComplaintDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-80" />
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      }
    >
      <ComplaintDetailView />
    </Suspense>
  );
}
