import * as React from "react";
import { ActiveJobDetailView } from "@/features/worker/jobs/active-job-detail-view";

export const metadata = {
  title: "Active Job Execution - Worker Portal | KaushalyaSetu",
  description: "Manage active job workflow: accept booking, track transit directions, and register arrival.",
};

export default function ActiveJobPage({
  params,
}: {
  params: { bookingId: string };
}) {
  return <ActiveJobDetailView bookingId={params.bookingId} />;
}
