import type { Metadata } from "next";
import { FederationEarningsView } from "@/features/federation-admin/earnings";

export const metadata: Metadata = {
  title: "Earnings & Revenue | Federation Admin | KaushalyaSetu",
  description: "Financial performance dashboard, platform commission splits, category revenue distribution, and statutory payout reconciliations.",
};

export default function EarningsPage() {
  return <FederationEarningsView />;
}
