import * as React from "react";
import { Suspense } from "react";
import { ProfileDashboardView } from "@/features/super-admin/profile/components/profile-dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Super Admin Profile & Credentials",
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-80" />
          </div>
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      }
    >
      <ProfileDashboardView />
    </Suspense>
  );
}
