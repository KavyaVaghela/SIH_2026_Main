import * as React from "react";
import { Suspense } from "react";
import { FederationAiIntelligenceView } from "@/features/federation-admin/ai-intelligence/components/federation-ai-intelligence-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "AI Intelligence - Federation Admin | KaushalyaSetu",
  description:
    "AI-assisted interpretation of cooperative workforce deployment, demand gaps, and operational balancing recommendations.",
};

export default function FederationAiIntelligencePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="h-12 w-64 bg-muted/40 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      }
    >
      <FederationAiIntelligenceView />
    </Suspense>
  );
}
