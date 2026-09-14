import * as React from "react";
import { CompetingEstimatesView } from "@/features/customer/competing-estimates/competing-estimates-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Competing Worker Estimates - KaushalyaSetu",
  description: "Review and compare competitive service estimates from skilled cooperative workers in real-time.",
};

export default function CustomerRequestEstimatesPage({
  params,
}: {
  params: { requestId: string };
}) {
  return <CompetingEstimatesView requestId={params.requestId} />;
}
