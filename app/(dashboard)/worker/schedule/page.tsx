import * as React from "react";
import { ScheduleJobsView } from "@/features/worker/schedule-jobs/schedule-jobs-view";

export const metadata = {
  title: "My Schedule & Jobs - Worker Portal | KaushalyaSetu",
  description: "View job requests, scheduled tasks, active services, and completed assignments.",
};

export default function WorkerSchedulePage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading schedule...</div>}>
      <ScheduleJobsView />
    </React.Suspense>
  );
}
