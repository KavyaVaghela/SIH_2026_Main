import * as React from "react";
import { WorkerDetailView } from "@/features/federation-admin/worker-information";

interface WorkerDetailPageProps {
  params: {
    workerId: string;
  };
}

export const metadata = {
  title: "Worker Profile Detail - KaushalyaSetu",
  description:
    "Read-only statutory profile, personal information, verified trade credentials, and job fulfillment performance metrics.",
};

export default function WorkerDetailPage({ params }: WorkerDetailPageProps) {
  return <WorkerDetailView workerId={decodeURIComponent(params.workerId)} />;
}
