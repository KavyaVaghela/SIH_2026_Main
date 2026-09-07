import * as React from "react";
import { Suspense } from "react";
import { SettingsDashboardView } from "@/features/super-admin/settings/components/settings-dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Platform Governance Settings - Super Admin",
};

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-80" />
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <SettingsDashboardView />
    </Suspense>
  );
}
