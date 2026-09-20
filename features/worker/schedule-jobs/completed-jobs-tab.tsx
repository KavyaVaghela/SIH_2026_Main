"use client";

import * as React from "react";
import { CheckCircle2, Star, Calendar, MapPin, Check, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/formatters/currency";
import { BookingDetailModal } from "./components/booking-detail-modal";
import type { WorkerJobItem } from "../types";

export interface CompletedLargeProjectItem {
  id: string;
  projectId: string;
  projectNumber: string;
  title: string;
  categoryName: string;
  location: string;
  completedDate: string;
  estimatedDays: number;
  dailyRate: number;
  totalEarnings: number;
}

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

  const [jobTypeFilter, setJobTypeFilter] = React.useState<"ALL" | "REGULAR" | "LARGE_PROJECT">("ALL");
  const [completedLargeProjects, setCompletedLargeProjects] = React.useState<CompletedLargeProjectItem[]>([]);
  const [loadingLp, setLoadingLp] = React.useState(true);

  const loadCompletedLargeProjects = React.useCallback(async () => {
    setLoadingLp(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const authUid = user?.id;

      // ROOT CAUSE 1 FIX: Resolve workers.id from workers.profile_id = auth UID
      let currentWorkerId: string | null = null;
      if (authUid) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: workerRow } = await (supabase.from("workers") as any)
            .select("id")
            .eq("profile_id", authUid)
            .single();
          currentWorkerId = workerRow?.id || null;
        } catch {
          currentWorkerId = authUid;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("project_allocations") as any)
        .select("*, project_requests(*)")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filtered = data.filter((alloc: any) => {
          const isAccepted = alloc.response_status === "ACCEPTED" || alloc.status === "assigned";
          const projStatus = (alloc.project_requests?.status || "").toUpperCase();
          const isCompleted = projStatus === "COMPLETED" || projStatus === "SETTLED" || projStatus === "CLOSED";
          const isUserMatch = !currentWorkerId || alloc.worker_id === currentWorkerId;
          return isAccepted && isCompleted && isUserMatch;
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: CompletedLargeProjectItem[] = filtered.map((alloc: any) => {
          const days = 15;
          const rate = alloc.daily_rate || 900;
          return {
            id: alloc.id,
            projectId: alloc.project_id || alloc.project_requests?.id || "proj-101",
            projectNumber: `PRJ-2026-${(alloc.id || "").slice(-4)}`,
            title: alloc.project_requests?.project_name || "Completed Large Project",
            categoryName: "Craft & Construction",
            location: "Ahmedabad, Gujarat",
            completedDate: alloc.project_requests?.updated_at?.split("T")[0] || "2026-09-18",
            estimatedDays: days,
            dailyRate: rate,
            totalEarnings: rate * days,
          };
        });
        setCompletedLargeProjects(mapped);
      } else {
        setCompletedLargeProjects([]);
      }
    } catch (err) {
      console.warn("Could not query completed Large Projects:", err);
      setCompletedLargeProjects([]);
    } finally {
      setLoadingLp(false);
    }
  }, []);

  React.useEffect(() => {
    loadCompletedLargeProjects();
  }, [loadCompletedLargeProjects]);

  const handleCardClick = (job: WorkerJobItem) => {
    setSelectedBooking(job);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Category Type Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-muted-foreground mr-1">Workforce Category:</span>
          <button
            type="button"
            onClick={() => setJobTypeFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              jobTypeFilter === "ALL"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All Completed ({completedJobs.length + completedLargeProjects.length})
          </button>

          <button
            type="button"
            onClick={() => setJobTypeFilter("REGULAR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              jobTypeFilter === "REGULAR"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Regular Jobs ({completedJobs.length})
          </button>

          <button
            type="button"
            onClick={() => setJobTypeFilter("LARGE_PROJECT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              jobTypeFilter === "LARGE_PROJECT"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Large Projects ({completedLargeProjects.length})
          </button>
        </div>
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

      {/* COMPLETED LARGE PROJECTS SECTION */}
      {jobTypeFilter !== "REGULAR" && (
        <div className="space-y-3">
          {jobTypeFilter === "ALL" && (
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              Completed Large Projects ({completedLargeProjects.length})
            </h3>
          )}

          {completedLargeProjects.length === 0 ? (
            jobTypeFilter === "LARGE_PROJECT" && (
              <Card className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-1">
                <Building2 className="w-6 h-6 text-muted-foreground mx-auto" />
                <p className="font-bold text-foreground">No Completed Large Projects</p>
                <p className="text-muted-foreground text-[11px]">Large Projects marked as completed in the database will be logged here.</p>
              </Card>
            )
          ) : (
            <div className="space-y-3">
              {completedLargeProjects.map((lp) => (
                <Card key={lp.id} className="border-emerald-700/30 shadow-xs rounded-xl p-4 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                          {lp.projectNumber} • {lp.categoryName}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                          <Check className="h-2.5 w-2.5 mr-1 text-emerald-600" />
                          Project Completed
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {lp.title}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Contract Payout</span>
                      <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatINR(lp.totalEarnings)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-emerald-600 shrink-0" />
                      Completed: {lp.completedDate}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-600 shrink-0" />
                      {lp.location}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium ml-auto">
                      Daily Rate: {formatINR(lp.dailyRate)}/day
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REGULAR COMPLETED JOBS LIST */}
      {jobTypeFilter !== "LARGE_PROJECT" && (
        <div className="space-y-3 pt-2">
          {jobTypeFilter === "ALL" && (
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Regular Service Requests ({completedJobs.length})
            </h3>
          )}

          {!loading && !error && completedJobs.length === 0 ? (
            jobTypeFilter === "REGULAR" && (
              <Card className="p-8 text-center text-muted-foreground border-dashed space-y-2">
                <CheckCircle2 className="h-6 w-6 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground">No completed regular jobs yet.</p>
              </Card>
            )
          ) : (
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

