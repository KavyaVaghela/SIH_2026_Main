import * as React from "react";
import { Suspense } from "react";
import { SubpageShell } from "@/features/super-admin/components/subpage-shell";
import { WorkforceDashboard } from "@/features/super-admin/workforce/components/workforce-dashboard";

export const metadata = {
  title: "Workforce Directory - Super Admin",
};

export default function WorkforcePage() {
  return (
    <SubpageShell
      title="Global Workforce Governance"
      description="Monitor verified gig workers, skill certifications, active availability, and registration status."
      moduleName="Workforce"
    >
      <Suspense fallback={<div className="flex items-center justify-center py-8 text-sm text-muted-foreground">Loading workforce intelligence...</div>}>
        <WorkforceDashboard />
      </Suspense>
    </SubpageShell>
  );
}
