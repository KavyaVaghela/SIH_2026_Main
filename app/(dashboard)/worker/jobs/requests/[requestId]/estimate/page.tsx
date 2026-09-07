import * as React from "react";
import { WorkerEstimateFormView } from "@/features/worker/jobs/worker-estimate-form-view";

export const metadata = {
  title: "Create Service Estimate - Worker Portal | KaushalyaSetu",
  description: "Prepare and submit an itemized labour and materials quotation for an incoming customer request.",
};

export default function WorkerEstimatePage({
  params,
}: {
  params: { requestId: string };
}) {
  return <WorkerEstimateFormView requestId={params.requestId} />;
}
