import { Metadata } from "next";
import { WorkerServiceBillView } from "@/features/worker/jobs/worker-service-bill-view";

export const metadata: Metadata = {
  title: "Create Service Bill | Worker Portal | KaushalyaSetu",
  description: "Itemize labor and materials to generate the official customer service bill and invoice.",
};

interface PageProps {
  params: {
    bookingId: string;
  };
}

export default function WorkerServiceBillPage({ params }: PageProps) {
  return <WorkerServiceBillView bookingId={params.bookingId} />;
}
