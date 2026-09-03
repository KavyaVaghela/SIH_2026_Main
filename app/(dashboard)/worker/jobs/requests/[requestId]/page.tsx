import * as React from "react";
import { JobRequestDetailView } from "@/features/worker/jobs/job-request-detail-view";

export const metadata = {
  title: "Job Request Details - Worker Portal | KaushalyaSetu",
  description: "View incoming customer service request details, platform estimate, and service scope.",
};

export default function JobRequestDetailPage({
  params,
}: {
  params: { requestId: string };
}) {
  return <JobRequestDetailView requestId={params.requestId} />;
}
