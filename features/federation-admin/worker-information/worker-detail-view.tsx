"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkerDetail } from "./hooks/use-worker-detail";
import { WorkerDetailHeader } from "./components/worker-detail-header";
import { WorkerPersonalSection } from "./components/worker-personal-section";
import { WorkerProfessionalSection } from "./components/worker-professional-section";
import { WorkerCertificationSection } from "./components/worker-certification-section";
import { WorkerDocumentsSection } from "./components/worker-documents-section";
import { WorkerPerformanceSection } from "./components/worker-performance-section";
import { WorkerComplaintSummaryCard } from "./components/worker-complaint-summary";

interface WorkerDetailViewProps {
  workerId: string;
}

export function WorkerDetailView({ workerId }: WorkerDetailViewProps) {
  const { worker, isLoading, error, refresh } = useWorkerDetail(workerId);

  return (
    <div className="space-y-6 pb-16">
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
          <Skeleton className="h-44 w-full" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-6 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300 space-y-3 text-center max-w-lg mx-auto my-8">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-600" />
          <h3 className="font-semibold text-base">Worker Profile Error</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
          <div className="flex justify-center space-x-2 pt-2">
            <Link href="/federation-admin/worker-information">
              <Button variant="outline" size="sm" className="text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back to Roster
              </Button>
            </Link>
            <Button
              variant="default"
              size="sm"
              onClick={refresh}
              className="text-xs bg-emerald-800 text-white"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      {worker && !isLoading && (
        <div className="space-y-6">
          {/* Header */}
          <WorkerDetailHeader worker={worker} />

          {/* Section 1: Personal Information */}
          <section aria-label="Personal Information">
            <WorkerPersonalSection personal={worker.personal} />
          </section>

          {/* Section 2: Professional Information & Skills */}
          <section aria-label="Professional Information">
            <WorkerProfessionalSection professional={worker.professional} />
          </section>

          {/* Section 3: Performance & Fulfillment Benchmarks */}
          <section aria-label="Performance Benchmarks">
            <WorkerPerformanceSection performance={worker.performance} />
          </section>

          {/* Section 4: Certifications */}
          <section aria-label="Certifications">
            <WorkerCertificationSection certifications={worker.certifications} />
          </section>

          {/* Section 5: Official Documents */}
          <section aria-label="Official Documents">
            <WorkerDocumentsSection documents={worker.documents} />
          </section>

          {/* Section 6: Customer Dispute & Complaints */}
          <section aria-label="Customer Complaints">
            <WorkerComplaintSummaryCard complaints={worker.complaints} />
          </section>
        </div>
      )}
    </div>
  );
}
