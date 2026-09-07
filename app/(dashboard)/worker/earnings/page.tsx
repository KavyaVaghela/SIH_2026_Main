import { EarningsView } from "@/features/worker/earnings/earnings-view";

export const metadata = {
  title: "Earnings - Worker Portal | KaushalyaSetu",
  description: "Track daily payouts, weekly and monthly earnings, and direct cooperative bank settlements.",
};

export default function WorkerEarningsPage() {
  return <EarningsView />;
}
