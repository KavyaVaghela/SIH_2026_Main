import { Suspense } from "react";
import { GuidanceCenterView } from "@/features/guidance/components/guidance-center-view";

export const metadata = {
  title: "Help & Guidance | KaushalyaSetu Worker",
  description: "Comprehensive guidance for cooperative craftspeople on estimates, jobs, and earnings.",
};

function GuidanceLoadingFallback() {
  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );
}

export default function WorkerGuidancePage() {
  return (
    <Suspense fallback={<GuidanceLoadingFallback />}>
      <GuidanceCenterView role="WORKER" userName="Ravi Patel" />
    </Suspense>
  );
}

