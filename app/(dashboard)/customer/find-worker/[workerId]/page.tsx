import * as React from "react";
import { WorkerProfileView } from "@/features/customer/worker-profile/worker-profile-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Worker Profile - KaushalyaSetu",
  description: "View verified cooperative worker profile details on KaushalyaSetu.",
};

export default function WorkerProfilePage({
  params,
}: {
  params: { workerId: string };
}) {
  return <WorkerProfileView workerId={params.workerId} />;
}
