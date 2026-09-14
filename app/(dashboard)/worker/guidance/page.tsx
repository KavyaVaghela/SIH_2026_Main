import { GuidanceCenterView } from "@/features/guidance/components/guidance-center-view";

export const metadata = {
  title: "Help & Guidance | KaushalyaSetu Worker",
  description: "Comprehensive guidance for cooperative craftspeople on estimates, jobs, and earnings.",
};

export default function WorkerGuidancePage() {
  return <GuidanceCenterView role="WORKER" userName="Ravi Patel" />;
}
