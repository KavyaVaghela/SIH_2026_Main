"use client";

import * as React from "react";
import { Calendar, Clock, RefreshCw, Building2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleItemCard } from "./components/schedule-item-card";
import { BookingDetailModal } from "./components/booking-detail-modal";
import { formatINR } from "@/lib/formatters/currency";
import type { WorkerJobItem, ScheduleViewMode } from "../types";

export interface ScheduledLargeProjectItem {
  id: string;
  projectId: string;
  projectNumber: string;
  title: string;
  categoryName: string;
  location: string;
  plannedStartDate: string;
  estimatedDays: number;
  dailyRate: number;
  status: string;
}

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

  const [scheduledLargeProjects, setScheduledLargeProjects] = React.useState<ScheduledLargeProjectItem[]>([]);
  const [loadingLp, setLoadingLp] = React.useState(true);

  const loadScheduledLargeProjects = React.useCallback(async () => {
    setLoadingLp(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const currentWorkerId = user?.id;

      // Query database ONLY for accepted allocations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("project_allocations") as any)
        .select("*, project_requests(*)")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const acceptedAllocs = data.filter((alloc: any) => {
          const isAccepted = alloc.response_status === "ACCEPTED" || alloc.status === "assigned";
          const isUserMatch = !currentWorkerId || alloc.worker_id === currentWorkerId;
          return isAccepted && isUserMatch;
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: ScheduledLargeProjectItem[] = acceptedAllocs.map((alloc: any) => ({
          id: alloc.id,
          projectId: alloc.project_id || alloc.project_requests?.id || "proj-101",
          projectNumber: `PRJ-2026-${(alloc.id || "").slice(-4)}`,
          title: alloc.project_requests?.project_name || "Accepted Large Project Schedule",
          categoryName: "Craft & Construction",
          location: "Ahmedabad, Gujarat",
          plannedStartDate: alloc.project_requests?.desired_start_date || "2026-09-25",
          estimatedDays: 15,
          dailyRate: alloc.daily_rate || 900,
          status: alloc.project_requests?.status || "CONFIRMED",
        }));
        setScheduledLargeProjects(mapped);
      } else {
        setScheduledLargeProjects([]);
      }
    } catch (err) {
      console.warn("Could not load scheduled Large Projects:", err);
      setScheduledLargeProjects([]);
    } finally {
      setLoadingLp(false);
    }
  }, []);

  React.useEffect(() => {
    loadScheduledLargeProjects();
  }, [loadScheduledLargeProjects]);

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
            { id: "UPCOMING", label: `Upcoming (${upcomingSchedule.length + scheduledLargeProjects.length})` },
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
              {todaySchedule.length} Assigned Regular Jobs
            </Badge>
          </div>

          {todaySchedule.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">
              <p className="text-sm font-medium text-foreground">No regular jobs scheduled for today.</p>
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

      {/* UPCOMING SCHEDULE VIEW (INCLUDING ACCEPTED LARGE PROJECTS) */}
      {!loading && !error && (viewMode === "UPCOMING" || viewMode === "ALL") && (
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              Upcoming Schedule & Accepted Projects
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {upcomingSchedule.length + scheduledLargeProjects.length} Scheduled Items
            </Badge>
          </div>

          {/* ACCEPTED LARGE PROJECTS IN SCHEDULE */}
          {scheduledLargeProjects.length > 0 && (
            <div className="space-y-3">
              {scheduledLargeProjects.map((lp) => (
                <Card key={lp.id} className="border-emerald-700/40 bg-white dark:bg-slate-900 rounded-xl p-4 space-y-2 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                          {lp.projectNumber} • {lp.categoryName}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-bold gap-1">
                          <Building2 className="w-3 h-3 text-emerald-600" />
                          Accepted Large Project
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {lp.title}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Rate</span>
                      <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatINR(lp.dailyRate)} / day
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-emerald-600 shrink-0" />
                      Planned Start: {lp.plannedStartDate} ({lp.estimatedDays} days)
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-600 shrink-0" />
                      {lp.location}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium ml-auto">
                      Status: {lp.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {upcomingSchedule.length === 0 && scheduledLargeProjects.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">
              <p className="text-sm font-medium text-foreground">No upcoming jobs or projects scheduled.</p>
              <p className="text-xs text-muted-foreground pt-1">
                Confirmed jobs and accepted Large Projects will appear here.
              </p>
            </Card>
          ) : (
            upcomingSchedule.length > 0 && (
              <div className="space-y-3">
                {upcomingSchedule.map((item) => (
                  <ScheduleItemCard key={item.id} item={item} onClick={handleCardClick} />
                ))}
              </div>
            )
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

