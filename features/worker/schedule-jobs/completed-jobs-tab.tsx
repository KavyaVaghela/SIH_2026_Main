"use client";

import * as React from "react";
import { CheckCircle2, Star, Calendar, MapPin, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/formatters/currency";
import { BookingDetailModal } from "./components/booking-detail-modal";
import type { WorkerJobItem } from "../types";

export interface CompletedJobsTabProps {
  completedJobs: WorkerJobItem[];
  loading?: boolean;
  error?: string | null;
}

export function CompletedJobsTab({
  completedJobs,
  loading = false,
  error = null,
}: CompletedJobsTabProps) {
  const [selectedBooking, setSelectedBooking] = React.useState<WorkerJobItem | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleCardClick = (job: WorkerJobItem) => {
    setSelectedBooking(job);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border bg-card">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold text-foreground">Completed Cooperative Assignments</span>
        </div>
        <Badge variant="success" className="text-xs">
          {completedJobs.length} Completed Records
        </Badge>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          <CheckCircle2 className="h-5 w-5 animate-pulse mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-medium">Loading completed jobs...</p>
        </Card>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="p-6 text-center text-destructive border-destructive/30 bg-destructive/5">
          <p className="text-sm font-medium">{error}</p>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && completedJobs.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground border-dashed space-y-2">
          <CheckCircle2 className="h-6 w-6 mx-auto text-muted-foreground/60" />
          <p className="text-sm font-medium text-foreground">No completed jobs yet.</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Jobs marked as completed and verified by customers will be permanently logged here.
          </p>
        </Card>
      )}

      {/* Completed List */}
      {!loading && !error && completedJobs.length > 0 && (
        <div className="space-y-3">
          {completedJobs.map((job) => (
            <Card
              key={job.id}
              onClick={() => handleCardClick(job)}
              className="border-border shadow-sm hover:shadow-md hover:border-emerald-600/40 transition-all cursor-pointer group"
            >
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {job.serviceTitle}
                      </h4>
                      <Badge variant="outline" className="text-[10px] border-emerald-600/30 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <Check className="h-2.5 w-2.5 mr-1" />
                        Completed
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ref: <span className="font-mono">{job.bookingNumber}</span> • Customer: <strong className="text-foreground">{job.customerName}</strong>
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="text-xs text-muted-foreground">Net Payout</span>
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                      {formatINR(job.workerEarnings)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1">
                  {job.problemDescription}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1.5 border-t">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
                    {job.scheduledDate}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
                    {job.customerArea}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium ml-auto">
                    Canonical State: BOOKING_COMPLETED
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
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
