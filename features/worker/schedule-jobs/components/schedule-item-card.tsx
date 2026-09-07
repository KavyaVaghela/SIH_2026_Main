"use client";

import * as React from "react";
import { Clock, MapPin, User, CheckCircle2, ChevronRight, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CANONICAL_STATUS_LABELS, type WorkerJobItem } from "../../types";

export interface ScheduleItemCardProps {
  item: WorkerJobItem;
  onClick: (item: WorkerJobItem) => void;
}

export function ScheduleItemCard({ item, onClick }: ScheduleItemCardProps) {
  const isConfirmed = item.status === "BOOKING_CONFIRMED" || item.status === "WORKER_ACCEPTED";
  const statusLabel = CANONICAL_STATUS_LABELS[item.status] || item.status;

  return (
    <Card
      onClick={() => onClick(item)}
      className="border-border shadow-sm hover:shadow-md hover:border-emerald-600/40 transition-all cursor-pointer overflow-hidden group"
    >
      <div className="flex flex-col sm:flex-row items-stretch">
        {/* Time Left Badge Bar */}
        <div className="sm:w-32 bg-muted/30 sm:border-r border-b sm:border-b-0 p-4 flex sm:flex-col justify-between sm:justify-center items-center text-center shrink-0">
          <span className="text-base sm:text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {item.scheduledTime}
          </span>
          <span className="text-[11px] text-muted-foreground sm:mt-1 font-medium">
            {item.scheduledDate}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {item.serviceTitle}
                </h4>
                <Badge
                  variant={isConfirmed ? "success" : "warning"}
                  className="text-[10px] py-0 px-2 font-medium"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                  {statusLabel}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-1">
                {item.problemDescription}
              </p>
            </div>

            <div className="flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0">
              <span>View Details</span>
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1.5 border-t">
            <span className="flex items-center">
              <User className="h-3.5 w-3.5 mr-1 text-primary shrink-0" />
              Customer: <strong className="text-foreground ml-1">{item.customerName}</strong>
            </span>

            <span className="flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-600 shrink-0" />
              {item.customerArea}
            </span>

            <span className="flex items-center">
              <Navigation className="h-3.5 w-3.5 mr-1 text-blue-600 shrink-0" />
              {item.distanceKm} km
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
