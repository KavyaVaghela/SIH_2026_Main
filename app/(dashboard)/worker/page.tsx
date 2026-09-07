import { WorkerDashboardView } from "@/features/worker/dashboard-view";

export const metadata = {
  title: "Worker Portal - KaushalyaSetu (Cooperative Services)",
  description: "View incoming service requests, manage schedule, track earnings, and access cooperative welfare benefits.",
};

export default function WorkerPage() {
  return <WorkerDashboardView />;
}
