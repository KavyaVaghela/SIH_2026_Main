import * as React from "react";
import { MatchingResultsView } from "@/features/customer/worker-matching/matching-results-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find Verified Cooperative Worker - KaushalyaSetu",
  description: "Matched verified trade professionals on KaushalyaSetu Community Owned Digital Marketplace.",
};

export default function FindWorkerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500 animate-pulse">Loading worker matches...</p>
        </div>
      }
    >
      <MatchingResultsView />
    </React.Suspense>
  );
}
