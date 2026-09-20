"use client";

import * as React from "react";
import { Search, Filter, AlertCircle, RefreshCw, Sparkles, Building2, Users, Calendar, MapPin, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobRequestCard } from "./components/job-request-card";
import { workerJobService } from "../services/worker-job-service";
import type { WorkerJobItem, JobRequestFilterOption } from "../types";
import { formatINR } from "@/lib/formatters/currency";

export interface LargeProjectOpportunity {
  id: string;
  requirementId: string;
  projectId: string;
  projectNumber: string;
  title: string;
  categoryName: string;
  description: string;
  location: string;
  plannedStartDate: string;
  estimatedDays: number;
  dailyRate: number; // Predefined by Federation
  requiredWorkersCount: number;
  acceptedWorkersCount: number;
  status: "INVITED" | "ACCEPTED" | "DECLINED" | "FILLED";
}

const DEFAULT_LARGE_PROJECTS: LargeProjectOpportunity[] = [
  {
    id: "lp-opp-1",
    requirementId: "req-101",
    projectId: "proj-101",
    projectNumber: "PRJ-2026-104",
    title: "Shivam Society Common Area Repainting & Waterproofing",
    categoryName: "Painting & Waterproofing",
    description: "Multi-block exterior repainting and waterproofing application for residential society.",
    location: "Satellite, Ahmedabad",
    plannedStartDate: "2026-09-25",
    estimatedDays: 15,
    dailyRate: 900, // Federation-defined daily rate
    requiredWorkersCount: 5,
    acceptedWorkersCount: 3,
    status: "INVITED",
  },
];

export interface JobRequestsTabProps {
  requests: WorkerJobItem[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function JobRequestsTab({
  requests,
  loading = false,
  error = null,
  onRefresh,
}: JobRequestsTabProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterOption, setFilterOption] = React.useState<JobRequestFilterOption>("ALL");
  const [jobTypeFilter, setJobTypeFilter] = React.useState<"ALL" | "REGULAR" | "LARGE_PROJECT">("ALL");

  const [largeProjects, setLargeProjects] = React.useState<LargeProjectOpportunity[]>([]);
  const [loadingLp, setLoadingLp] = React.useState(true);
  const [lpError, setLpError] = React.useState<string | null>(null);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const [isCreatingTest, setIsCreatingTest] = React.useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = React.useState<string | null>(null);

  const [selectedProjectForReview, setSelectedProjectForReview] = React.useState<LargeProjectOpportunity | null>(null);

  const loadLargeProjects = React.useCallback(async () => {
    setLoadingLp(true);
    setLpError(null);
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

      let rawProjects: any[] = [];
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.projects && Array.isArray(json.projects)) {
          rawProjects = json.projects.filter((p: any) => {
            const s = (p.status || "").toUpperCase();
            return s === "CONFIRMED" || s === "WORKER_ASSIGNMENT" || s === "UNDER_REVIEW" || s === "PROPOSAL_SENT";
          });
        }
      }

      if (rawProjects.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from("project_requests") as any)
          .select("*")
          .order("created_at", { ascending: false });

        if (data) {
          rawProjects = data.filter((p: any) => {
            const s = (p.status || "").toUpperCase();
            return s === "CONFIRMED" || s === "WORKER_ASSIGNMENT" || s === "UNDER_REVIEW" || s === "PROPOSAL_SENT";
          });
        }
      }

      // Query real project_allocations & project_requirements from database
      let allocations: any[] = [];
      let requirements: any[] = [];
      try {
        const { data: allocData } = await (supabase.from("project_allocations") as any)
          .select("project_request_id, requirement_id, worker_id, status");
        if (allocData) allocations = allocData;
      } catch (err) {
        console.warn("Could not query project_allocations:", err);
      }
      try {
        const { data: reqData } = await (supabase.from("project_requirements") as any)
          .select("id, project_request_id");
        if (reqData) requirements = reqData;
      } catch (err) {
        console.warn("Could not query project_requirements:", err);
      }

      if (rawProjects && rawProjects.length > 0) {
        // Fetch missing requirement IDs via API for rawProjects
        const reqMap: Record<string, string> = {};
        for (const reqItem of requirements) {
          if (reqItem.project_request_id && reqItem.id) {
            reqMap[reqItem.project_request_id] = reqItem.id;
          }
        }

        await Promise.all(
          rawProjects.map(async (p: any) => {
            if (!reqMap[p.id]) {
              try {
                const reqRes = await fetch(`/api/worker/requirement?projectId=${p.id}`);
                if (reqRes.ok) {
                  const json = await reqRes.json();
                  if (json.requirementId) reqMap[p.id] = json.requirementId;
                }
              } catch (e) {
                console.warn("Could not fetch requirement for project:", p.id, e);
              }
            }
          })
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: LargeProjectOpportunity[] = rawProjects.map((p: any) => {
          const realReqId = reqMap[p.id] || "";

          const photoMatch = p.description?.match(/\[Site Photo\]:\s*(https?:\/\/[^\s]+)/);
          const categoryMatch = p.description?.match(/\[Category\]:\s*([^\n]+)/);
          const locationMatch = p.description?.match(/\[Location\]:\s*([^\n]+)/);
          const durationMatch = p.description?.match(/\[Preferred Duration\]:\s*([^\n]+)/);
          const workersMatch = p.description?.match(/\[Workers\]:\s*(\d+)/);
          const dailyRateMatch = p.description?.match(/\[Daily Rate\]:\s*(\d+)/);
          const startDateMatch = p.description?.match(/\[Start Date\]:\s*([^\n]+)/);

          const catName = categoryMatch ? categoryMatch[1].trim() : (p.category_name || "Craft & Construction");
          const loc = locationMatch ? locationMatch[1].trim() : "Ahmedabad, Gujarat";
          const durStr = durationMatch ? durationMatch[1].trim() : "15 days";
          const estDays = parseInt(durStr, 10) || 15;
          const reqWorkers = Math.max(
            1,
            p.required_workers_count !== undefined && p.required_workers_count !== null
              ? Number(p.required_workers_count)
              : (workersMatch ? Number(workersMatch[1]) : 5)
          );
          const rate = dailyRateMatch ? Number(dailyRateMatch[1]) : 900;
          const startDate = startDateMatch ? startDateMatch[1].trim() : "2026-09-25";

          // Authoritative server-calculated accepted count
          const acceptedCount = p.accepted_workers_count !== undefined
            ? Number(p.accepted_workers_count)
            : allocations.filter(
                (a: any) => (a.project_request_id === p.id || a.requirement_id === p.id || (realReqId && a.requirement_id === realReqId)) && (a.status === "assigned" || a.status === "ACCEPTED" || a.response_status === "ACCEPTED")
              ).length;

          // Determine current worker's own status for this project
          let currentStatus: "INVITED" | "ACCEPTED" | "DECLINED" | "FILLED" = "INVITED";
          if (currentWorkerId) {
            const ownAlloc = allocations.find(
              (a: any) => (a.project_request_id === p.id || a.requirement_id === p.id || (realReqId && a.requirement_id === realReqId)) && a.worker_id === currentWorkerId
            );
            if (ownAlloc) {
              if (ownAlloc.status === "assigned" || ownAlloc.status === "ACCEPTED" || ownAlloc.response_status === "ACCEPTED") currentStatus = "ACCEPTED";
              else if (ownAlloc.status === "declined" || ownAlloc.response_status === "DECLINED") currentStatus = "DECLINED";
            }
          }

          if (currentStatus === "INVITED" && reqWorkers > 0 && acceptedCount >= reqWorkers) {
            currentStatus = "FILLED";
          }

          return {
            id: p.id,
            requirementId: realReqId,
            projectId: p.id,
            projectNumber: `PRJ-2026-${(p.id || "101").slice(-4)}`,
            title: p.project_name || "Large Project Opportunity",
            categoryName: catName,
            description: p.description || "Multi-artisan project requirement.",
            location: loc,
            plannedStartDate: startDate,
            estimatedDays: estDays,
            dailyRate: rate,
            requiredWorkersCount: reqWorkers,
            acceptedWorkersCount: acceptedCount,
            status: currentStatus,
          };
        });
        setLargeProjects(mapped);
      } else {
        setLargeProjects([]);
      }
    } catch (err: any) {
      setLpError(err?.message || "Error loading Worker Large Project opportunities");
      setLargeProjects([]);
    } finally {
      setLoadingLp(false);
    }
  }, []);

  React.useEffect(() => {
    loadLargeProjects();

    const { createClient } = require("@/lib/supabase/client");
    const supabase = createClient();
    const channelId = `worker_lp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_requests" },
        () => {
          loadLargeProjects();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_allocations" },
        () => {
          loadLargeProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLargeProjects]);

  // Stage counts for regular jobs
  const newCount = requests.filter(
    (r) => r.status === "REQUEST_SENT" || r.status === "PENDING"
  ).length;
  const activeCount = requests.filter(
    (r) =>
      r.status === "WORKER_REVIEWING" ||
      r.status === "WORKER_INTERESTED" ||
      r.status === "INTERESTED"
  ).length;
  const estimatesCount = requests.filter(
    (r) =>
      r.status === "ESTIMATE_SUBMITTED" ||
      r.status === "CUSTOMER_CONFIRMATION_PENDING"
  ).length;
  const selectedCount = requests.filter(
    (r) =>
      r.status === "SELECTED" ||
      r.status === "BOOKING_CONFIRMED" ||
      r.status === "WORKER_ACCEPTED"
  ).length;
  const declinedCount = requests.filter((r) => r.status === "DECLINED").length;

  const filteredRequests = React.useMemo(() => {
    return requests.filter((req) => {
      if (jobTypeFilter === "LARGE_PROJECT") return false;

      if (filterOption === "NEW" && req.status !== "REQUEST_SENT" && req.status !== "PENDING") {
        return false;
      }
      if (
        filterOption === "ACTIVE" &&
        req.status !== "WORKER_REVIEWING" &&
        req.status !== "WORKER_INTERESTED" &&
        req.status !== "INTERESTED"
      ) {
        return false;
      }
      if (
        filterOption === "ESTIMATES" &&
        req.status !== "ESTIMATE_SUBMITTED" &&
        req.status !== "CUSTOMER_CONFIRMATION_PENDING"
      ) {
        return false;
      }
      if (
        filterOption === "SELECTED" &&
        req.status !== "SELECTED" &&
        req.status !== "BOOKING_CONFIRMED" &&
        req.status !== "WORKER_ACCEPTED"
      ) {
        return false;
      }
      if (filterOption === "DECLINED" && req.status !== "DECLINED") {
        return false;
      }

      if (filterOption === "TODAY") {
        const isToday =
          req.scheduledDate.toLowerCase().includes("today") ||
          req.scheduledStartAt.toLowerCase().includes("today");
        if (!isToday) return false;
      }
      if (filterOption === "EMERGENCY" && req.urgency !== "EMERGENCY") {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = req.serviceTitle.toLowerCase().includes(q);
        const matchesCustomer = req.customerName.toLowerCase().includes(q);
        const matchesLocation = req.customerArea.toLowerCase().includes(q);
        return matchesTitle || matchesCustomer || matchesLocation;
      }

      return true;
    });
  }, [requests, filterOption, jobTypeFilter, searchQuery]);

  const filteredLargeProjects = React.useMemo(() => {
    if (jobTypeFilter === "REGULAR") return [];
    return largeProjects.filter((lp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          lp.title.toLowerCase().includes(q) ||
          lp.categoryName.toLowerCase().includes(q) ||
          lp.location.toLowerCase().includes(q) ||
          lp.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [largeProjects, jobTypeFilter, searchQuery]);

  // Concurrency-safe Worker Acceptance with Live Database Schema & RLS Compatibility
  const handleAcceptLargeProject = async (opp: LargeProjectOpportunity) => {
    setProcessingId(opp.id);
    setActionNotice(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActionNotice("Worker profile not found. Please try again.");
        setTimeout(() => setActionNotice(null), 4000);
        return;
      }

      const { data: wRow } = await (supabase.from("workers") as any)
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!wRow?.id) {
        setActionNotice("Worker profile not found. Please try again.");
        setTimeout(() => setActionNotice(null), 4000);
        return;
      }

      const workerId = wRow.id;

      const targetProjectId = opp.projectId || opp.id;
      let requirementId = opp.requirementId;

      if (!requirementId || requirementId === targetProjectId) {
        try {
          const reqRes = await fetch(`/api/worker/requirement?projectId=${targetProjectId}`);
          if (reqRes.ok) {
            const json = await reqRes.json();
            if (json.requirementId) requirementId = json.requirementId;
          }
        } catch (e) {
          console.warn("Error resolving requirement via API:", e);
        }
      }

      if (!requirementId || requirementId === targetProjectId) {
        setActionNotice("Project requirement details could not be found. Please contact support.");
        setTimeout(() => setActionNotice(null), 4000);
        return;
      }

      // Call authoritative server acceptance API with capacity enforcement
      const res = await fetch("/api/worker/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: targetProjectId,
          requirementId: requirementId,
          workerId: workerId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const noticeMsg = `✓ Successfully accepted assignment for "${opp.title}" at ${formatINR(opp.dailyRate)}/day!`;
        setActionNotice(noticeMsg);
        setTimeout(() => setActionNotice(null), 4000);

        await loadLargeProjects();
        setSelectedProjectForReview(null);
      } else {
        const errorText = data.error || (data.code === "SLOT_FULL" ? "All worker slots for this project are already filled." : "Failed to record allocation.");
        setActionNotice(`❌ ${errorText}`);
        setTimeout(() => setActionNotice(null), 4000);

        await loadLargeProjects();
        setSelectedProjectForReview(null);
      }
    } catch (err: any) {
      console.error("Worker accept error:", err);
      setActionNotice(`❌ ${err?.message || "Failed to accept project opportunity"}`);
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineLargeProject = async (opp: LargeProjectOpportunity) => {
    setProcessingId(opp.id);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let workerId = user?.id;
      if (user?.id) {
        const { data: wRow } = await (supabase.from("workers") as any)
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (wRow?.id) {
          workerId = wRow.id;
        }
      }
      if (!workerId) {
        workerId = "2b568fd2-b30e-4ed7-977e-a82ff74dc5a5";
      }

      // Ensure requirement row
      let requirementId = opp.requirementId;
      const { data: existingReqs } = await (supabase.from("project_requirements") as any)
        .select("id")
        .eq("project_request_id", opp.projectId);
      if (existingReqs && existingReqs.length > 0) {
        requirementId = existingReqs[0].id;
      }

      await (supabase.from("project_allocations") as any).insert({
        project_request_id: opp.projectId,
        requirement_id: requirementId,
        worker_id: workerId,
        status: "declined",
        allocated_at: new Date().toISOString(),
      });

      setLargeProjects((prev) =>
        prev.map((item) => (item.id === opp.id ? { ...item, status: "DECLINED" } : item))
      );
      setActionNotice(`Project invitation declined for "${opp.title}".`);
      setTimeout(() => setActionNotice(null), 4000);
      setSelectedProjectForReview(null);
    } catch (err) {
      setLargeProjects((prev) =>
        prev.map((item) => (item.id === opp.id ? { ...item, status: "DECLINED" } : item))
      );
      setSelectedProjectForReview(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateTestRequest = async () => {
    setIsCreatingTest(true);
    setTestSuccessMessage(null);
    try {
      const created = await workerJobService.createTestCustomerRequest("w-1");
      setTestSuccessMessage(`Created test customer request #${created.bookingNumber} (${created.customerName} - ${created.serviceTitle}).`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Failed to create test request", err);
    } finally {
      setIsCreatingTest(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Type Filter Bar: ALL | REGULAR JOBS | LARGE PROJECTS */}
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
            All Work ({requests.length + largeProjects.length})
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
            Regular Jobs ({requests.length})
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
            Large Projects ({largeProjects.length})
          </button>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateTestRequest}
            disabled={isCreatingTest}
            className="h-7 text-xs border-dashed border-emerald-600/50 hover:bg-emerald-100/50 text-emerald-800 dark:text-emerald-300"
          >
            {isCreatingTest ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1 text-emerald-600" />
            )}
            + Test Request (Dev)
          </Button>

          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-7 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <Card className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="font-bold text-emerald-700 hover:underline ml-2">Dismiss</button>
        </Card>
      )}

      {/* Test Creation Feedback */}
      {testSuccessMessage && (
        <div className="p-3 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-600 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
          <span>✓ {testSuccessMessage}</span>
          <button type="button" onClick={() => setTestSuccessMessage(null)} className="text-xs font-bold hover:underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 rounded-lg border bg-card">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, location, trade, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>
      </div>

      {/* LARGE PROJECTS SECTION */}
      {jobTypeFilter !== "REGULAR" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              Large Project Opportunities ({filteredLargeProjects.length})
            </h3>
          </div>

          {lpError && (
            <Card className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
              Notice: {lpError}
            </Card>
          )}

          {loadingLp ? (
            <Card className="p-6 text-center text-xs text-muted-foreground rounded-xl space-y-2">
              <Clock className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
              <p className="font-bold">Loading project requirements from database...</p>
            </Card>
          ) : filteredLargeProjects.length === 0 ? (
            <Card className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-1">
              <Building2 className="w-6 h-6 text-muted-foreground mx-auto" />
              <p className="font-bold text-foreground">No Large Project Opportunities Available</p>
              <p className="text-muted-foreground text-[11px]">When Federation admins publish project requirements, eligible opportunities will appear here for worker acceptance.</p>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {filteredLargeProjects.map((opp) => (
              <Card
                key={opp.id}
                className="border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 shadow-xs rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">
                      {opp.projectNumber} • {opp.categoryName}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {opp.title}
                    </h4>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Federation Daily Rate</span>
                    <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                      {formatINR(opp.dailyRate)} <span className="text-xs font-normal text-muted-foreground">/ day</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {opp.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Location</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {opp.location}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Planned Start</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {opp.plannedStartDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Est. Duration</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> {opp.estimatedDays} Days
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Slots Filled</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" /> {opp.acceptedWorkersCount} / {opp.requiredWorkersCount} Workers
                    </span>
                  </div>
                </div>

                {/* Card Actions & Capacity Status */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    {opp.status === "ACCEPTED" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Accepted & Assigned
                      </Badge>
                    ) : opp.status === "DECLINED" ? (
                      <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs gap-1">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" /> Declined
                      </Badge>
                    ) : (opp.status === "FILLED" || (opp.requiredWorkersCount > 0 && opp.acceptedWorkersCount >= opp.requiredWorkersCount)) ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs">
                        Assignment Capacity Filled
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProjectForReview(opp)}
                      className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-50"
                    >
                      Review Project Details
                    </Button>

                    {opp.status === "INVITED" && (opp.requiredWorkersCount === 0 || opp.acceptedWorkersCount < opp.requiredWorkersCount) && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={processingId === opp.id}
                        onClick={() => handleAcceptLargeProject(opp)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4"
                      >
                        {processingId === opp.id ? "Processing..." : "Accept"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )}

      {/* WORKER PROJECT REVIEW MODAL */}
      {selectedProjectForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-mono">
                    {selectedProjectForReview.projectNumber}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500">{selectedProjectForReview.categoryName}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedProjectForReview.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProjectForReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Scope / Description */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Project Scope & Description</h3>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {selectedProjectForReview.description}
              </div>
            </div>

            {/* Details Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border bg-card space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Site Location</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" /> {selectedProjectForReview.location}
                </span>
              </div>

              <div className="p-3 rounded-xl border bg-card space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Planned Start Date</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" /> {selectedProjectForReview.plannedStartDate}
                </span>
              </div>

              <div className="p-3 rounded-xl border bg-card space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Duration</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" /> {selectedProjectForReview.estimatedDays} Days
                </span>
              </div>

              <div className="p-3 rounded-xl border bg-card space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Federation Daily Rate</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {formatINR(selectedProjectForReview.dailyRate)} / day
                </span>
              </div>

              <div className="p-3 rounded-xl border bg-card space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Required Worker Slots</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600 shrink-0" /> {selectedProjectForReview.acceptedWorkersCount} / {selectedProjectForReview.requiredWorkersCount} Workers Filled
                </span>
              </div>

              <div className="p-3 rounded-xl border bg-card space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Allocation Status</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedProjectForReview.status === "ACCEPTED"
                    ? "Accepted"
                    : selectedProjectForReview.status === "DECLINED"
                    ? "Declined"
                    : selectedProjectForReview.acceptedWorkersCount >= selectedProjectForReview.requiredWorkersCount
                    ? "Capacity Filled"
                    : "Available for Accept"}
                </span>
              </div>
            </div>

            {/* Decision Actions Only: Reject / Accept */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeclineLargeProject(selectedProjectForReview)}
                disabled={processingId === selectedProjectForReview.id}
                className="text-xs text-rose-700 hover:bg-rose-50 border-rose-200 font-semibold px-5"
              >
                Reject Opportunity
              </Button>

              {selectedProjectForReview.status === "INVITED" &&
               (selectedProjectForReview.requiredWorkersCount === 0 || selectedProjectForReview.acceptedWorkersCount < selectedProjectForReview.requiredWorkersCount) && (
                <Button
                  type="button"
                  onClick={() => handleAcceptLargeProject(selectedProjectForReview)}
                  disabled={processingId === selectedProjectForReview.id}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6"
                >
                  {processingId === selectedProjectForReview.id ? "Processing Server Allocation..." : "Accept Project Opportunity"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REGULAR JOBS LIST */}
      {jobTypeFilter !== "LARGE_PROJECT" && (
        <div className="space-y-3 pt-2">
          {jobTypeFilter === "ALL" && (
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Regular Service Requests ({filteredRequests.length})
            </h3>
          )}

          {filteredRequests.length === 0 ? (
            jobTypeFilter === "REGULAR" && (
              <Card className="p-8 text-center text-muted-foreground space-y-3 border-dashed bg-muted/10">
                <p className="text-sm font-semibold text-foreground">No regular job requests available.</p>
              </Card>
            )
          ) : (
            <div className="space-y-3.5">
              {filteredRequests.map((req) => (
                <JobRequestCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
