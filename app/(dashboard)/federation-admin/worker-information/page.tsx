import * as React from "react";
import { WorkerInformationView } from "@/features/federation-admin/worker-information";

export const metadata = {
  title: "Worker Information Roster - KaushalyaSetu",
  description:
    "View and analyze skilled cooperative workers, trade certifications, availability, and fulfillment performance records.",
};

export default function WorkerInformationPage() {
  return <WorkerInformationView />;
}
