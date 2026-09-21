"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  CheckCircle2,
  Plus,
  Clock,
  Briefcase,
  FileText,
  Image as ImageIcon,
  Check,
  RotateCcw,
  XCircle,
  Eye,
  Users,
  CreditCard,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Receipt,
  CheckSquare,
  RefreshCw,
} from "lucide-react";
import { formatINR } from "@/lib/formatters/currency";
import { resolveProjectFinancialEstimates } from "@/lib/financials/large-project-financials";
import { paymentService } from "@/features/payments/services/payment-service";
import { createClient } from "@/lib/supabase/client";
import { LargeProjectTimeline } from "@/features/projects/components/large-project-timeline";
import { CustomerProjectConfirmationModal } from "./components/customer-project-confirmation-modal";
import { CustomerActualCostBreakdownModal } from "./components/customer-actual-cost-breakdown-modal";
import { CustomerFinalSettlementModal } from "./components/customer-final-settlement-modal";

export interface ProjectMilestone {
  id: string;
  title: string;
  amount: number;
  percentage: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  dueDate?: string;
}

export interface CustomerExpenseRecord {
  id: string;
  date: string;
  title: string;
  reportedAmount: number;
  verifiedAmount?: number;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  queryText?: string;
  queryReply?: string;
}

export interface ProjectRequest {
  id: string;
  projectNumber: string;
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
  workerCostToDate: number;
  verifiedMaterialCostToDate: number;
  paymentsReceived: number;
  settledAmount: number;
  remainingBalance: number;

  // Federation Estimate / Proposal fields
  workforceNeeded?: number;
  dailyRate?: number;
  plannedStartDate?: string;
  estimatedCompletionDate?: string;
  estimatedDays?: number;
  federationNotes?: string;

  // Execution & Progress fields
  progressPercentage?: number;
  startedAt?: string;
  completedAt?: string;

  // Milestones & Expenses
  milestones?: ProjectMilestone[];
  expenses?: CustomerExpenseRecord[];
}

export function ProjectRequestView() {
  const router = useRouter();

  const [projects, setProjects] = React.useState<ProjectRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [dbError, setDbError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState<boolean>(false);

  // Customer Form Fields
  const [title, setTitle] = React.useState("");
  const [categoryName, setCategoryName] = React.useState("General Services");
  const [description, setDescription] = React.useState("");
  const [location, setLocation] = React.useState("Satellite, Ahmedabad");
  const [preferredDuration, setPreferredDuration] = React.useState("15 days");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Auto-dismiss progress notification toasts after 6 seconds
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file type. Please select a JPG, JPEG, or PNG image.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Proposal Review Modal
  const [selectedProposal, setSelectedProposal] = React.useState<ProjectRequest | null>(null);
  const [showProposalModal, setShowProposalModal] = React.useState(false);
  const [revisionNote, setRevisionNote] = React.useState("");
  const [showRevisionInput, setShowRevisionInput] = React.useState(false);

  // Financial Ledger & Payment Modal State (Phase 4)
  const [selectedLedgerProject, setSelectedLedgerProject] = React.useState<ProjectRequest | null>(null);
  const [showLedgerModal, setShowLedgerModal] = React.useState(false);
  const [payingMilestoneId, setPayingMilestoneId] = React.useState<string | null>(null);

  // Expense Query Modal
  const [selectedExpense, setSelectedExpense] = React.useState<CustomerExpenseRecord | null>(null);
  const [queryInput, setQueryInput] = React.useState("");
  const [showQueryModal, setShowQueryModal] = React.useState(false);

  // Cancellation Modal State
  const [showCancellationModal, setShowCancellationModal] = React.useState(false);
  const [cancellationReason, setCancellationReason] = React.useState("");

  // Customer Decision Modal State
  const [decisionModalProject, setDecisionModalProject] = React.useState<ProjectRequest | null>(null);
  const [showDecisionModal, setShowDecisionModal] = React.useState(false);
  const [decisionType, setDecisionType] = React.useState<"CONFIRM" | "REVISE" | "REJECT">("CONFIRM");
  const [decisionNotes, setDecisionNotes] = React.useState("");

  // Customer Project Detail View Modal State
  const [viewingProject, setViewingProject] = React.useState<ProjectRequest | null>(null);
  const [showProjectViewModal, setShowProjectViewModal] = React.useState(false);

  // Customer Actual Cost Breakdown Modal State
  const [costBreakdownProject, setCostBreakdownProject] = React.useState<ProjectRequest | null>(null);
  const [showCostBreakdownModal, setShowCostBreakdownModal] = React.useState(false);

  // Customer Final Settlement Modal State
  const [settlementProject, setSettlementProject] = React.useState<ProjectRequest | null>(null);
  const [showFinalSettlementModal, setShowFinalSettlementModal] = React.useState(false);
  const [processingRevisionDecision, setProcessingRevisionDecision] = React.useState(false);

  // Active Financials & Payment Schedule State
  const [viewingFinancials, setViewingFinancials] = React.useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewingDailyUpdates, setViewingDailyUpdates] = React.useState<any[]>([]);

  // Customer Project Query State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedUpdateForQuery, setSelectedUpdateForQuery] = React.useState<any>(null);
  const [submittingQuery, setSubmittingQuery] = React.useState(false);
  const [queryNotice, setQueryNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (viewingProject && showProjectViewModal) {
      fetch(`/api/projects/financials?projectId=${viewingProject.id}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setViewingFinancials(data);
          }
        })
        .catch((err) => console.warn("Error fetching project financials:", err));

      fetch(`/api/projects/daily-updates?projectId=${viewingProject.id}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          const updates = data.dailyUpdates || data.updates;
          if (data.success && Array.isArray(updates)) {
            setViewingDailyUpdates(updates);
          } else {
            setViewingDailyUpdates([]);
          }
        })
        .catch((err) => console.warn("Error fetching daily updates:", err));
    } else {
      setViewingFinancials(null);
      setViewingDailyUpdates([]);
    }
  }, [viewingProject, showProjectViewModal]);

  const handleRaiseQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject || !queryInput.trim()) return;

    setSubmittingQuery(true);
    try {
      const res = await fetch("/api/projects/daily-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: viewingProject.id,
          dailyUpdateId: selectedUpdateForQuery?.id || null,
          expenseId: selectedUpdateForQuery?.expenses?.[0]?.id || null,
          message: queryInput.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        // Realtime notification to Federation monitoring listener
        try {
          const supabase = createClient();
          const channel = supabase.channel(`project_monitoring_${viewingProject.id}`);
          channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
              channel.send({
                type: "broadcast",
                event: "new_customer_query",
                payload: {
                  projectId: viewingProject.id,
                  query: json.query,
                },
              }).then(() => {
                supabase.removeChannel(channel);
              });
            }
          });
        } catch (rtErr) {
          console.warn("Realtime broadcast error:", rtErr);
        }

        setQueryNotice("✓ Query submitted successfully. Federation has been notified.");
        setShowQueryModal(false);
        setQueryInput("");
        setTimeout(() => setQueryNotice(null), 4000);
      } else {
        setQueryNotice(`❌ ${json.error || "Failed to submit query"}`);
      }
    } catch (err: any) {
      setQueryNotice(`❌ ${err?.message || "Failed to submit query"}`);
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Customer Project Confirmation & Payment Plan Modal State (Phase 2)
  const [confirmingProject, setConfirmingProject] = React.useState<ProjectRequest | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = React.useState(false);

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
          setDbError(error.message || "Failed to query database project records");
          setProjects([]);
          return;
        } else if (data) {
          rawData = data;
        }
      }

      if (rawData && rawData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: ProjectRequest[] = rawData.map((p: any) => {
          const photoMatch = p.description?.match(/\[Site Photo\]:\s*(https?:\/\/[^\s]+)/);
          const categoryMatch = p.description?.match(/\[Category\]:\s*([^\n]+)/);
          const locationMatch = p.description?.match(/\[Location\]:\s*([^\n]+)/);
          const durationMatch = p.description?.match(/\[Preferred Duration\]:\s*([^\n]+)/);

          const workersMatch = p.description?.match(/\[Workers\]:\s*(\d+)/);
          const progressMatch = p.description?.match(/\[Progress\]:\s*(\d+)%/);
          const startedAtMatch = p.description?.match(/\[Started At\]:\s*([^\n]+)/);
          const completedAtMatch = p.description?.match(/\[Completed At\]:\s*([^\n]+)/);

          const photos = photoMatch ? [photoMatch[1]] : (Array.isArray(p.site_photos) ? p.site_photos : []);
          const catName = categoryMatch ? categoryMatch[1].trim() : (p.category_name || p.category || "General Services");
          const loc = locationMatch ? locationMatch[1].trim() : "Ahmedabad, Gujarat";
          const dur = durationMatch ? durationMatch[1].trim() : "15 days";

          const estimates = resolveProjectFinancialEstimates(p);

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
            title: p.project_name || "Community Gig Project",
            categoryName: catName,
            description: p.description || "",
            location: loc,
            preferredDuration: dur,
            sitePhotos: photos,
            status: (p.status?.toUpperCase() as ProjectRequest["status"]) || "SUBMITTED",
            createdAt: p.created_at,
            originalEstimateAmount: estimates.originalEstimateAmount,
            currentEstimatedTotal: estimates.currentEstimatedTotal,
            actualCostToDate: p.actual_cost_to_date || p.actualCostToDate || 0,
            workerCostToDate: 0,
            verifiedMaterialCostToDate: p.actual_cost_to_date || p.actualCostToDate || 0,
            paymentsReceived: pmtRec,
            settledAmount: p.settled_amount || 0,
            remainingBalance: Math.max(0, estimates.currentEstimatedTotal - pmtRec),
            workforceNeeded: workersMatch ? Number(workersMatch[1]) : 5,
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
      setDbError(err?.message || "Error loading project requests");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check URL parameters for demo payment return success notice
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const isSuccess = urlParams.get("paymentSuccess");
      const txnRef = urlParams.get("txnRef");
      const amt = urlParams.get("amount");

      if (isSuccess === "true" && txnRef) {
        const formattedAmt = amt ? formatINR(Number(amt)) : "";
        setSuccessMessage(`✓ Demo Payment Successful! Amount Paid: ${formattedAmt} (Reference: ${txnRef})`);
        loadProjects();
        // Clean URL params
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [loadProjects]);

  React.useEffect(() => {
    loadProjects();

    const supabase = createClient();
    const channelId = `customer_projects_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_requests" },
        () => {
          loadProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProjects]);

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    setDbError(null);
    setUploadError(null);

    let uploadedStorageUrl = "";

    // 1. Real File Upload to Supabase Storage via /api/storage/upload
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("bucket", "avatars");

        const res = await fetch("/api/storage/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await res.json();
        if (!res.ok || !uploadData.url) {
          setDbError(`Image storage upload failed: ${uploadData.error || "Upload error"}`);
          setSubmitting(false);
          return;
        }
        uploadedStorageUrl = uploadData.url;
      } catch (err: any) {
        setDbError(`Storage upload error: ${err?.message || err}`);
        setSubmitting(false);
        return;
      }
    }

    // 2. Real Database Insert into project_requests
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Resolve authenticated user / profile ID
      const { data: { user } } = await supabase.auth.getUser();
      let customerId = user?.id;

      if (!customerId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("id")
          .eq("role", "CUSTOMER")
          .limit(1)
          .maybeSingle();
        if (profile?.id) customerId = profile.id;
      }

      // Resolve federation ID
      let federationId: string | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fed } = await (supabase.from("federations") as any)
        .select("id")
        .limit(1)
        .maybeSingle();
      if (fed?.id) federationId = fed.id;

      const formattedDescription = `${description}\n\n[Category]: ${categoryName}\n[Location]: ${location}\n[Preferred Duration]: ${preferredDuration}${uploadedStorageUrl ? `\n[Site Photo]: ${uploadedStorageUrl}` : ""}`;

      // Payload strictly compatible with existing remote DB schema
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        project_name: title,
        description: formattedDescription,
        status: "SUBMITTED",
      };

      if (customerId) payload.customer_id = customerId;
      if (federationId) payload.federation_id = federationId;
      if (uploadedStorageUrl) payload.site_photos = [uploadedStorageUrl];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedData, error: insertError } = await (supabase.from("project_requests") as any)
        .insert(payload)
        .select("*")
        .single();

      if (insertError) {
        setDbError(`Failed to insert project record into Supabase: ${insertError.message}`);
        setSubmitting(false);
        return;
      }

      if (insertedData) {
        await loadProjects();
        setSuccessMessage(`✓ Project Request "${title}" persisted to Supabase database (ID: ${insertedData.id}) successfully!`);
      }
    } catch (err: any) {
      setDbError(`Database insert error: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
      setShowForm(false);
      setTitle("");
      setDescription("");
      setSelectedFile(null);
    }
  };

  // Phase 4 Payment Processing (Milestone Payment)
  const handlePayMilestone = async (proj: ProjectRequest, milestone: ProjectMilestone) => {
    setPayingMilestoneId(milestone.id);
    try {
      // Create payment record & process gateway transaction
      const payRecord = await paymentService.createPaymentRecord({
        invoiceId: `inv-proj-${proj.id}`,
        bookingId: proj.id,
        customerId: "a0000000-0000-0000-0000-000000000001",
        amount: milestone.amount,
        gatewayProvider: "razorpay",
      });

      await paymentService.processMockPayment(payRecord.id, true);

      // Update project ledger state locally and in DB
      const newPaymentsReceived = proj.paymentsReceived + milestone.amount;
      const newSettledAmount = proj.settledAmount + Math.round(milestone.amount * 0.85); // 85% settled to workers/federation

      const updatedMilestones = (proj.milestones || []).map((m) =>
        m.id === milestone.id ? { ...m, status: "PAID" as const } : m
      );

      const updatedProj: ProjectRequest = {
        ...proj,
        paymentsReceived: newPaymentsReceived,
        settledAmount: newSettledAmount,
        remainingBalance: proj.currentEstimatedTotal - newPaymentsReceived,
        milestones: updatedMilestones,
      };

      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("project_requests") as any)
          .update({
            payments_received: newPaymentsReceived,
            settled_amount: newSettledAmount,
          })
          .eq("id", proj.id);
      } catch (err) {
        console.warn("DB payment ledger update notice:", err);
      }

      setProjects((prev) => prev.map((p) => (p.id === proj.id ? updatedProj : p)));
      setSelectedLedgerProject(updatedProj);
      setSuccessMessage(`✓ Payment of ${formatINR(milestone.amount)} received successfully! Worker settlement triggered.`);
    } catch (err) {
      console.error("Payment processing error", err);
    } finally {
      setPayingMilestoneId(null);
    }
  };

  // Submit Expense Query
  const handleSubmitExpenseQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense || !queryInput.trim() || !selectedLedgerProject) return;

    const updatedExpenses = (selectedLedgerProject.expenses || []).map((exp) =>
      exp.id === selectedExpense.id ? { ...exp, queryText: queryInput } : exp
    );

    const updatedProj = { ...selectedLedgerProject, expenses: updatedExpenses };
    setProjects((prev) => prev.map((p) => (p.id === selectedLedgerProject.id ? updatedProj : p)));
    setSelectedLedgerProject(updatedProj);
    setShowQueryModal(false);
    setQueryInput("");
    setSuccessMessage("Financial query submitted to Federation for review.");
  };

  // Handle Post-Confirmation Cancellation
  const handleConfirmCancellation = async (proj: ProjectRequest) => {
    if (!cancellationReason.trim()) return;

    // Cancellation Bill = incurred worker charges + verified material expenses + 10% fee
    const cancellationFee = Math.round(proj.currentEstimatedTotal * 0.1);
    const totalCancellationObligation = proj.workerCostToDate + proj.verifiedMaterialCostToDate + cancellationFee;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("project_requests") as any)
        .update({
          status: "CANCELLED",
          rejection_reason: cancellationReason,
        })
        .eq("id", proj.id);
    } catch (err) {
      console.warn("DB cancellation error:", err);
    }

    setProjects((prev) => prev.map((p) => (p.id === proj.id ? { ...p, status: "CANCELLED" } : p)));
    setShowCancellationModal(false);
    setSelectedLedgerProject(null);
    setSuccessMessage(
      `Project cancelled. Final obligation: ${formatINR(totalCancellationObligation)}. Payments received: ${formatINR(proj.paymentsReceived)}.`
    );
  };

  // Customer Proposal Decision Actions (Real DB Updates)
  const handleConfirmProposal = async (proj: ProjectRequest) => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("project_requests") as any)
        .update({
          status: "CONFIRMED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", proj.id)
        .select();

      if (error) {
        setDbError(`Failed to confirm proposal: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        setDbError("Unable to confirm proposal: 0 rows modified in database. Check RLS or user permissions.");
        return;
      }

      const updatedProj = { ...proj, status: "CONFIRMED" as const };
      setSelectedLedgerProject(updatedProj);
      await loadProjects();
      setSuccessMessage(`✓ Proposal for "${proj.title}" confirmed! Federation worker allocation in progress.`);
    } catch (err: any) {
      setDbError(`DB proposal confirm error: ${err?.message || err}`);
    }
  };

  const handleExecuteDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModalProject) return;

    if (decisionType === "CONFIRM") {
      await handleConfirmProposal(decisionModalProject);
      setShowDecisionModal(false);
      return;
    }

    if (decisionType === "REVISE") {
      if (!decisionNotes.trim()) return;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const updatedDescription = `${decisionModalProject.description}\n\n[Customer Revision Request]: ${decisionNotes.trim()}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from("project_requests") as any)
          .update({
            status: "REVISION_REQUESTED",
            description: updatedDescription,
            updated_at: new Date().toISOString(),
          })
          .eq("id", decisionModalProject.id)
          .select();

        if (error) {
          setDbError(`Failed to request changes: ${error.message}`);
          return;
        }

        if (!data || data.length === 0) {
          setDbError("Unable to request changes: 0 rows modified in database. Check RLS or user permissions.");
          return;
        }

        const updatedProj = { ...decisionModalProject, status: "REVISION_REQUESTED" as const, description: updatedDescription };
        setSelectedLedgerProject(updatedProj);
        await loadProjects();
        setSuccessMessage(`✓ Requested changes for "${decisionModalProject.title}". Federation notified.`);
      } catch (err: any) {
        setDbError(`DB revision error: ${err?.message || err}`);
      } finally {
        setShowDecisionModal(false);
        setDecisionNotes("");
      }
      return;
    }

    if (decisionType === "REJECT") {
      if (!decisionNotes.trim()) return;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const updatedDescription = `${decisionModalProject.description}\n\n[Customer Rejection Reason]: ${decisionNotes.trim()}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from("project_requests") as any)
          .update({
            status: "REJECTED",
            description: updatedDescription,
            rejection_reason: decisionNotes.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", decisionModalProject.id)
          .select();

        if (error) {
          setDbError(`Failed to reject proposal: ${error.message}`);
          return;
        }

        if (!data || data.length === 0) {
          setDbError("Unable to reject proposal: 0 rows modified in database. Check RLS or user permissions.");
          return;
        }

        const updatedProj = { ...decisionModalProject, status: "REJECTED" as const, description: updatedDescription };
        setSelectedLedgerProject(updatedProj);
        await loadProjects();
        setSuccessMessage(`✓ Proposal for "${decisionModalProject.title}" has been rejected.`);
      } catch (err: any) {
        setDbError(`DB reject proposal error: ${err?.message || err}`);
      } finally {
        setShowDecisionModal(false);
        setDecisionNotes("");
      }
      return;
    }
  };

  const getStatusBadge = (status: ProjectRequest["status"]) => {
    switch (status) {
      case "SUBMITTED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 font-bold text-xs">Submitted</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs">Under Review</Badge>;
      case "PROPOSAL_SENT":
        return <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300 font-bold text-xs">Proposal Ready</Badge>;
      case "CONFIRMED":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs">Confirmed & Active</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Large Project Workforce Requests & Financial Ledger"
        description="Manage multi-artisan projects, phased payment plans, daily material cost visibility, expense queries, and project financial reconciliation."
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Project Workforce" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadProjects}
              className="h-7 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 shadow-md gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Submit New Project Request
              </Button>
            )}
          </div>
        }
      />

      {/* Submit New Project Request Form Card */}
      {showForm && (
        <Card className="bg-white dark:bg-slate-900 border-2 border-emerald-500/50 shadow-lg rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Submit Large Project Workforce Request
            </h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">✕ Cancel</button>
          </div>

          <form onSubmit={handleSubmitProject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">Project Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shivam Society Common Area Repainting & Waterproofing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Project Category *</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="General Services">General Services</option>
                  <option value="Painting & Waterproofing">Painting & Waterproofing</option>
                  <option value="Plumbing & Water Systems">Plumbing & Water Systems</option>
                  <option value="Electrical & Power Distribution">Electrical & Power Distribution</option>
                  <option value="Construction & Masonry">Construction & Masonry</option>
                  <option value="Carpentry & Interior Work">Carpentry & Interior Work</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Location / Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Satellite, Ahmedabad, Gujarat"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Preferred Target Duration *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15 days"
                  value={preferredDuration}
                  onChange={(e) => setPreferredDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Project Photos (JPG, PNG)</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 dark:border-slate-800 rounded-lg p-1"
                  />
                  {uploadError && (
                    <p className="text-[11px] text-rose-600 font-semibold">{uploadError}</p>
                  )}
                  {selectedFile && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-200">
                      <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium truncate">
                        <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{selectedFile.name}</span>
                        <span className="text-[10px] text-emerald-600 shrink-0">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="h-6 text-[10px] text-rose-600 hover:text-rose-800 font-bold px-2"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">Detailed Scope / Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the full scope of work, block requirements, surface area, or artisan skills needed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="text-xs font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5">
                {submitting ? "Submitting..." : "Submit Project Request"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Notification Banner */}
      {successMessage && (
        <Card className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 font-bold hover:underline">Dismiss</button>
        </Card>
      )}

      {/* DB Connection / Notice Banner */}
      {dbError && (
        <Card className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 p-4 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Database Notice: {dbError}</span>
          </div>
        </Card>
      )}

      {/* Submitted Projects Cards List / Loading / Empty State */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-8 text-center text-xs text-slate-500 rounded-xl space-y-2">
            <Clock className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p className="font-bold">Loading project records from Supabase database...</p>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="p-10 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-3">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">No Large Projects Found</p>
              <p className="text-slate-400 mt-1">Submit a new project request above to initiate a multi-artisan workforce request.</p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Submit First Project Request
            </Button>
          </Card>
        ) : (
          projects.map((proj) => (
          <Card key={proj.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">{proj.projectNumber}</span>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">{proj.title}</h4>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{proj.categoryName}</span>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(proj.status)}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {proj.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Duration: {proj.preferredDuration}
                </span>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setViewingProject(proj);
                  setShowProjectViewModal(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 gap-1.5 ml-auto shadow-xs"
              >
                <Eye className="w-4 h-4" /> View Project
              </Button>
            </div>

            {/* ONLY show compact financial summary bar if estimate exists (> 0) */}
            {proj.currentEstimatedTotal > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Estimate</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{formatINR(proj.currentEstimatedTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCostBreakdownProject(proj);
                    setShowCostBreakdownModal(true);
                  }}
                  className="text-left group hover:opacity-90 transition-all rounded p-0.5 hover:bg-slate-100 dark:hover:bg-slate-900"
                  title="Click to view detailed date-wise actual cost breakdown"
                >
                  <span className="text-[10px] text-slate-400 font-bold block uppercase flex items-center gap-1 group-hover:text-blue-600">
                    Actual Cost to Date
                    <Eye className="w-3 h-3 text-blue-600" />
                  </span>
                  <span className="font-extrabold text-blue-700 dark:text-blue-400 underline decoration-dotted underline-offset-2">
                    {formatINR(proj.actualCostToDate || 0)}
                  </span>
                </button>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Payments Received</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">{formatINR(proj.paymentsReceived)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Remaining Balance</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300">{formatINR(proj.remainingBalance)}</span>
                </div>
              </div>
            )}
          </Card>
        )))}
      </div>

      {/* DEDICATED CUSTOMER LARGE PROJECT VIEW MODAL (WITH FULL LIFECYCLE TIMELINE) */}
      {showProjectViewModal && viewingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5 max-h-[92vh] overflow-y-auto rounded-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">{viewingProject.projectNumber}</span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" /> {viewingProject.title}
                </h3>
              </div>
              <button onClick={() => setShowProjectViewModal(false)} className="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
            </div>

            {/* FULL LIFECYCLE TIMELINE INSIDE PROJECT VIEW */}
            <LargeProjectTimeline
              projectId={viewingProject.id}
              status={viewingProject.status}
              role="CUSTOMER"
              createdAt={viewingProject.createdAt}
              onStatusChange={() => {
                loadProjects();
              }}
            />

            {/* PROJECT EXECUTION & PROGRESS TRACKING CARD */}
            {(viewingProject.status === "IN_PROGRESS" || viewingProject.status === "ACTIVE" || viewingProject.status === "COMPLETED") && (
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Project Execution &amp; Live Tracking</span>
                  </div>
                  <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-extrabold">
                    {viewingProject.status === "COMPLETED" ? "COMPLETED (100%)" : `IN PROGRESS (${viewingProject.progressPercentage || 0}%)`}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span>Execution Progress</span>
                    <span>{viewingProject.progressPercentage || 0}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, viewingProject.progressPercentage || 0))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">Assigned Workforce</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{viewingProject.workforceNeeded || 5} Skilled Artisans</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">Started Date</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {viewingProject.startedAt ? new Date(viewingProject.startedAt).toLocaleDateString() : "Active"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">Status</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {viewingProject.status === "COMPLETED" ? "Work Verified & Handed Over" : "Active Execution"}
                    </span>
                  </div>
                </div>

                {/* WORKER DAILY UPDATES TIMELINE PANEL FOR CUSTOMER */}
                {viewingDailyUpdates.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                        Artisan Daily Work Logs &amp; Site Proof Photos ({viewingDailyUpdates.length})
                      </span>
                      {queryNotice && (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">{queryNotice}</span>
                      )}
                    </div>
                    <div className="space-y-2.5 max-h-60 overflow-y-auto">
                      {viewingDailyUpdates.map((upd: any) => {
                        const updExp = upd.expenses && upd.expenses.length > 0 ? upd.expenses[0] : null;
                        const expAmt = updExp ? Number(updExp.amount || 0) : Number(upd.expense_amount || 0);
                        const expStatus = updExp?.status || "PENDING";
                        const verifiedAmt = updExp?.verified_amount !== null && updExp?.verified_amount !== undefined ? Number(updExp.verified_amount) : expAmt;

                        return (
                          <div key={upd.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/80 text-xs space-y-2 shadow-xs">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {upd.work_date || (upd.created_at ? new Date(upd.created_at).toLocaleDateString() : "Daily Log")} • {upd.worker_name || "Artisan"}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                                  {upd.progress_percentage || 0}% Progress
                                </Badge>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUpdateForQuery(upd);
                                    setQueryInput("");
                                    setShowQueryModal(true);
                                  }}
                                  className="text-[10px] text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 h-6 px-2 font-bold"
                                >
                                  Raise Query
                                </Button>
                              </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-200 font-medium">{upd.work_description}</p>
                            
                            <div className="flex flex-wrap items-center gap-3 text-[11px] bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span className="text-slate-600 dark:text-slate-400">
                                Worker Daily Charge: <strong className="text-foreground">{formatINR(upd.labor_charge || 900)}</strong>
                              </span>
                              {expAmt > 0 && (
                                <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                                  Material Expense: {formatINR(expStatus === "VERIFIED" ? verifiedAmt : expAmt)} ({expStatus === "VERIFIED" ? "Verified" : "Pending Verification"})
                                </span>
                              )}
                            </div>

                            {upd.media && upd.media.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-0.5">
                                {upd.media.map((m: any, mIdx: number) => {
                                  const pUrl = m.storage_path || m.media_url || "";
                                  return (
                                    <a
                                      key={mIdx}
                                      href={pUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-100"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" /> Proof Photo #{mIdx + 1}
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase block tracking-wider">Project Overview</span>
                <div className="space-y-1 text-slate-700 dark:text-slate-300">
                  <p><strong>Category:</strong> {viewingProject.categoryName}</p>
                  <p><strong>Location:</strong> {viewingProject.location}</p>
                  <p><strong>Preferred Duration:</strong> {viewingProject.preferredDuration}</p>
                  <p><strong>Submitted Date:</strong> {new Date(viewingProject.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase block tracking-wider">Detailed Scope</span>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{viewingProject.description}</p>
              </div>
            </div>

            {/* ATTACHED SITE PHOTOS IF ANY */}
            {viewingProject.sitePhotos && viewingProject.sitePhotos.length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white uppercase block">Attached Site Photos</span>
                <div className="flex flex-wrap gap-2">
                  {viewingProject.sitePhotos.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs hover:bg-emerald-100">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      View Site Photo #{idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CUSTOMER PROPOSAL DECISION BANNER (Shown when status is PROPOSAL_SENT or REVISION_REQUESTED) */}
            {(viewingProject.status === "PROPOSAL_SENT" || viewingProject.status === "REVISION_REQUESTED") && (
              <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-200">
                    <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Initial Estimate Proposal Delivered — Customer Decision Required</span>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-extrabold">
                    Proposal Total: {formatINR(viewingProject.currentEstimatedTotal)}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => {
                      setConfirmingProject(viewingProject);
                      setShowConfirmationModal(true);
                      setShowProjectViewModal(false);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 shadow-sm gap-1"
                  >
                    <Check className="w-4 h-4" /> Review &amp; Confirm Proposal
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDecisionModalProject(viewingProject);
                      setDecisionType("REVISE");
                      setDecisionNotes("");
                      setShowDecisionModal(true);
                    }}
                    className="border-amber-300 text-amber-800 dark:text-amber-200 hover:bg-amber-50 text-xs font-bold gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Request Changes
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDecisionModalProject(viewingProject);
                      setDecisionType("REJECT");
                      setDecisionNotes("");
                      setShowDecisionModal(true);
                    }}
                    className="border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50 text-xs font-bold gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Proposal
                  </Button>
                </div>
              </div>
            )}

            {/* IN-PROGRESS ESTIMATE REVISION REQUEST BANNER */}
            {viewingFinancials?.pendingRevision && (
              <div className="p-4 bg-purple-50/90 dark:bg-purple-950/60 border-2 border-purple-300 dark:border-purple-800 rounded-xl space-y-3 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-purple-950 dark:text-purple-200">
                    <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-sm">In-Progress Estimate Revision Requested</span>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 font-extrabold">
                    Customer Confirmation Required
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-purple-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Previous Approved Estimate</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatINR(viewingFinancials.pendingRevision.previous_amount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Proposed New Estimate</span>
                    <span className="font-extrabold text-purple-800 dark:text-purple-300 text-sm">{formatINR(viewingFinancials.pendingRevision.current_amount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Increase Difference</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      +{formatINR(viewingFinancials.pendingRevision.difference_amount)}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white/70 dark:bg-slate-900/70 rounded-lg text-[11px] text-slate-700 dark:text-slate-300">
                  <strong>Reason for Revision: </strong>
                  {viewingFinancials.pendingRevision.revision_reason || "Additional material and execution requirements encountered."}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    disabled={processingRevisionDecision}
                    onClick={async () => {
                      setProcessingRevisionDecision(true);
                      try {
                        const res = await fetch("/api/projects/financials", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "CONFIRM_ESTIMATE_REVISION",
                            projectId: viewingProject.id,
                            revisionId: viewingFinancials.pendingRevision.id,
                          }),
                        });
                        const json = await res.json();
                        if (res.ok && json.success) {
                          setSuccessMessage("✓ Estimate revision confirmed and approved! New project estimate updated.");
                          await loadProjects();
                          const fRes = await fetch(`/api/projects/financials?projectId=${viewingProject.id}`);
                          if (fRes.ok) {
                            const fData = await fRes.json();
                            setViewingFinancials(fData);
                          }
                        } else {
                          setDbError(json.error || "Failed to confirm estimate revision");
                        }
                      } catch (e: any) {
                        setDbError(e.message || "Failed to confirm revision");
                      } finally {
                        setProcessingRevisionDecision(false);
                      }
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Confirm New Estimate
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={processingRevisionDecision}
                    onClick={async () => {
                      setProcessingRevisionDecision(true);
                      try {
                        const res = await fetch("/api/projects/financials", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "DECLINE_ESTIMATE_REVISION",
                            projectId: viewingProject.id,
                            revisionId: viewingFinancials.pendingRevision.id,
                          }),
                        });
                        const json = await res.json();
                        if (res.ok && json.success) {
                          setSuccessMessage("Estimate revision declined. Existing approved estimate remains unchanged.");
                          await loadProjects();
                          const fRes = await fetch(`/api/projects/financials?projectId=${viewingProject.id}`);
                          if (fRes.ok) {
                            const fData = await fRes.json();
                            setViewingFinancials(fData);
                          }
                        } else {
                          setDbError(json.error || "Failed to decline estimate revision");
                        }
                      } catch (e: any) {
                        setDbError(e.message || "Failed to decline revision");
                      } finally {
                        setProcessingRevisionDecision(false);
                      }
                    }}
                    className="border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50 text-xs font-bold gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Decline
                  </Button>
                </div>
              </div>
            )}

            {/* FINAL PROJECT SETTLEMENT BANNER (Shown when status is COMPLETED) */}
            {viewingProject.status === "COMPLETED" && (
              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 rounded-xl space-y-3 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-950 dark:text-emerald-200">
                    <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm">Final Project Settlement</span>
                  </div>
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold">
                    {viewingProject.remainingBalance === 0 ? "Fully Settled & Completed" : "Settlement Action Required"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200/70">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Final Cost</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{formatINR(viewingProject.currentEstimatedTotal || viewingProject.actualCostToDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Already Paid</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatINR(viewingProject.paymentsReceived)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Remaining Due</span>
                    <span className="font-extrabold text-purple-700 dark:text-purple-300">{formatINR(viewingProject.remainingBalance)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSettlementProject(viewingProject);
                      setShowFinalSettlementModal(true);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 gap-1.5 shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> {viewingProject.remainingBalance > 0 ? "Pay Remaining Balance" : "View Final Settlement Receipt"}
                  </Button>
                </div>
              </div>
            )}

            {/* FINANCIAL LEDGER BANNER & ACTIONS (Shown when estimate > 0) */}
            {viewingProject.currentEstimatedTotal > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" /> Project Financial Ledger &amp; Payments
                  </h4>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedLedgerProject(viewingProject);
                      setShowLedgerModal(true);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 gap-1.5"
                  >
                    Manage Payments &amp; Milestones
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Original Baseline</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(viewingProject.originalEstimateAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Estimate</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{formatINR(viewingProject.currentEstimatedTotal)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCostBreakdownProject(viewingProject);
                      setShowCostBreakdownModal(true);
                    }}
                    className="text-left group hover:opacity-90 transition-all rounded p-0.5 hover:bg-slate-100 dark:hover:bg-slate-900"
                    title="Click to view detailed date-wise actual cost breakdown"
                  >
                    <span className="text-[10px] text-slate-400 font-bold block uppercase flex items-center gap-1 group-hover:text-blue-600">
                      Actual Cost to Date
                      <Eye className="w-3 h-3 text-blue-600" />
                    </span>
                    <span className="font-extrabold text-blue-700 dark:text-blue-400 underline decoration-dotted underline-offset-2">
                      {formatINR(viewingFinancials?.actualCost ?? viewingProject.actualCostToDate ?? 0)}
                    </span>
                  </button>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Payments Received</span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">{formatINR(viewingProject.paymentsReceived)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Remaining Balance</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">{formatINR(viewingProject.remainingBalance)}</span>
                  </div>
                </div>

                {/* CUSTOMER PAYMENT SCHEDULE & DEADLINES CARD (Phase 3 Update) */}
                {viewingFinancials?.activePaymentPlan && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-emerald-600" /> Active Payment Schedule &amp; Deadlines
                      </h4>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                        {viewingFinancials.activePaymentPlan.plan_type || viewingFinancials.activePaymentPlan.planType}
                      </Badge>
                    </div>

                    {/* Overdue Warning Banner if any installment is OVERDUE */}
                    {viewingFinancials.activePaymentPlan.installments?.some((i: any) => i.isOverdue || i.paymentStatus === "OVERDUE") && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 rounded-lg flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Payment Overdue Notice: One or more installments are past their deadline. Project execution remains active. Please make your payment.
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      {viewingFinancials.activePaymentPlan.installments?.map((inst: any) => {
                        const isPaid = inst.paymentStatus === "PAID" || inst.paidAtIso;
                        const isOverdue = inst.isOverdue || inst.paymentStatus === "OVERDUE";
                        const instId = inst.id || String(inst.installmentNumber || inst.installment_number || 1);

                        return (
                          <div key={inst.installmentNumber || instId} className="flex flex-wrap items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">{inst.label || `Installment #${inst.installmentNumber}`}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold ${
                                    isPaid
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                      : isOverdue
                                      ? "bg-rose-100 text-rose-800 border-rose-300"
                                      : inst.paymentStatus === "DUE"
                                      ? "bg-amber-100 text-amber-800 border-amber-300"
                                      : "bg-slate-100 text-slate-700 border-slate-300"
                                  }`}
                                >
                                  {isPaid ? "PAID" : isOverdue ? `OVERDUE (${inst.overdueDays || 1}d)` : inst.paymentStatus || "DUE"}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-slate-500 block pt-0.5">
                                {inst.dueDateText || `Due ${inst.dueAtIso ? new Date(inst.dueAtIso).toLocaleDateString() : ""}`}
                                {inst.daysRemaining !== undefined && !isPaid && !isOverdue && inst.daysRemaining > 0 && (
                                  <span className="text-emerald-600 font-bold ml-1.5">({inst.daysRemaining} days remaining)</span>
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{formatINR(inst.amount)}</span>
                              {!isPaid && (
                                <Button
                                  size="sm"
                                  onClick={() => router.push(`/customer/projects/${viewingProject.id}/payment/${instId}`)}
                                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1 gap-1 shadow-xs"
                                >
                                  <CreditCard className="w-3.5 h-3.5" /> Pay Now
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setShowProjectViewModal(false)} className="text-xs font-bold">
                Close Project View
              </Button>
            </div>
          </Card>
        </div>
      )}


      {/* PHASE 4 FINANCIAL LEDGER & PAYMENT PLAN MODAL */}
      {showLedgerModal && selectedLedgerProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5 max-h-[92vh] overflow-y-auto rounded-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">{selectedLedgerProject.projectNumber}</span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Project Financial Ledger & Payment Management</h3>
              </div>
              <button onClick={() => setShowLedgerModal(false)} className="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
            </div>

            {/* Financial Ledger Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-300/40 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Original Baseline</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(selectedLedgerProject.originalEstimateAmount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Estimated Total</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">{formatINR(selectedLedgerProject.currentEstimatedTotal)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Payments Received</span>
                <span className="font-bold text-emerald-900 dark:text-emerald-200">{formatINR(selectedLedgerProject.paymentsReceived)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Remaining Balance</span>
                <span className="font-extrabold text-purple-700 dark:text-purple-300 text-sm">{formatINR(selectedLedgerProject.remainingBalance)}</span>
              </div>
            </div>

            {/* Estimate Revision Banner if scope increased */}
            {selectedLedgerProject.currentEstimatedTotal > selectedLedgerProject.originalEstimateAmount && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs space-y-1 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>Project Scope Revision Notice</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Original Estimate: <strong>{formatINR(selectedLedgerProject.originalEstimateAmount)}</strong> → Revised Estimated Total: <strong>{formatINR(selectedLedgerProject.currentEstimatedTotal)}</strong> (+{formatINR(selectedLedgerProject.currentEstimatedTotal - selectedLedgerProject.originalEstimateAmount)} increase). Remaining milestone balance adjusted explicitly.
                </p>
              </div>
            )}

            {/* Phased Payment Plan Milestones */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" /> Phased Payment Plan Schedule
              </h4>

              <div className="space-y-2.5">
                {(selectedLedgerProject.milestones || []).map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{m.title}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{m.percentage}%</Badge>
                      </div>
                      <span className="text-[11px] text-slate-400 block pt-0.5">Due Date: {m.dueDate}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{formatINR(m.amount)}</span>
                      {m.status === "PAID" ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Paid
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={payingMilestoneId === m.id}
                          onClick={() => handlePayMilestone(selectedLedgerProject, m)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4"
                        >
                          {payingMilestoneId === m.id ? "Processing Gateway..." : "Pay Milestone"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Material Expenses & Queries */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" /> Daily Material Expenses & Customer Queries
              </h4>

              <div className="space-y-2.5">
                {(selectedLedgerProject.expenses || []).map((exp) => (
                  <div key={exp.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{exp.title}</span>
                      <span className="text-[11px] text-slate-400">{exp.date}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span>Reported: {formatINR(exp.reportedAmount)} • Verified: <strong>{formatINR(exp.verifiedAmount || exp.reportedAmount)}</strong></span>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                        {exp.status}
                      </Badge>
                    </div>

                    {exp.queryText ? (
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 text-[11px] space-y-1">
                        <span className="font-bold text-blue-900 dark:text-blue-200">Customer Query: &quot;{exp.queryText}&quot;</span>
                        {exp.queryReply && (
                          <p className="text-slate-700 dark:text-slate-300">Federation Reply: &quot;{exp.queryReply}&quot;</p>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExpense(exp);
                          setShowQueryModal(true);
                        }}
                        className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <HelpCircle className="w-3 h-3" /> Raise Expense Query
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Post-Confirmation Cancellation Option */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">Need to cancel project? Cancellation billing rules apply.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancellationModal(true)}
                className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Project
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* EXPENSE QUERY MODAL */}
      {showQueryModal && selectedExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 p-5 space-y-4 rounded-xl">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Submit Financial Query regarding Expense</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">Expense: {selectedExpense.title} ({formatINR(selectedExpense.reportedAmount)})</p>

            <form onSubmit={handleSubmitExpenseQuery} className="space-y-3 text-xs">
              <textarea
                rows={3}
                required
                placeholder="Describe your query or reason for questioning this expense..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowQueryModal(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-emerald-700 text-white font-bold">Submit Query</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* POST-CONFIRMATION CANCELLATION MODAL */}
      {showCancellationModal && selectedLedgerProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 p-5 space-y-4 rounded-xl">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Post-Confirmation Cancellation</span>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-3.5 rounded-xl border border-rose-200 text-xs space-y-1.5 text-rose-900 dark:text-rose-200">
              <span className="font-bold block">Cancellation Financial Billing Summary:</span>
              <div className="flex justify-between text-[11px]">
                <span>Incurred Worker Charges:</span>
                <span>{formatINR(selectedLedgerProject.workerCostToDate)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Verified Material Expenses:</span>
                <span>{formatINR(selectedLedgerProject.verifiedMaterialCostToDate)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Applicable Cancellation Fee (10%):</span>
                <span>{formatINR(Math.round(selectedLedgerProject.currentEstimatedTotal * 0.1))}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-rose-300/40">
                <span>Total Cancellation Obligation:</span>
                <span>{formatINR(selectedLedgerProject.workerCostToDate + selectedLedgerProject.verifiedMaterialCostToDate + Math.round(selectedLedgerProject.currentEstimatedTotal * 0.1))}</span>
              </div>
            </div>

            <textarea
              rows={2}
              required
              placeholder="State reason for project cancellation..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCancellationModal(false)}>Cancel</Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleConfirmCancellation(selectedLedgerProject)}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold"
              >
                Confirm Cancellation
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* CUSTOMER PROPOSAL DECISION MODAL (Request Changes / Reject) */}
      {showDecisionModal && decisionModalProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 p-5 space-y-4 rounded-xl">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {decisionType === "REVISE" ? "Request Changes to Proposal" : "Reject Project Proposal"}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Project: {decisionModalProject.title} ({formatINR(decisionModalProject.currentEstimatedTotal)})
            </p>

            <form onSubmit={handleExecuteDecision} className="space-y-3 text-xs">
              <textarea
                rows={3}
                required
                placeholder={
                  decisionType === "REVISE"
                    ? "Specify required changes to scope, schedule, or budget..."
                    : "State reason for rejecting the project proposal..."
                }
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDecisionModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className={decisionType === "REVISE" ? "bg-amber-700 text-white font-bold" : "bg-rose-700 text-white font-bold"}
                >
                  {decisionType === "REVISE" ? "Submit Change Request" : "Confirm Rejection"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* PHASE 2: CUSTOMER CONFIRMATION & PAYMENT PLAN MODAL */}
      {showConfirmationModal && confirmingProject && (
        <CustomerProjectConfirmationModal
          projectId={confirmingProject.id}
          projectNumber={confirmingProject.projectNumber}
          title={confirmingProject.title}
          categoryName={confirmingProject.categoryName}
          location={confirmingProject.location}
          preferredDuration={confirmingProject.preferredDuration}
          description={confirmingProject.description}
          originalEstimateAmount={confirmingProject.originalEstimateAmount}
          currentEstimatedTotal={confirmingProject.currentEstimatedTotal}
          paymentsReceived={confirmingProject.paymentsReceived}
          onClose={() => {
            setShowConfirmationModal(false);
            setConfirmingProject(null);
          }}
          onSuccess={async () => {
            setShowConfirmationModal(false);
            setConfirmingProject(null);
            await loadProjects();
            setSuccessMessage("✓ Project proposal confirmed and initial installment payment recorded! Federation worker allocation in progress.");
          }}
        />
      )}

      {/* CUSTOMER RAISE QUERY MODAL */}
      {showQueryModal && viewingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 rounded-xl shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" /> Raise Query to Federation
              </h4>
              <button onClick={() => setShowQueryModal(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <p className="text-xs text-muted-foreground">
              Submit your inquiry or clarification request regarding daily work logs or material costs. Federation management will review and respond directly.
            </p>

            <form onSubmit={handleRaiseQuerySubmit} className="space-y-3 text-xs">
              <textarea
                rows={3}
                required
                placeholder="e.g. Please clarify the ₹8,500 material expense reported for copper wire..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowQueryModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingQuery}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {submittingQuery ? "Submitting..." : "Send Query"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      {/* CUSTOMER ACTUAL COST DETAILED BREAKDOWN MODAL */}
      {showCostBreakdownModal && costBreakdownProject && (
        <CustomerActualCostBreakdownModal
          projectId={costBreakdownProject.id}
          projectNumber={costBreakdownProject.projectNumber}
          title={costBreakdownProject.title}
          currentEstimatedTotal={costBreakdownProject.currentEstimatedTotal}
          paymentsReceived={costBreakdownProject.paymentsReceived}
          initialActualCost={viewingFinancials?.actualCost ?? costBreakdownProject.actualCostToDate ?? 0}
          onClose={() => {
            setShowCostBreakdownModal(false);
            setCostBreakdownProject(null);
          }}
        />
      )}
      {/* CUSTOMER FINAL SETTLEMENT & CANCELLATION MODAL */}
      {showFinalSettlementModal && settlementProject && (
        <CustomerFinalSettlementModal
          projectId={settlementProject.id}
          projectNumber={settlementProject.projectNumber}
          title={settlementProject.title}
          currentEstimatedTotal={settlementProject.currentEstimatedTotal}
          actualCostToDate={viewingFinancials?.actualCost ?? settlementProject.actualCostToDate ?? 0}
          paymentsReceived={settlementProject.paymentsReceived}
          onClose={() => {
            setShowFinalSettlementModal(false);
            setSettlementProject(null);
          }}
          onSuccess={async (updatedStatus: string) => {
            setShowFinalSettlementModal(false);
            setSettlementProject(null);
            setShowProjectViewModal(false);
            await loadProjects();
            if (updatedStatus === "CANCELLED") {
              setSuccessMessage("✓ Project successfully cancelled and final financial settlement recorded.");
            } else {
              setSuccessMessage("✓ Final settlement payment recorded successfully! Project is now fully settled and closed.");
            }
          }}
        />
      )}
    </div>
  );
}
