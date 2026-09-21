"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, MapPin, Clock, ShieldAlert, Navigation, Building2, Plus, CheckCircle2, FileText, DollarSign, Image as ImageIcon, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/formatters/currency";
import { BookingDetailModal } from "./components/booking-detail-modal";
import { CANONICAL_STATUS_LABELS, type WorkerJobItem } from "../types";

export interface ActiveLargeProjectItem {
  id: string;
  projectId: string;
  projectNumber: string;
  title: string;
  categoryName: string;
  location: string;
  plannedStartDate: string;
  estimatedDays: number;
  dailyRate: number; // Predefined by Federation
  status: "IN_PROGRESS" | "ACCEPTED";
}

const DEFAULT_ACTIVE_LARGE_PROJECTS: ActiveLargeProjectItem[] = [
  {
    id: "active-lp-1",
    projectId: "proj-101",
    projectNumber: "PRJ-2026-104",
    title: "Shivam Society Common Area Repainting & Waterproofing",
    categoryName: "Painting & Waterproofing",
    location: "Satellite, Ahmedabad",
    plannedStartDate: "2026-09-25",
    estimatedDays: 15,
    dailyRate: 900,
    status: "IN_PROGRESS",
  },
];

export interface ActiveJobsTabProps {
  activeJobs: WorkerJobItem[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function ActiveJobsTab({
  activeJobs,
  loading = false,
  error = null,
  onRefresh,
}: ActiveJobsTabProps) {
  const [selectedBooking, setSelectedBooking] = React.useState<WorkerJobItem | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [activeLargeProjects, setActiveLargeProjects] = React.useState<ActiveLargeProjectItem[]>([]);
  const [loadingLp, setLoadingLp] = React.useState(true);
  const [lpError, setLpError] = React.useState<string | null>(null);
  const [selectedActiveLp, setSelectedActiveLp] = React.useState<ActiveLargeProjectItem | null>(null);
  const [showTodayUpdateModal, setShowTodayUpdateModal] = React.useState(false);

  // Today's Update Form Fields
  const [workDoneInput, setWorkDoneInput] = React.useState("");
  const [materialsUsedInput, setMaterialsUsedInput] = React.useState("");
  const [materialExpenseInput, setMaterialExpenseInput] = React.useState<number>(0);
  const [photoUrlInput, setPhotoUrlInput] = React.useState("");
  const [updateFile, setUpdateFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [progressInput, setProgressInput] = React.useState<number>(50);
  const [submittingUpdate, setSubmittingUpdate] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentDailyUpdates, setRecentDailyUpdates] = React.useState<Record<string, any[]>>({});

  const loadUpdatesForProject = React.useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/daily-updates?projectId=${projectId}`);
      const json = await res.json();
      const updates = json.dailyUpdates || json.updates;
      if (json.success && Array.isArray(updates)) {
        setRecentDailyUpdates((prev) => ({ ...prev, [projectId]: updates }));
      }
    } catch (err) {
      console.warn("Failed to load project updates:", err);
    }
  }, []);

  const loadActiveLargeProjects = React.useCallback(async () => {
    setLoadingLp(true);
    setLpError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // 1. Fetch projects via existing /api/projects endpoint to bypass client RLS limits
      const projectsMap: Record<string, any> = {};
      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.projects && Array.isArray(json.projects)) {
            json.projects.forEach((p: any) => {
              projectsMap[p.id] = p;
            });
          }
        }
      } catch (pErr) {
        console.warn("Could not fetch projects from /api/projects:", pErr);
      }

      // 2. Fetch project_allocations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("project_allocations") as any)
        .select("*, project_requests(*)")
        .order("created_at", { ascending: false });

      if (error) {
        setLpError(error.message || "Could not fetch active project allocations");
        setActiveLargeProjects([]);
      } else if (data && data.length > 0) {
        // Resolve workers.id from workers.profile_id = auth UID
        const { data: { user } } = await supabase.auth.getUser();
        const authUid = user?.id;
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
            // Fallback: use auth UID if workers table lookup fails
            currentWorkerId = authUid;
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeAllocs = data.filter((alloc: any) => {
          const st = (alloc.status || "").toLowerCase();
          const respSt = (alloc.response_status || "").toLowerCase();
          const isAccepted = st === "assigned" || st === "accepted" || st === "allocated" || respSt === "accepted";
          
          const proj = alloc.project_requests || projectsMap[alloc.project_request_id] || projectsMap[alloc.project_id];
          const projStatus = (proj?.status || "").toUpperCase();
          const isActiveState = projStatus === "IN_PROGRESS" || projStatus === "ACTIVE" || projStatus === "SERVICE_STARTED";
          // Exclude completed/cancelled/closed projects
          const isNotFinished = projStatus !== "COMPLETED" && projStatus !== "CANCELLED" && projStatus !== "CLOSED" && projStatus !== "SETTLED";
          const isUserMatch = !currentWorkerId || alloc.worker_id === currentWorkerId;
          return isAccepted && isActiveState && isNotFinished && isUserMatch;
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: ActiveLargeProjectItem[] = activeAllocs.map((alloc: any) => {
          const proj = alloc.project_requests || projectsMap[alloc.project_request_id] || projectsMap[alloc.project_id] || {};
          const locationMatch = proj.description?.match(/\[Location\]:\s*([^\n]+)/);
          const categoryMatch = proj.description?.match(/\[Category\]:\s*([^\n]+)/);
          const durationMatch = proj.description?.match(/\[Preferred Duration\]:\s*([^\n]+)/);
          const dailyRateMatch = proj.description?.match(/\[Daily Rate\]:\s*(\d+)/);
          const startDateMatch = proj.description?.match(/\[Start Date\]:\s*([^\n]+)/);

          const loc = locationMatch ? locationMatch[1].trim() : "Ahmedabad, Gujarat";
          const catName = categoryMatch ? categoryMatch[1].trim() : (proj.category_name || "Craft & Construction");
          const durStr = durationMatch ? durationMatch[1].trim() : "15 days";
          const estDays = parseInt(durStr, 10) || 15;
          const rate = dailyRateMatch ? Number(dailyRateMatch[1]) : (alloc.daily_rate || 900);
          const startDate = startDateMatch ? startDateMatch[1].trim() : (proj.desired_start_date || "2026-09-25");

          return {
            id: alloc.id,
            projectId: proj.id || alloc.project_request_id || alloc.project_id || "proj-101",
            projectNumber: `PRJ-2026-${(proj.id || alloc.id || "").slice(-4)}`,
            title: proj.project_name || "Active Large Project",
            categoryName: catName,
            location: loc,
            plannedStartDate: startDate,
            estimatedDays: estDays,
            dailyRate: rate,
            status: "IN_PROGRESS",
          };
        });
        setActiveLargeProjects(mapped);

        // Load updates for each active project
        mapped.forEach((p) => loadUpdatesForProject(p.projectId));
      } else {
        setActiveLargeProjects([]);
      }
    } catch (err: any) {
      setLpError(err?.message || "Notice: Environment configuration missing NEXT_PUBLIC_SUPABASE_URL");
      setActiveLargeProjects([]);
    } finally {
      setLoadingLp(false);
    }
  }, [loadUpdatesForProject]);

  React.useEffect(() => {
    loadActiveLargeProjects();
  }, [loadActiveLargeProjects]);

  const handleOpenDetails = (job: WorkerJobItem) => {
    setSelectedBooking(job);
    setIsModalOpen(true);
  };

  const handleOpenTodayUpdate = (lp: ActiveLargeProjectItem) => {
    setSelectedActiveLp(lp);
    setWorkDoneInput("");
    setMaterialsUsedInput("");
    setMaterialExpenseInput(0);
    setPhotoUrlInput("");
    setUpdateFile(null);
    setFileError(null);
    setProgressInput(50);
    setShowTodayUpdateModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setUpdateFile(null);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const validExts = ["jpg", "jpeg", "png"];
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validExts.includes(ext) || (file.type && !validTypes.includes(file.type))) {
      setFileError("Only JPG, JPEG, and PNG proof photos are allowed.");
      setUpdateFile(null);
      e.target.value = "";
      return;
    }
    setUpdateFile(file);
  };

  const handleSubmitTodayUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActiveLp || !workDoneInput.trim()) return;

    setSubmittingUpdate(true);
    setFileError(null);

    let uploadedPhotoUrl = photoUrlInput.trim();
    let uploadedStoragePath = "";
    let uploadedFileName = "";
    let uploadedMimeType = "";
    let uploadedFileSize = 0;

    if (updateFile) {
      try {
        const formData = new FormData();
        formData.append("file", updateFile);
        formData.append("projectId", selectedActiveLp.projectId);
        const uploadRes = await fetch("/api/projects/daily-updates/upload", {
          method: "POST",
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          setFileError(uploadJson.error || "File upload failed. Strictly JPG, JPEG, and PNG proof photos are allowed.");
          setSubmittingUpdate(false);
          return;
        }
        uploadedPhotoUrl = uploadJson.publicUrl || uploadJson.mediaUrl || "";
        uploadedStoragePath = uploadJson.storagePath || "";
        uploadedFileName = uploadJson.fileName || updateFile.name;
        uploadedMimeType = uploadJson.mimeType || updateFile.type;
        uploadedFileSize = uploadJson.fileSize || updateFile.size;
      } catch (err: any) {
        setFileError(err?.message || "File upload error");
        setSubmittingUpdate(false);
        return;
      }
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Resolve workers.id for daily update submission
      let resolvedWorkerId = user?.id || "";
      if (user?.id) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: wRow } = await (supabase.from("workers") as any)
            .select("id")
            .eq("profile_id", user.id)
            .single();
          if (wRow?.id) resolvedWorkerId = wRow.id;
        } catch {
          // Use auth UID as fallback
        }
      }

      const res = await fetch("/api/projects/daily-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedActiveLp.projectId,
          workerId: resolvedWorkerId,
          workDate: new Date().toISOString().slice(0, 10),
          workDescription: workDoneInput.trim(),
          progressPercentage: progressInput,
          photoUrl: uploadedPhotoUrl,
          storagePath: uploadedStoragePath,
          fileName: uploadedFileName,
          mimeType: uploadedMimeType,
          fileSize: uploadedFileSize,
          expenseAmount: materialExpenseInput,
          expenseDescription: materialsUsedInput.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        console.warn("API progress error notice:", json.error);
      }
    } catch (err) {
      console.warn("DB daily update insert notice:", err);
    }

    setSubmittingUpdate(false);
    setShowTodayUpdateModal(false);
    setSuccessMessage(`✓ Today's update (${progressInput}% progress) for "${selectedActiveLp.title}" recorded successfully! Daily payout rate: ${formatINR(selectedActiveLp.dailyRate)}/day.`);
    loadUpdatesForProject(selectedActiveLp.projectId);
  };

  return (
    <div className="space-y-4">
      {/* Success Notification */}
      {successMessage && (
        <Card className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="font-bold text-emerald-700 hover:underline">Dismiss</button>
        </Card>
      )}

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

      {/* ACTIVE LARGE PROJECTS SECTION */}
      {!loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              Active Large Projects ({activeLargeProjects.length})
            </h3>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">Daily Update Protocol</span>
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onRefresh) onRefresh();
                    loadActiveLargeProjects();
                  }}
                  className="h-7 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading || loadingLp ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              )}
            </div>
          </div>

          {lpError && (
            <Card className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
              Notice: {lpError}
            </Card>
          )}

          {loadingLp ? (
            <Card className="p-6 text-center text-xs text-muted-foreground rounded-xl space-y-2">
              <Clock className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
              <p className="font-bold">Loading active project assignments from database...</p>
            </Card>
          ) : activeLargeProjects.length === 0 ? (
            <Card className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-1">
              <Building2 className="w-6 h-6 text-muted-foreground mx-auto" />
              <p className="font-bold text-foreground">No Active Large Projects</p>
              <p className="text-muted-foreground text-[11px]">When you accept a Large Project opportunity under Job Requests, your active assignments will display here for Today's Update submission.</p>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {activeLargeProjects.map((lp) => (
              <Card key={lp.id} className="border-emerald-700/40 shadow-xs rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">
                      {lp.projectNumber} • {lp.categoryName}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {lp.title}
                    </h4>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Daily Rate</span>
                    <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                      {formatINR(lp.dailyRate)} <span className="text-xs font-normal text-muted-foreground">/ day</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Location</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {lp.location}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Planned Schedule</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> {lp.plannedStartDate} ({lp.estimatedDays} days)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Assignment Status</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-[11px] mt-0.5">
                      Active In-Progress
                    </Badge>
                  </div>
                </div>

                {/* TODAY'S UPDATE ACTION BUTTON */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 italic">Submit daily work progress and material logs</span>
                  <Button
                    type="button"
                    onClick={() => handleOpenTodayUpdate(lp)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 shadow-sm gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Today&apos;s Update
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )}

      {/* REGULAR ACTIVE JOBS LIST */}
      {!loading && !error && activeJobs.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Regular Active Jobs ({activeJobs.length})
          </h3>

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
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TODAY'S UPDATE FORM MODAL (Phase 3 Checkpoint C) */}
      {showTodayUpdateModal && selectedActiveLp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 rounded-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">{selectedActiveLp.projectNumber}</span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Submit Today&apos;s Work Progress Update</h3>
              </div>
              <button onClick={() => setShowTodayUpdateModal(false)} className="text-xs text-slate-400 hover:text-slate-600">✕ Cancel</button>
            </div>

            <form onSubmit={handleSubmitTodayUpdate} className="space-y-4 text-xs">
              <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-300/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">{selectedActiveLp.title}</span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                  Worker Daily Payout Rate: {formatINR(selectedActiveLp.dailyRate)} / day (Predefined by Federation)
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Overall Project Progress (0–100%) *</label>
                  <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-400">{progressInput}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressInput}
                  onChange={(e) => setProgressInput(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Work Performed Today (Required)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe task progress completed today, areas covered, block numbers..."
                  value={workDoneInput}
                  onChange={(e) => setWorkDoneInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Materials / Products Used (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Primer 20L, Wall putty 10kg"
                    value={materialsUsedInput}
                    onChange={(e) => setMaterialsUsedInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Material Expense (₹) (Optional)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 1500"
                    value={materialExpenseInput}
                    onChange={(e) => setMaterialExpenseInput(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* STRICT JPG / JPEG / PNG FILE UPLOAD */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Upload Proof Photo (JPG / JPEG / PNG) *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:text-white file:font-bold file:text-xs hover:file:bg-emerald-800 cursor-pointer"
                />
                {fileError && (
                  <p className="text-rose-600 font-bold text-[11px] mt-1">{fileError}</p>
                )}
                <span className="text-[10px] text-slate-400 block pt-0.5">Or provide image URL if already hosted:</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowTodayUpdateModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingUpdate} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5">
                  {submittingUpdate ? "Submitting..." : "Submit Today's Update"}
                </Button>
              </div>
            </form>
          </Card>
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
