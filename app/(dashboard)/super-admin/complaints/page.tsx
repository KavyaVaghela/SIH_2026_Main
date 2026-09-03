import * as React from "react";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ComplaintsDashboard } from "@/features/super-admin/complaints/components/complaints-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Complaints & Grievances - Super Admin",
};

export default function ComplaintsPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Platform Grievance & Dispute Resolution"
        description="Supervise customer complaints, craftsmanship service disputes, safety escalations, and federation disciplinary settlements."
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Complaints" },
        ]}
      />
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        }
      >
        <ComplaintsDashboard />
      </Suspense>
    </div>
  );
}
