"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Plus,
  TrendingUp,
  CreditCard,
  HelpCircle,
  Check,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { formatINR } from "@/lib/formatters/currency";
import { resolveProjectFinancialEstimates } from "@/lib/financials/large-project-financials";
import { createClient } from "@/lib/supabase/client";
import { LargeProjectTimeline } from "@/features/projects/components/large-project-timeline";
import { cleanProjectDescription } from "@/lib/financials/project-description-parser";
import { ProjectPaymentScheduleUI } from "@/components/projects/project-payment-schedule-ui";

export interface FederationProject {
  id: string;
  projectNumber: string;
  customerName: string;
  customerPhone: string;
  title: string;
  categoryName: string;
  description: string;
  location: string;
  preferredDuration: string;
  sitePhotos?: string[];
  status: "SUBMITTED" | "UNDER_REVIEW" | "PROPOSAL_SENT" | "CONFIRMED" | "IN_PROGRESS" | "ACTIVE" | "REVISION_REQUESTED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  createdAt: string;

  // Financial Ledger Fields
  originalEstimateAmount: number;
  currentEstimatedTotal: number;
  actualCostToDate: number;
  paymentsReceived: number;
  settledAmount: number;
  remainingBalance: number;

  // Federation Estimate Fields
  requiredWorkersCount?: number;
  dailyRate?: number;
  plannedStartDate?: string;
  estimatedCompletionDate?: string;
  estimatedDays?: number;
  estimatedMaterialCost?: number;
  estimatedWorkerCost?: number;
  federationNotes?: string;
  rejectionReason?: string;
  allocatedWorkersCount?: number;
  acceptedWorkersCount?: number;
  remainingWorkersCount?: number;
  progressPercentage?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkerDailyExpenseLog {
  id: string;
  workerName: string;
  date: string;
  workDescription: string;
  materialsUsed?: string;
  reportedAmount: number;
  verifiedAmount?: number;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  customerQueryText?: string;
  federationReply?: string;
}

export function FederationProjectsView() {
  const [projects, setProjects] = React.useState<FederationProject[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [dbError, setDbError] = React.useState<string | null>(null);
  
  // Simplified Unified Workflow Tabs: REQUESTS | PROPOSALS | ACTIVE | CLOSED
  const [filterStage, setFilterStage] = React.useState<"REQUESTS" | "PROPOSALS" | "ACTIVE" | "CLOSED">("REQUESTS");
  const [selectedProject, setSelectedProject] = React.useState<FederationProject | null>(null);

  // Federation First Review Modal State
  const [showReviewModal, setShowReviewModal] = React.useState(false);

  // Federation Financials & Payment Visibility State
  const [selectedFinancials, setSelectedFinancials] = React.useState<any>(null);

  React.useEffect(() => {
    if (selectedProject && showReviewModal) {
      fetch(`/api/projects/financials?projectId=${selectedProject.id}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSelectedFinancials(data);
            if (data.financials?.actualCostToDate !== undefined) {
              const liveActualCost = Number(data.financials.actualCostToDate || 0);
              setSelectedProject((prev) => (prev ? { ...prev, actualCostToDate: liveActualCost } : prev));
              setProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? { ...p, actualCostToDate: liveActualCost } : p)));
            }
          }
        })
        .catch((err) => console.warn("Error loading financials:", err));
    } else {
      setSelectedFinancials(null);
    }
  }, [selectedProject?.id, showReviewModal]);
  const [rejectionReasonInput, setRejectionReasonInput] = React.useState("");
  const [showRejectInput, setShowRejectInput] = React.useState(false);

  // Proposal / Estimate Revision Modal State
  const [showEstimateModal, setShowEstimateModal] = React.useState(false);
  const [estimateMode, setEstimateMode] = React.useState<"INITIAL" | "REVISE">("INITIAL");
  const [workersCount, setWorkersCount] = React.useState(5);
  const [dailyRateInput, setDailyRateInput] = React.useState(900);
  const [startDateInput, setStartDateInput] = React.useState("2026-09-25");
  const [completionDateInput, setCompletionDateInput] = React.useState("2026-10-10");
  const [materialCostInput, setMaterialCostInput] = React.useState(25000);
  const [notesInput, setNotesInput] = React.useState("");
  const [revisionReasonInput, setRevisionReasonInput] = React.useState("");
  const [submittingEstimate, setSubmittingEstimate] = React.useState(false);

  // Propose In-Progress Estimate Revision Modal State
  const [showProposeRevisionModal, setShowProposeRevisionModal] = React.useState(false);
  const [proposedEstimateAmount, setProposedEstimateAmount] = React.useState<number>(0);
  const [estimateRevisionReason, setEstimateRevisionReason] = React.useState("");
  const [submittingRevision, setSubmittingRevision] = React.useState(false);

  // Material Expense Review & Daily Monitoring Modal State
  const [showExpenseReviewModal, setShowExpenseReviewModal] = React.useState(false);
  const [expenseLogs, setExpenseLogs] = React.useState<WorkerDailyExpenseLog[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [structuredDailyUpdates, setStructuredDailyUpdates] = React.useState<any[]>([]);
  const [customerQueries, setCustomerQueries] = React.useState<any[]>([]);
  const [editingExpenseId, setEditingExpenseId] = React.useState<string | null>(null);
  const [verifiedAmountInput, setVerifiedAmountInput] = React.useState<number>(0);
  const [queryReplyInput, setQueryReplyInput] = React.useState("");
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const loadDailyMonitoring = React.useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/daily-updates?projectId=${projectId}`, { cache: "no-store" });
      const data = await res.json();
      const updates = data.dailyUpdates || data.updates;
      if (data.success && Array.isArray(updates)) {
        setStructuredDailyUpdates(updates);
      } else {
        setStructuredDailyUpdates([]);
      }

      if (data.success && Array.isArray(data.expenses) && data.expenses.length > 0) {
        const mappedExps = data.expenses.map((e: any) => ({
          id: e.id,
          date: (e.expense_date || e.created_at || "").slice(0, 10),
          workerName: e.worker?.profiles?.full_name || "Assigned Worker",
          workDescription: e.description || "Material Expense",
          materialsUsed: e.description || "Materials",
          reportedAmount: Number(e.amount || 0),
          verifiedAmount: Number(e.verified_amount || 0),
          verificationStatus: (e.status || "PENDING") as "PENDING" | "VERIFIED" | "REJECTED",
          customerQueryText: e.notes || null,
          federationReply: null,
        }));
        setExpenseLogs(mappedExps);
      } else {
        setExpenseLogs([]);
      }

      if (data.summary && data.summary.totalVerifiedExecutionCost !== undefined) {
        const liveActualCost = Number(data.summary.totalVerifiedExecutionCost || 0);
        setSelectedProject((prev) => (prev && prev.id === projectId ? { ...prev, actualCostToDate: liveActualCost } : prev));
        setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, actualCostToDate: liveActualCost } : p)));
      }

      if (data.success && Array.isArray(data.customerQueries)) {
        setCustomerQueries(data.customerQueries);
      } else {
        const qRes = await fetch(`/api/projects/daily-queries?projectId=${projectId}`, { cache: "no-store" });
        const qData = await qRes.json();
        if (qData.success && Array.isArray(qData.queries)) {
          setCustomerQueries(qData.queries);
        }
      }
    } catch (err) {
      console.warn("Error loading daily monitoring:", err);
    }
  }, []);

  React.useEffect(() => {
    if (selectedProject && (showExpenseReviewModal || showReviewModal)) {
      loadDailyMonitoring(selectedProject.id);

      // Realtime listener for customer queries & daily monitoring
      const supabase = createClient();
      const channelName = `project_monitoring_${selectedProject.id}`;
      const channel = supabase
        .channel(channelName)
        .on("broadcast", { event: "new_customer_query" }, (payload) => {
          console.log("Realtime new_customer_query received in Federation:", payload);
          loadDailyMonitoring(selectedProject.id);
          setActionNotice("🔔 New Customer Query received in realtime!");
        })
        .on("broadcast", { event: "new_daily_update" }, () => {
          loadDailyMonitoring(selectedProject.id);
        })
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "project_customer_queries", filter: `project_request_id=eq.${selectedProject.id}` },
          () => {
            loadDailyMonitoring(selectedProject.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setStructuredDailyUpdates([]);
      setCustomerQueries([]);
    }
  }, [selectedProject, showExpenseReviewModal, showReviewModal, loadDailyMonitoring]);

  // Auto-dismiss progress notification toasts after 4 seconds
  React.useEffect(() => {
    if (actionNotice) {
      const timer = setTimeout(() => {
        setActionNotice(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [actionNotice]);

  const loadProjects = React.useCallback(async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      let rawData: any[] = [];
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.projects && Array.isArray(json.projects)) {
          rawData = json.projects;
        }
      }

      if (rawData.length === 0) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from("project_requests") as any)
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          setDbError(error.message || "Failed to load federation projects from database");
          setProjects([]);
          return;
        } else if (data) {
          rawData = data;
        }
      }



      if (rawData && rawData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: FederationProject[] = rawData.map((p: any) => {
          const photoMatch = p.description?.match(/\[Site Photo\]:\s*(https?:\/\/[^\s]+)/);
          const categoryMatch = p.description?.match(/\[Category\]:\s*([^\n]+)/);
          const locationMatch = p.description?.match(/\[Location\]:\s*([^\n]+)/);
          const durationMatch = p.description?.match(/\[Preferred Duration\]:\s*([^\n]+)/);

          const workersMatch = p.description?.match(/\[Workers\]:\s*(\d+)/);
          const dailyRateMatch = p.description?.match(/\[Daily Rate\]:\s*(\d+)/);
          const origEstimateMatch = p.description?.match(/\[Original Estimate\]:\s*(\d+)/);
          const currEstimateMatch = p.description?.match(/\[Current Estimate\]:\s*(\d+)/);
          const materialCostMatch = p.description?.match(/\[Material Cost\]:\s*(\d+)/);
          const startDateMatch = p.description?.match(/\[Start Date\]:\s*([^\n]+)/);
          const completionDateMatch = p.description?.match(/\[Completion Date\]:\s*([^\n]+)/);
          const notesMatch = p.description?.match(/\[Notes\]:\s*([^\n]+)/);
          const rejectionMatch = p.description?.match(/\[Rejection Reason\]:\s*([^\n]+)/);

          const progressMatch = p.description?.match(/\[Progress\]:\s*(\d+)%/);
          const startedAtMatch = p.description?.match(/\[Started At\]:\s*([^\n]+)/);
          const completedAtMatch = p.description?.match(/\[Completed At\]:\s*([^\n]+)/);

          const photos = photoMatch ? [photoMatch[1]] : (Array.isArray(p.site_photos) ? p.site_photos : []);
          const catName = categoryMatch ? categoryMatch[1].trim() : (p.category_name || p.category || "General Services");
          const loc = locationMatch ? locationMatch[1].trim() : "Ahmedabad, Gujarat";
          const dur = durationMatch ? durationMatch[1].trim() : "15 days";

          const estimates = resolveProjectFinancialEstimates(p);
          const totalEst = estimates.currentEstimatedTotal;
          const origEst = estimates.originalEstimateAmount;
          const workers = p.required_workers_count !== undefined ? Number(p.required_workers_count) : (workersMatch ? Number(workersMatch[1]) : 5);
          const rate = dailyRateMatch ? Number(dailyRateMatch[1]) : 900;
          const matCost = materialCostMatch ? Number(materialCostMatch[1]) : 25000;
          const startDate = startDateMatch ? startDateMatch[1].trim() : "2026-09-25";
          const compDate = completionDateMatch ? completionDateMatch[1].trim() : "2026-10-10";
          const notes = notesMatch ? notesMatch[1].trim() : "";
          const rejReason = rejectionMatch ? rejectionMatch[1].trim() : p.rejection_reason || "";

          // Use authoritative server-calculated fulfillment numbers
          const allocatedCount = p.allocated_workers_count !== undefined ? Number(p.allocated_workers_count) : 0;
          const remainingCount = p.remaining_workers_count !== undefined ? Number(p.remaining_workers_count) : Math.max(0, workers - allocatedCount);

          const pmtsTagMatch = p.description?.match(/\[Payments Received\]:\s*(\d+(?:\.\d+)?)/);
          let pmtRec = pmtsTagMatch ? Number(pmtsTagMatch[1]) : Number(p.payments_received || 0);
          if (p.description?.includes("[Payment Schedule]:")) {
            const schedMatch = p.description.match(/\[Payment Schedule\]:\s*([^\n]+)/);
            if (schedMatch) {
              try {
                const sched = JSON.parse(schedMatch[1].trim());
                if (Array.isArray(sched)) {
                  const schedSum = sched
                    .filter((i: any) => i.paymentStatus === "PAID" || i.status === "PAID")
                    .reduce((acc: number, i: any) => acc + Number(i.amount || 0), 0);
                  if (schedSum > pmtRec) pmtRec = schedSum;
                }
              } catch {
                // ignore
              }
            }
          }

          return {
            id: p.id,
            projectNumber: `PRJ-2026-${(p.id || "").slice(-4)}`,
            customerName: "Customer Request",
            customerPhone: "+91 98765 43210",
            title: p.project_name || "Large Project Request",
            categoryName: catName,
            description: p.description || "",
            location: loc,
            preferredDuration: dur,
            sitePhotos: photos,
            status: (p.status?.toUpperCase() as FederationProject["status"]) || "SUBMITTED",
            createdAt: p.created_at,
            originalEstimateAmount: origEst,
            currentEstimatedTotal: totalEst,
            actualCostToDate: p.actual_cost_to_date || 0,
            paymentsReceived: pmtRec,
            settledAmount: p.settled_amount || 0,
            remainingBalance: Math.max(0, totalEst - pmtRec),
            requiredWorkersCount: workers,
            dailyRate: rate,
            plannedStartDate: startDate,
            estimatedCompletionDate: compDate,
            estimatedMaterialCost: matCost,
            estimatedWorkerCost: workers * rate * 15,
            federationNotes: notes,
            rejectionReason: rejReason,
            allocatedWorkersCount: allocatedCount,
            acceptedWorkersCount: allocatedCount,
            remainingWorkersCount: remainingCount,
            progressPercentage: progressMatch ? Number(progressMatch[1]) : (p.progress_percentage || 0),
            startedAt: startedAtMatch ? startedAtMatch[1].trim() : p.started_at,
            completedAt: completedAtMatch ? completedAtMatch[1].trim() : p.completed_at,
          };
        });
        setProjects(mapped);
      } else {
        setProjects([]);
      }
    } catch (err: any) {
      setDbError(err?.message || "Error loading federation projects");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProjects();

    const supabase = createClient();
    const channelId = `federation_projects_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_requests" },
        () => {
          loadProjects();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_allocations" },
        () => {
          loadProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProjects]);

  const durationDaysCalculated = React.useMemo(() => {
    if (!startDateInput || !completionDateInput) return 15;
    const start = new Date(startDateInput);
    const end = new Date(completionDateInput);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [startDateInput, completionDateInput]);

  const calculatedWorkerCost = workersCount * dailyRateInput * durationDaysCalculated;
  const calculatedTotalEstimate = calculatedWorkerCost + materialCostInput;

  // Open First Review Modal
  const handleOpenReview = (proj: FederationProject) => {
    setSelectedProject(proj);
    setShowRejectInput(false);
    setRejectionReasonInput("");
    setShowReviewModal(true);
  };

  // Mark Request as Reviewed (SUBMITTED -> UNDER_REVIEW)
  const handleMarkReviewed = async (proj: FederationProject) => {
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: proj.id, status: "UNDER_REVIEW" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setDbError(`Failed to update review status: ${json.error || "Database update failed"}`);
        return;
      }

      const updatedProj = { ...proj, status: "UNDER_REVIEW" as const };
      setSelectedProject(updatedProj);
      await loadProjects();
      setShowReviewModal(false);
      setActionNotice(`✓ Request "${proj.title}" marked as Reviewed. Create Initial Estimate is now available.`);
    } catch (err: any) {
      setDbError(`DB review update error: ${err?.message || err}`);
    }
  };

  // Open Initial Estimate vs Revise Estimate Modal
  const handleOpenEstimateModal = (proj: FederationProject, mode: "INITIAL" | "REVISE") => {
    setSelectedProject(proj);
    setEstimateMode(mode);
    setWorkersCount(proj.requiredWorkersCount || 5);
    setDailyRateInput(proj.dailyRate || 900);
    setMaterialCostInput(proj.estimatedMaterialCost || 25000);
    setStartDateInput(proj.plannedStartDate || "2026-09-25");
    setCompletionDateInput(proj.estimatedCompletionDate || "2026-10-10");
    setNotesInput(proj.federationNotes || "");
    setRevisionReasonInput("");
    setShowReviewModal(false);
    setShowEstimateModal(true);
  };

  // Handle Reject Request during Review
  const handleRejectRequest = async () => {
    if (!selectedProject || !rejectionReasonInput.trim()) return;
    try {
      const updatedDescription = `${selectedProject.description}\n\n[Rejection Reason]: ${rejectionReasonInput.trim()}`;
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedProject.id,
          status: "REJECTED",
          description: updatedDescription,
          rejection_reason: rejectionReasonInput.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setDbError(`Failed to reject request: ${json.error || "Database update failed"}`);
        return;
      }

      const updatedProj = { ...selectedProject, status: "REJECTED" as const, rejectionReason: rejectionReasonInput.trim() };
      setSelectedProject(updatedProj);
      await loadProjects();
      setShowReviewModal(false);
      setActionNotice(`✓ Request "${selectedProject.title}" rejected and stored as REJECTED in database.`);
    } catch (err: any) {
      setDbError(`DB reject error: ${err?.message || err}`);
    }
  };

  // Submit Initial Estimate or Revised Estimate
  const handleSendOrReviseProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    if (estimateMode === "REVISE" && !revisionReasonInput.trim()) {
      alert("Please provide a reason for the estimate revision.");
      return;
    }

    setSubmittingEstimate(true);
    const isRevision = estimateMode === "REVISE";

    const newOriginalBaseline = isRevision
      ? (selectedProject.originalEstimateAmount || calculatedTotalEstimate)
      : calculatedTotalEstimate;

    const updatedDescription = `${selectedProject.description}\n\n[Original Estimate]: ${newOriginalBaseline}\n[Current Estimate]: ${calculatedTotalEstimate}\n[Workers]: ${workersCount}\n[Daily Rate]: ${dailyRateInput}\n[Start Date]: ${startDateInput}\n[Completion Date]: ${completionDateInput}\n[Material Cost]: ${materialCostInput}${notesInput ? `\n[Notes]: ${notesInput}` : ""}${isRevision && revisionReasonInput.trim() ? `\n[Estimate Revision Reason]: ${revisionReasonInput.trim()}` : ""}`;

    try {
      const targetStatus = isRevision ? selectedProject.status : "PROPOSAL_SENT";
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedProject.id,
          status: targetStatus,
          total_budget: calculatedTotalEstimate,
          description: updatedDescription,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setDbError(`Failed to save estimate: ${json.error || "Database update failed"}`);
        return;
      }

      const updatedProj = {
        ...selectedProject,
        status: targetStatus as FederationProject["status"],
        currentEstimatedTotal: calculatedTotalEstimate,
        originalEstimateAmount: newOriginalBaseline,
      };
      setSelectedProject(updatedProj);

      await loadProjects();
      setActionNotice(
        isRevision
          ? `✓ Project Estimate revised to ${formatINR(calculatedTotalEstimate)}. Original baseline ${formatINR(newOriginalBaseline)} preserved.`
          : `✓ Initial Estimate of ${formatINR(calculatedTotalEstimate)} formulated and proposal sent to Customer.`
      );
    } catch (err: any) {
      setDbError(`DB update error: ${err?.message || err}`);
    } finally {
      setSubmittingEstimate(false);
      setShowEstimateModal(false);
    }
  };

  // Phase 4 Material Expense Verification
  const handleVerifyExpense = async (exp: WorkerDailyExpenseLog, verifiedVal: number) => {
    try {
      const res = await fetch("/api/projects/daily-updates/verify-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseId: exp.id,
          status: "VERIFIED",
          verifiedAmount: verifiedVal,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        console.warn("Expense verification notice:", json.error);
      }
    } catch (e) {
      console.warn("Expense verification API notice:", e);
    }

    const updated = expenseLogs.map((item) =>
      item.id === exp.id
        ? {
            ...item,
            verifiedAmount: verifiedVal,
            verificationStatus: "VERIFIED" as const,
          }
        : item
    );
    setExpenseLogs(updated);

    if (selectedProject) {
      const newActualCost = selectedProject.actualCostToDate + (verifiedVal - (exp.verifiedAmount || 0));
      const updatedProj = { ...selectedProject, actualCostToDate: newActualCost };
      setProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? updatedProj : p)));
      setSelectedProject(updatedProj);
    }
    setEditingExpenseId(null);
    setActionNotice(`✓ Expense verified at ${formatINR(verifiedVal)}.`);
  };

  const handleReplyToQuery = async (queryId: string) => {
    if (!queryReplyInput.trim() || !selectedProject) return;

    try {
      const res = await fetch("/api/projects/daily-queries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryId: queryId,
          response: queryReplyInput.trim(),
          status: "RESOLVED",
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        try {
          const supabase = createClient();
          const channel = supabase.channel(`project_monitoring_${selectedProject.id}`);
          channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
              channel.send({
                type: "broadcast",
                event: "query_response",
                payload: {
                  projectId: selectedProject.id,
                  queryId,
                  response: queryReplyInput.trim(),
                },
              }).then(() => {
                supabase.removeChannel(channel);
              });
            }
          });
        } catch (rtErr) {
          console.warn("Realtime broadcast response err:", rtErr);
        }
      }
    } catch (e) {
      console.warn("Query reply API notice:", e);
    }

    setCustomerQueries((prev) =>
      prev.map((item) => (item.id === queryId ? { ...item, response: queryReplyInput.trim(), status: "RESOLVED" } : item))
    );
    setExpenseLogs((prev) =>
      prev.map((item) => (item.id === queryId ? { ...item, federationReply: queryReplyInput.trim() } : item))
    );
    setQueryReplyInput("");
    setActionNotice("✓ Query reply sent to customer.");
  };

  // Transition CONFIRMED -> IN_PROGRESS / ACTIVE
  const handleStartProject = async (proj: FederationProject) => {
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: proj.id, status: "IN_PROGRESS" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setDbError(`Failed to start project execution: ${json.error || "Database update failed"}`);
        return;
      }

      const updatedProj = { ...proj, status: "IN_PROGRESS" as const };
      setSelectedProject(updatedProj);
      await loadProjects();
      setActionNotice(`✓ Project "${proj.title}" status updated to IN_PROGRESS! Daily monitoring active.`);
    } catch (err: any) {
      setDbError(`DB start project error: ${err?.message || err}`);
    }
  };

  // Transition IN_PROGRESS -> COMPLETED
  const handleCompleteProject = async (proj: FederationProject) => {
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: proj.id, status: "COMPLETED" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setDbError(`Failed to mark project completed: ${json.error || "Database update failed"}`);
        return;
      }

      const updatedProj = { ...proj, status: "COMPLETED" as const };
      setSelectedProject(updatedProj);
      await loadProjects();
      setActionNotice(`✓ Project "${proj.title}" successfully marked as COMPLETED!`);
    } catch (err: any) {
      setDbError(`DB complete project error: ${err?.message || err}`);
    }
  };

  // Workflow Stage Filtering
  const filteredProjects = projects.filter((p) => {
    if (filterStage === "REQUESTS") return p.status === "SUBMITTED" || p.status === "UNDER_REVIEW";
    if (filterStage === "PROPOSALS") return p.status === "PROPOSAL_SENT" || p.status === "REVISION_REQUESTED";
    if (filterStage === "ACTIVE") return p.status === "CONFIRMED" || p.status === "IN_PROGRESS";
    if (filterStage === "CLOSED") return p.status === "COMPLETED" || p.status === "REJECTED" || p.status === "CANCELLED";
    return true;
  });

  const getStageCount = (stage: "REQUESTS" | "PROPOSALS" | "ACTIVE" | "CLOSED") => {
    return projects.filter((p) => {
      if (stage === "REQUESTS") return p.status === "SUBMITTED" || p.status === "UNDER_REVIEW";
      if (stage === "PROPOSALS") return p.status === "PROPOSAL_SENT" || p.status === "REVISION_REQUESTED";
      if (stage === "ACTIVE") return p.status === "CONFIRMED" || p.status === "IN_PROGRESS";
      if (stage === "CLOSED") return p.status === "COMPLETED" || p.status === "REJECTED" || p.status === "CANCELLED";
      return false;
    }).length;
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Federation Large Project Management & Financial Ledger"
        description="Review incoming customer requests, formulate initial estimates, manage proposals, verify artisan daily material expenses, and monitor active projects."
        breadcrumbs={[
          { label: "Federation Portal", href: "/federation-admin" },
          { label: "Large Projects" },
        ]}
      />

      {/* Action Notice */}
      {actionNotice && (
        <Card className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="font-bold text-emerald-700 hover:underline">Dismiss</button>
        </Card>
      )}

      {/* Unified Workflow Stage Navigation Bar (Merged Requests/Review -> Proposals -> Active -> Closed) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "REQUESTS", label: "1. Incoming Requests", icon: Clock },
            { key: "PROPOSALS", label: "2. Formulated Proposals", icon: FileText },
            { key: "ACTIVE", label: "3. Active & Confirmed", icon: Building2 },
            { key: "CLOSED", label: "4. Closed Projects", icon: CheckCircle2 },
          ].map((tab) => {
            const count = getStageCount(tab.key as any);
            const IconComp = tab.icon;
            const isActive = filterStage === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterStage(tab.key as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={loadProjects}
          className="h-7 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* DB Connection / Notice Banner */}
      {dbError && (
        <Card className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Database Notice: {dbError}</span>
          </div>
        </Card>
      )}

      {/* Projects List / Loading / Empty State */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-8 text-center text-xs text-muted-foreground rounded-xl space-y-2">
            <Clock className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p className="font-bold">Loading federation project requests from database...</p>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="p-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-2">
            <Building2 className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="font-bold text-sm text-foreground">No Projects in this Stage</p>
            <p className="text-muted-foreground">
              {filterStage === "REQUESTS" && "Incoming customer requests will appear here for initial review."}
              {filterStage === "PROPOSALS" && "Formulated proposals sent to customers will appear here."}
              {filterStage === "ACTIVE" && "Confirmed projects undergoing worker assignment & execution appear here."}
              {filterStage === "CLOSED" && "Completed or rejected project archives appear here."}
            </p>
          </Card>
        ) : (
          filteredProjects.map((proj) => (
            <Card key={proj.id} className="p-5 border-border shadow-xs space-y-3 bg-white dark:bg-slate-900 rounded-xl">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                      {proj.projectNumber} • Customer Request
                    </span>
                    <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-md">
                      {proj.categoryName}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-0.5">{proj.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold">
                    {proj.status.replace(/_/g, " ")}
                  </Badge>

                  {/* Single primary action on compact list card */}
                  {proj.status === "SUBMITTED" ? (
                    <Button
                      size="sm"
                      onClick={() => handleOpenReview(proj)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review Request
                    </Button>
                  ) : proj.status === "UNDER_REVIEW" ? (
                    <Button
                      size="sm"
                      onClick={() => handleOpenReview(proj)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Create Estimate &amp; Details
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleOpenReview(proj)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Project
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {proj.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Duration: {proj.preferredDuration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    Submitted: {new Date(proj.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* ONLY show compact financial summary if estimate exists (> 0) */}
              {proj.currentEstimatedTotal > 0 && (
                <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-border text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Estimate</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{formatINR(proj.currentEstimatedTotal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Actual Cost</span>
                    <span className="font-bold text-foreground">{formatINR(proj.actualCostToDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Payments Collected</span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">{formatINR(proj.paymentsReceived)}</span>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* STAGE 1: FEDERATION PROJECT VIEW & REVIEW MODAL */}
      {showReviewModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-border p-5 space-y-4 max-h-[92vh] overflow-y-auto rounded-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">{selectedProject.projectNumber}</span>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" /> Federation Large Project Review &amp; Workspace
                </h3>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
            </div>

            {/* FULL LIFECYCLE TIMELINE EMBEDDED INSIDE PROJECT VIEW */}
            <LargeProjectTimeline
              projectId={selectedProject.id}
              status={selectedProject.status}
              role="FEDERATION"
              createdAt={selectedProject.createdAt}
              onStatusChange={loadProjects}
            />

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-border">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Project Title</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedProject.title}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Selected Category</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">{selectedProject.categoryName}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Location / Address</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {selectedProject.location}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Preferred Target Duration</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> {selectedProject.preferredDuration}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Detailed Description / Scope</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-border text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed break-words">
                  {cleanProjectDescription(selectedProject.description)}
                </div>
              </div>

              {selectedProject.sitePhotos && selectedProject.sitePhotos.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Attached Site Photos</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.sitePhotos.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs hover:bg-emerald-100">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        View Photo #{idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* WORKER FULFILLMENT & EXECUTION PROGRESS */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" /> Worker Fulfillment &amp; Execution Progress
                  </span>
                  <Badge
                    variant="outline"
                    className={`font-bold text-[11px] ${
                      selectedProject.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : selectedProject.status === "IN_PROGRESS" || selectedProject.status === "ACTIVE"
                        ? "bg-blue-50 text-blue-800 border-blue-300"
                        : (selectedProject.remainingWorkersCount ?? 0) === 0
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {selectedProject.status === "COMPLETED"
                      ? "COMPLETED (100%)"
                      : selectedProject.status === "IN_PROGRESS" || selectedProject.status === "ACTIVE"
                      ? `IN PROGRESS (${selectedProject.progressPercentage || 0}%)`
                      : (selectedProject.remainingWorkersCount ?? 0) === 0
                      ? "READY TO START"
                      : "WAITING FOR WORKERS"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-1">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Required Workers</span>
                    <span className="font-extrabold text-foreground text-sm">{selectedProject.requiredWorkersCount ?? 5}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Accepted Workers</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">{selectedProject.acceptedWorkersCount ?? 0}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Allocated Workers</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">{selectedProject.allocatedWorkersCount ?? 0}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Remaining Workers</span>
                    <span className={`font-extrabold text-sm ${(selectedProject.remainingWorkersCount ?? 0) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      {selectedProject.remainingWorkersCount ?? 0}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Progress</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">{selectedProject.progressPercentage || 0}%</span>
                  </div>
                </div>
              </div>

              {/* FINANCIAL & DAILY MONITORING QUICK ACCESS IF ESTIMATE CREATED */}
              {selectedProject.currentEstimatedTotal > 0 && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">Financial Metrics &amp; Monitoring</span>
                    {(selectedProject.status === "CONFIRMED" || selectedProject.status === "IN_PROGRESS" || selectedProject.status === "ACTIVE") && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setProposedEstimateAmount(selectedProject.currentEstimatedTotal);
                            setEstimateRevisionReason("");
                            setShowProposeRevisionModal(true);
                          }}
                          className="border-purple-300 text-purple-800 dark:text-purple-200 hover:bg-purple-50 text-xs font-bold gap-1 shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Request Estimate Change
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowExpenseReviewModal(true)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 gap-1 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" /> Daily Progress &amp; Expenses Checkpoint
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-border">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Baseline</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(selectedProject.originalEstimateAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Estimate</span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{formatINR(selectedProject.currentEstimatedTotal)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Actual Cost</span>
                      <span className="font-bold text-foreground">{formatINR(selectedProject.actualCostToDate)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Payments Collected</span>
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">{formatINR(selectedProject.paymentsReceived)}</span>
                    </div>
                  </div>

                  {/* FEDERATION PAYMENT SCHEDULE VISIBILITY CARD */}
                  <ProjectPaymentScheduleUI
                    description={selectedProject.description}
                    activePaymentPlan={selectedFinancials?.activePaymentPlan}
                    totalBudget={selectedProject.currentEstimatedTotal}
                    paymentsReceived={selectedProject.paymentsReceived}
                    viewMode="federation"
                  />
                </div>
              )}

              {/* Reject Section Toggle */}
              {showRejectInput ? (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
                  <label className="text-[10px] text-rose-800 dark:text-rose-200 font-bold uppercase block">Reason for Rejection *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide reason why this request cannot be fulfilled..."
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    className="w-full p-2 rounded-lg border border-rose-300 dark:border-rose-800 text-xs focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowRejectInput(false)} className="text-xs">Cancel</Button>
                    <Button size="sm" onClick={handleRejectRequest} className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs">Confirm Rejection</Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
              {!showRejectInput && (
                <Button size="sm" variant="outline" onClick={() => setShowRejectInput(true)} className="text-xs text-rose-600 border-rose-300 hover:bg-rose-50 font-bold">
                  Reject Request
                </Button>
              )}
              <div className="flex flex-wrap gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={() => setShowReviewModal(false)} className="text-xs font-bold">
                  Close
                </Button>
                {selectedProject.status === "SUBMITTED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkReviewed(selectedProject)}
                    className="border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 text-xs font-bold gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Reviewed
                  </Button>
                )}
                {selectedProject.status === "UNDER_REVIEW" && (
                  <Button
                    size="sm"
                    onClick={() => handleOpenEstimateModal(selectedProject, "INITIAL")}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Initial Estimate
                  </Button>
                )}
                {(selectedProject.status === "PROPOSAL_SENT" || selectedProject.status === "REVISION_REQUESTED") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEstimateModal(selectedProject, "REVISE")}
                    className="border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 text-xs font-bold gap-1"
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Revise Estimate
                  </Button>
                )}
                {selectedProject.status === "CONFIRMED" && (
                  <Button
                    size="sm"
                    disabled={(selectedProject.remainingWorkersCount ?? 0) > 0}
                    onClick={() => {
                      handleStartProject(selectedProject);
                      setShowReviewModal(false);
                    }}
                    className={`${(selectedProject.remainingWorkersCount ?? 0) > 0 ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-700 hover:bg-emerald-800"} text-white font-bold text-xs px-4 gap-1.5`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {(selectedProject.remainingWorkersCount ?? 0) > 0
                      ? `Waiting for Workers (${selectedProject.allocatedWorkersCount}/${selectedProject.requiredWorkersCount})`
                      : "Start Project (Ready)"}
                  </Button>
                )}
                {(selectedProject.status === "IN_PROGRESS" || selectedProject.status === "ACTIVE") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleCompleteProject(selectedProject);
                      setShowReviewModal(false);
                    }}
                    className="border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 text-xs font-bold gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* FEDERATION ESTIMATE FORM MODAL (Stage 1 Initial Estimate OR Stage 2 Estimate Revision) */}
      {showEstimateModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-border p-5 space-y-4 max-h-[90vh] overflow-y-auto rounded-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">{selectedProject.projectNumber}</span>
                <h3 className="font-bold text-base text-foreground">
                  {estimateMode === "INITIAL" ? "Formulate Initial Project Estimate" : "Revise Project Estimate"}
                </h3>
              </div>
              <button onClick={() => setShowEstimateModal(false)} className="text-xs text-slate-400 hover:text-slate-600">✕ Cancel</button>
            </div>

            <form onSubmit={handleSendOrReviseProposal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Required Workers Count *</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={workersCount}
                    onChange={(e) => setWorkersCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Federation Daily Worker Rate (₹) *</label>
                  <input
                    type="number"
                    min={200}
                    max={5000}
                    required
                    value={dailyRateInput}
                    onChange={(e) => setDailyRateInput(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Planned Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Estimated Completion Date *</label>
                  <input
                    type="date"
                    required
                    value={completionDateInput}
                    onChange={(e) => setCompletionDateInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Estimated Material &amp; Logistics Expense (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={materialCostInput}
                  onChange={(e) => setMaterialCostInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              {estimateMode === "REVISE" && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl space-y-1.5">
                  <label className="text-[10px] text-amber-900 dark:text-amber-200 font-bold uppercase block">Reason for Estimate Revision *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Specify why the project scope or cost total is being updated..."
                    value={revisionReasonInput}
                    onChange={(e) => setRevisionReasonInput(e.target.value)}
                    className="w-full p-2 rounded-lg border border-amber-300 dark:border-amber-800 text-xs focus:outline-none"
                  />
                </div>
              )}

              {/* System Financial Calculation Box */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/60 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-2 text-xs">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block uppercase tracking-wider text-[10px]">
                  System Financial Reconciliation Summary
                </span>
                <div className="flex justify-between text-muted-foreground">
                  <span>Worker Service Charges ({workersCount} workers × ₹{dailyRateInput}/day × {durationDaysCalculated} days):</span>
                  <span className="font-bold text-foreground">{formatINR(calculatedWorkerCost)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Material Expenses:</span>
                  <span className="font-bold text-foreground">{formatINR(materialCostInput)}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 dark:border-emerald-800 pt-2 font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  <span>{estimateMode === "INITIAL" ? "Initial Total Estimate:" : "Revised Total Estimate:"}</span>
                  <span className="text-base font-extrabold">{formatINR(calculatedTotalEstimate)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowEstimateModal(false)} className="text-xs font-bold">
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingEstimate} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5">
                  {submittingEstimate
                    ? "Saving..."
                    : estimateMode === "INITIAL"
                    ? "Send Initial Proposal to Customer"
                    : "Save Revised Estimate"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* SEPARATE DAILY MONITORING & MATERIAL EXPENSE VERIFICATION MODAL */}
      {showExpenseReviewModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-border p-5 space-y-4 max-h-[90vh] overflow-y-auto rounded-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">{selectedProject.projectNumber}</span>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" /> Federation Daily Project Execution &amp; Monitoring
                </h3>
              </div>
              <button onClick={() => setShowExpenseReviewModal(false)} className="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Daily Monitoring Ledger Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-border">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Original Baseline</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(selectedProject.originalEstimateAmount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Estimate</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{formatINR(selectedProject.currentEstimatedTotal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Actual Cost to Date</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatINR(selectedProject.actualCostToDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Payments Collected</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">{formatINR(selectedProject.paymentsReceived)}</span>
                </div>
              </div>

              {/* Structured Daily Progress Updates & Proof Photos */}
              {structuredDailyUpdates.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Artisan Daily Work Logs &amp; Site Proof Photos ({structuredDailyUpdates.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {structuredDailyUpdates.map((upd: any) => (
                      <div key={upd.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {upd.created_at ? new Date(upd.created_at).toLocaleDateString() : "Daily Log"}
                          </span>
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                            {upd.progress_percentage || 0}% Progress
                          </Badge>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 font-medium">{upd.work_description}</p>
                        {upd.expense_amount > 0 && (
                          <p className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                            Reported Material Expense: {formatINR(upd.expense_amount)} ({upd.expense_description || "Materials"})
                          </p>
                        )}
                        {upd.media && upd.media.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {upd.media.map((m: any, mIdx: number) => (
                              <a
                                key={mIdx}
                                href={m.media_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-100"
                              >
                                <ImageIcon className="w-3.5 h-3.5" /> Proof Photo #{mIdx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artisan Material Expenses Audit Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Artisan Reported Material Expenses Ledger
                </h4>

                {expenseLogs.length === 0 && structuredDailyUpdates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
                    No artisan material expenses reported for today yet.
                  </p>
                ) : (
                  expenseLogs.map((log) => (
                    <Card key={log.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-border space-y-3 rounded-xl">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                        <div>
                          <span className="font-bold text-foreground text-xs">{log.workerName}</span>
                          <span className="text-[10px] text-muted-foreground block">{log.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={log.verificationStatus === "VERIFIED" ? "default" : "outline"} className="text-[10px]">
                            {log.verificationStatus}
                          </Badge>
                          <span className="font-bold text-xs text-foreground">Reported: {formatINR(log.reportedAmount)}</span>
                        </div>
                      </div>

                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p><strong className="text-foreground">Work Done:</strong> {log.workDescription}</p>
                        {log.materialsUsed && <p><strong className="text-foreground">Materials:</strong> {log.materialsUsed}</p>}
                      </div>

                      {/* Expense Verification Controls */}
                      {editingExpenseId === log.id ? (
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <input
                            type="number"
                            value={verifiedAmountInput}
                            onChange={(e) => setVerifiedAmountInput(Number(e.target.value))}
                            className="w-32 p-1.5 rounded-lg border border-border text-xs bg-background"
                          />
                          <Button size="sm" onClick={() => handleVerifyExpense(log, verifiedAmountInput)} className="bg-emerald-700 text-white text-xs h-7">
                            Confirm Verification
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingExpenseId(null)} className="text-xs h-7">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                          <div>
                            {log.verifiedAmount !== undefined && (
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                Verified Amount: {formatINR(log.verifiedAmount)}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingExpenseId(log.id);
                              setVerifiedAmountInput(log.verifiedAmount || log.reportedAmount);
                            }}
                            className="text-xs h-7 font-bold"
                          >
                            Verify Amount
                          </Button>
                        </div>
                      )}

                      {/* Customer Query & Reply Thread */}
                      {log.customerQueryText && (
                        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-xl space-y-2 mt-2">
                          <span className="text-[10px] text-amber-800 dark:text-amber-200 font-bold uppercase block">Customer Query</span>
                          <p className="text-amber-900 dark:text-amber-100 font-medium">{log.customerQueryText}</p>

                          {log.federationReply ? (
                            <div className="pl-3 border-l-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-medium">
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase">Federation Reply</span>
                              {log.federationReply}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="Type response to customer query..."
                                value={queryReplyInput}
                                onChange={(e) => setQueryReplyInput(e.target.value)}
                                className="flex-1 p-1.5 rounded-lg border border-amber-300 text-xs bg-background"
                              />
                              <Button size="sm" onClick={() => handleReplyToQuery(log.id)} className="bg-amber-700 text-white text-xs h-7">
                                Send Reply
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>

              {/* Customer Progress Queries & Feedback Section */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Customer Queries ({customerQueries.length})
                  </h4>
                  <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-300 border-amber-300 bg-amber-50 dark:bg-amber-950/60">
                    Live Realtime Active
                  </Badge>
                </div>

                {customerQueries.length === 0 ? (
                  <p className="text-muted-foreground text-xs text-center py-3 border border-dashed border-border rounded-xl">
                    No customer queries submitted yet.
                  </p>
                ) : (
                  customerQueries.map((query: any) => (
                    <Card key={query.id} className="p-3.5 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-950 dark:text-amber-100">
                          {query.message}
                        </span>
                        <Badge variant={query.status === "RESOLVED" ? "default" : "outline"} className="text-[10px]">
                          {query.status || "OPEN"}
                        </Badge>
                      </div>

                      {query.created_at && (
                        <span className="text-[10px] text-muted-foreground block">
                          Submitted: {new Date(query.created_at).toLocaleString("en-IN")}
                        </span>
                      )}

                      {query.response ? (
                        <div className="pl-3 border-l-2 border-emerald-500 text-xs text-emerald-900 dark:text-emerald-200 font-medium py-1">
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase">Federation Reply</span>
                          {query.response}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-1.5">
                          <input
                            type="text"
                            placeholder="Type reply to customer..."
                            value={queryReplyInput}
                            onChange={(e) => setQueryReplyInput(e.target.value)}
                            className="flex-1 p-1.5 rounded-lg border border-amber-300 text-xs bg-background text-foreground"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleReplyToQuery(query.id)}
                            className="bg-amber-700 text-white text-xs h-7 font-bold hover:bg-amber-800"
                          >
                            Send Reply
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              {(selectedProject.status === "CONFIRMED" || selectedProject.status === "IN_PROGRESS" || selectedProject.status === "ACTIVE") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setProposedEstimateAmount(selectedProject.currentEstimatedTotal);
                    setEstimateRevisionReason("");
                    setShowProposeRevisionModal(true);
                  }}
                  className="border-purple-300 text-purple-800 dark:text-purple-200 hover:bg-purple-50 text-xs font-bold gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Propose Estimate Change
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setShowExpenseReviewModal(false)} className="text-xs font-bold ml-auto">
                Close Monitoring Panel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* FEDERATION PROPOSE ESTIMATE REVISION MODAL */}
      {showProposeRevisionModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white dark:bg-slate-900 border border-border p-5 space-y-4 rounded-xl shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-purple-600" /> Propose Estimate Revision
              </h4>
              <button onClick={() => setShowProposeRevisionModal(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-xs space-y-1">
              <span className="font-bold text-purple-900 dark:text-purple-200">Execution Safety Notice:</span>
              <p className="text-purple-800 dark:text-purple-300 text-[11px] leading-relaxed">
                Proposed estimate changes require customer confirmation. The current approved estimate remains authoritative until the customer approves.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!proposedEstimateAmount || proposedEstimateAmount <= 0 || !estimateRevisionReason.trim()) return;

                setSubmittingRevision(true);
                try {
                  const res = await fetch("/api/projects/financials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "PROPOSE_ESTIMATE_REVISION",
                      projectId: selectedProject.id,
                      newAmount: proposedEstimateAmount,
                      reason: estimateRevisionReason.trim(),
                      createdBy: "Federation Operations",
                    }),
                  });

                  const json = await res.json();
                  if (res.ok && json.success) {
                    setActionNotice("✓ Estimate revision submitted to customer for confirmation.");
                    setShowProposeRevisionModal(false);
                    await loadProjects();
                  } else {
                    setDbError(json.error || "Failed to submit estimate revision");
                  }
                } catch (err: any) {
                  setDbError(err.message || "Failed to propose revision");
                } finally {
                  setSubmittingRevision(false);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Approved Estimate</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {formatINR(selectedProject.currentEstimatedTotal)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimated Increase</span>
                  <span className={`font-bold text-sm ${proposedEstimateAmount >= selectedProject.currentEstimatedTotal ? "text-rose-600" : "text-emerald-600"}`}>
                    {proposedEstimateAmount >= selectedProject.currentEstimatedTotal ? "+" : ""}
                    {formatINR(proposedEstimateAmount - selectedProject.currentEstimatedTotal)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">New Proposed Estimate (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  step={100}
                  value={proposedEstimateAmount || ""}
                  onChange={(e) => setProposedEstimateAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">Reason for Revision (Required for Customer Review)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Additional copper wiring and specialized electrical panels required due to site structural inspection..."
                  value={estimateRevisionReason}
                  onChange={(e) => setEstimateRevisionReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowProposeRevisionModal(false)} className="text-xs font-bold">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingRevision}
                  size="sm"
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-4"
                >
                  {submittingRevision ? "Submitting..." : "Propose Revision to Customer"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
