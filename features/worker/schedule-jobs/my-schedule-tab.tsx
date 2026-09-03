"use client";

import * as React from "react";
import { Calendar, Clock, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleItemCard } from "./components/schedule-item-card";
import { BookingDetailModal } from "./components/booking-detail-modal";
import type { WorkerJobItem, ScheduleViewMode } from "../types";

export interface MyScheduleTabProps {
  todaySchedule: WorkerJobItem[];
  upcomingSchedule: WorkerJobItem[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function MyScheduleTab({
  todaySchedule,
  upcomingSchedule,
  loading = false,
  error = null,
  onRefresh,
}: MyScheduleTabProps) {
  const [viewMode, setViewMode] = React.useState<ScheduleViewMode>("TODAY");
  const [selectedBooking, setSelectedBooking] = React.useState<WorkerJobItem | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleCardClick = (item: WorkerJobItem) => {
    setSelectedBooking(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* View Switcher & Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border bg-card">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold text-foreground">Service Schedule & Agenda</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {[
            { id: "TODAY", label: `Today's Agenda (${todaySchedule.length})` },
            { id: "UPCOMING", label: `Upcoming (${upcomingSchedule.length})` },
            { id: "ALL", label: "All Scheduled" },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setViewMode(mode.id as ScheduleViewMode)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === mode.id
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode.label}
            </button>
          ))}

          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 text-xs text-muted-foreground hover:text-foreground ml-1"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center text-muted-foreground space-y-2 border-dashed">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600" />
          <p className="text-sm font-medium">Loading your schedule...</p>
        </Card>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="p-6 text-center text-destructive space-y-2 border-destructive/30 bg-destructive/5">
          <p className="text-sm font-medium">{error}</p>
          {onRefresh && (
            <Button size="sm" variant="outline" onClick={onRefresh} className="text-xs">
              Try Again
            </Button>
          )}
        </Card>
      )}

      {/* TODAY'S AGENDA VIEW */}
      {!loading && !error && (viewMode === "TODAY" || viewMode === "ALL") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Today&apos;s Agenda
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {todaySchedule.length} Assigned Jobs
            </Badge>
          </div>

          {todaySchedule.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">
              <p className="text-sm font-medium text-foreground">No jobs scheduled for today.</p>
              <p className="text-xs text-muted-foreground pt-1">
                Enjoy your break or review open requests in the Job Requests tab.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((item) => (
                <ScheduleItemCard key={item.id} item={item} onClick={handleCardClick} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* UPCOMING SCHEDULE VIEW */}
      {!loading && !error && (viewMode === "UPCOMING" || viewMode === "ALL") && (
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              Upcoming Schedule
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {upcomingSchedule.length} Upcoming
            </Badge>
          </div>

          {upcomingSchedule.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">
              <p className="text-sm font-medium text-foreground">No upcoming jobs scheduled.</p>
              <p className="text-xs text-muted-foreground pt-1">
                Confirmed jobs for future dates will appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingSchedule.map((item) => (
                <ScheduleItemCard key={item.id} item={item} onClick={handleCardClick} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clickable Booking Detail Dialog */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
