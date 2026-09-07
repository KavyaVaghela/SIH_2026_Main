"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, MapPin, Clock, ShieldAlert, Phone, Navigation } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/formatters/currency";
import { BookingDetailModal } from "./components/booking-detail-modal";
import { CANONICAL_STATUS_LABELS, type WorkerJobItem } from "../types";

export interface ActiveJobsTabProps {
  activeJobs: WorkerJobItem[];
  loading?: boolean;
  error?: string | null;
}

export function ActiveJobsTab({
  activeJobs,
  loading = false,
  error = null,
}: ActiveJobsTabProps) {
  const [selectedBooking, setSelectedBooking] = React.useState<WorkerJobItem | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleOpenDetails = (job: WorkerJobItem) => {
    setSelectedBooking(job);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          <Activity className="h-5 w-5 animate-pulse mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-medium">Checking active jobs...</p>
        </Card>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="p-6 text-center text-destructive border-destructive/30 bg-destructive/5">
          <p className="text-sm font-medium">{error}</p>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && activeJobs.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground border-dashed space-y-2">
          <Activity className="h-6 w-6 mx-auto text-muted-foreground/60" />
          <p className="text-sm font-medium text-foreground">No active jobs right now.</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Jobs in transit or in-progress will appear here. Check &ldquo;My Schedule&rdquo; for upcoming confirmed bookings.
          </p>
        </Card>
      )}

      {/* Active Jobs List */}
      {!loading && !error && activeJobs.length > 0 && (
        <div className="space-y-4">
          {activeJobs.map((job) => {
            const statusLabel = CANONICAL_STATUS_LABELS[job.status] || job.status;

            return (
              <Card key={job.id} className="border-emerald-700/40 shadow-sm overflow-hidden">
                <div className="bg-emerald-800 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-300" />
                    <span>Currently Active Assignment</span>
                  </div>
                  <span className="font-mono">{job.bookingNumber}</span>
                </div>

                <CardHeader className="p-4 sm:p-5 border-b pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg font-bold text-foreground">
                          {job.serviceTitle}
                        </CardTitle>
                        <Badge variant="success" className="text-xs font-semibold">
                          {statusLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground pt-0.5">
                        Customer: <strong className="text-foreground">{job.customerName}</strong> • {job.customerArea}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 pt-1 sm:pt-0">
                      <Link href={`/worker/jobs/${job.id}`}>
                        <Button
                          size="sm"
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
                        >
                          <Navigation className="h-3.5 w-3.5 mr-1" />
                          Manage Job
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleOpenDetails(job)}
                      >
                        Inspection Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                      <span className="text-[11px] text-muted-foreground uppercase font-semibold">Service Type</span>
                      <p className="text-sm font-semibold text-foreground">{job.categoryName}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                      <span className="text-[11px] text-muted-foreground uppercase font-semibold">Scheduled Slot</span>
                      <p className="text-sm font-semibold text-foreground">{job.scheduledDate}, {job.scheduledTime}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                      <span className="text-[11px] text-muted-foreground uppercase font-semibold">Agreed Amount</span>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatINR(job.workerEstimateAmount || job.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {job.otpCode && (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/30 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Customer Service Verification OTP:</span>
                      <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">
                        {job.otpCode}
                      </span>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 text-xs text-amber-950 dark:text-amber-200 flex items-start space-x-2.5">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold">Cooperative Work Protocol:</span>
                      <p className="text-muted-foreground dark:text-amber-300/80">
                        Always follow cooperative safety standards and wear your verified member identification badge.
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 sm:p-5 border-t bg-muted/10 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="text-xs font-semibold border-emerald-600 text-emerald-700 dark:text-emerald-300">
                      {statusLabel}
                    </Badge>
                  </div>
                  <Link href={`/worker/jobs/${job.id}`} className="w-full sm:w-auto">
                    <Button
                      size="sm"
                      className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
                    >
                      <Navigation className="h-3.5 w-3.5 mr-1" />
                      Open Active Job &amp; Directions
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
