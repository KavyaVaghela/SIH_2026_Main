"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderOpen,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  Clock,
  Receipt,
  XCircle,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { GrievanceCase, GrievanceLifecycleStatus, GrievancePriority } from "@/types/complaints/v2";
import type { WorkerComplaintSubsection } from "@/features/worker/complaints/types";
import { WorkerComplaintsHeader } from "@/features/worker/complaints/components/worker-complaints-header";
import { WorkerPolicyNotice } from "@/features/worker/complaints/components/worker-policy-notice";
import { WorkerResponseDialog } from "@/features/worker/complaints/components/worker-response-dialog";

export default function WorkerGrievancesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<WorkerComplaintSubsection>("MY_COMPLAINTS");
  const [myComplaints, setMyComplaints] = React.useState<GrievanceCase[]>([]);
  const [customerComplaints, setCustomerComplaints] = React.useState<GrievanceCase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Response dialog state
  const [selectedComplaint, setSelectedComplaint] = React.useState<GrievanceCase | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = React.useState(false);
  const [currentWorkerId, setCurrentWorkerId] = React.useState<string>("59eca4ff-a589-4363-ad76-24a4ff5b6e2e");
  const [currentWorkerName, setCurrentWorkerName] = React.useState<string>("Ravi Patel");

  const fetchComplaints = React.useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const workerId = user?.id || "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
      const workerName = user?.user_metadata?.full_name || "Ravi Patel";
      setCurrentWorkerId(workerId);
      setCurrentWorkerName(workerName);

      // Fetch My Complaints (raised by worker)
      const resMy = await fetch(`/api/complaints?role=WORKER&actorId=${workerId}&filterType=MY_COMPLAINTS`);
      const dataMy = await resMy.json();
      if (dataMy.success && Array.isArray(dataMy.complaints)) {
        setMyComplaints(dataMy.complaints);
      }

      // Fetch Complaints From Customers (target is worker)
      const resCust = await fetch(`/api/complaints?role=WORKER&actorId=${workerId}&filterType=COMPLAINTS_FROM_CUSTOMERS`);
      const dataCust = await resCust.json();
      if (dataCust.success && Array.isArray(dataCust.complaints)) {
        setCustomerComplaints(dataCust.complaints);
      }
    } catch (err) {
      console.error("Failed to load worker complaints:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Realtime subscription on complaints table with proper cleanup
  React.useEffect(() => {
    const supabase = createClient();
    const channelName = `worker-complaints-${currentWorkerId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaints",
        },
        () => {
          fetchComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkerId, fetchComplaints]);

  const activeList = activeTab === "MY_COMPLAINTS" ? myComplaints : customerComplaints;

  const filtered = activeList.filter((g) => {
    if (statusFilter !== "ALL" && g.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.complaintNumber.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        (g.targetName && g.targetName.toLowerCase().includes(q)) ||
        (g.raisedByName && g.raisedByName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingResponseCount = customerComplaints.filter(
    (c) => c.responseRequests?.workerRequired && !c.responseRequests?.workerSubmitted && c.status !== "REJECTED" && c.status !== "CLOSED"
  ).length;

  const getStatusBadge = (status: GrievanceLifecycleStatus) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs">Open</Badge>;
      case "UNDER_REVIEW":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-bold text-xs">Under Review</Badge>;
      case "ACTION_REQUIRED":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 font-bold text-xs">Response Requested</Badge>;
      case "RESOLVED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs">Resolved</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 font-bold text-xs">Rejected</Badge>;
      case "CLOSED":
        return <Badge className="bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs">Closed</Badge>;
      case "ESCALATED":
        return <Badge className="bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 font-bold text-xs">Escalated</Badge>;
      default:
        return <Badge className="font-bold text-xs">{status}</Badge>;
    }
  };

  const getPriorityBadge = (p: GrievancePriority) => {
    switch (p) {
      case "CRITICAL":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-extrabold">CRITICAL</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-[10px] font-bold">HIGH</Badge>;
      case "MEDIUM":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">MEDIUM</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 text-[10px]">LOW</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header with Subsection Tabs */}
      <WorkerComplaintsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        myComplaintsCount={myComplaints.length}
        customerComplaintsCount={customerComplaints.length}
        pendingResponseCount={pendingResponseCount}
      />

      {/* In Complaints From Customers, always show policy notice at top */}
      {activeTab === "COMPLAINTS_FROM_CUSTOMERS" && <WorkerPolicyNotice />}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder={
              activeTab === "MY_COMPLAINTS"
                ? "Search my complaints..."
                : "Search customer complaints..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ACTION_REQUIRED">Response Requested</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading complaints...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-3">
          <FolderOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {activeTab === "MY_COMPLAINTS"
              ? "No Complaints Raised Yet"
              : "No Customer Complaints on File"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "MY_COMPLAINTS"
              ? "You haven't filed any complaints about customer conduct, unpaid work, or safety conditions."
              : "You have no active or historical customer complaints recorded against your jobs."}
          </p>
          {activeTab === "MY_COMPLAINTS" && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => router.push("/worker/grievances/new")}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
              >
                Raise a Complaint
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const isCustomerComplaint = item.raisedByRole === "CUSTOMER";
            const responseRequested = item.responseRequests?.workerRequired && !item.responseRequests?.workerSubmitted;
            const responseSubmitted = item.responseRequests?.workerSubmitted;
            const isTerminal = item.status === "REJECTED" || item.status === "CLOSED";

            return (
              <Card
                key={item.id}
                className={`p-5 bg-white dark:bg-slate-900 border rounded-xl hover:shadow-md transition-shadow space-y-3.5 ${
                  responseRequested
                    ? "border-purple-300 dark:border-purple-800 ring-1 ring-purple-200 dark:ring-purple-900"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {item.complaintNumber}
                      </span>
                      {getStatusBadge(item.status)}
                      {getPriorityBadge(item.priority)}
                      {isCustomerComplaint && (
                        <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] font-semibold">
                          From Customer
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1">
                      {item.subject}
                    </h3>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => router.push(`/worker/grievances/${item.id}`)}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs gap-1"
                  >
                    View Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Booking Context Banner if linked */}
                {item.bookingContext && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Job: {item.bookingContext.serviceTitle || "Service Job"}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        (#{item.bookingContext.bookingNumber || item.bookingId})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Customer: <strong className="text-slate-700 dark:text-slate-300">{item.bookingContext.customerName || item.raisedByName}</strong>
                    </div>
                  </div>
                )}

                {/* Statement preview */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {isCustomerComplaint ? "Customer's Statement" : "Your Statement"}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Worker Response Status Banners for Customer Complaints */}
                {isCustomerComplaint && !isTerminal && (
                  <>
                    {responseRequested && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-purple-900 dark:text-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-bold flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
                            Waiting for Your Response — Federation requested your perspective.
                          </span>
                          {item.responseRequests?.prompt && (
                            <p className="text-[11px] text-purple-800 dark:text-purple-300 italic pl-5.5">
                              Prompt: &ldquo;{item.responseRequests.prompt}&rdquo;
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(item);
                            setResponseDialogOpen(true);
                          }}
                          className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shrink-0 self-start sm:self-auto"
                        >
                          Respond to Complaint
                        </Button>
                      </div>
                    )}

                    {responseSubmitted && (
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          Response Submitted — Your statement is recorded. Awaiting Federation Review.
                        </span>
                        {item.responseRequests?.workerSubmittedAt && (
                          <span className="text-[11px] text-blue-700 dark:text-blue-400 font-mono">
                            {new Date(item.responseRequests.workerSubmittedAt).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                    )}

                    {!responseRequested && !responseSubmitted && item.status !== "RESOLVED" && (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Under Federation Review — No action required from you at this time.</span>
                      </div>
                    )}
                  </>
                )}

                {/* Terminal Case Indicators */}
                {isTerminal && (
                  <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                    item.status === "REJECTED"
                      ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    {item.status === "REJECTED" ? (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <Archive className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span>
                      This complaint has been <strong>{item.status}</strong> by the Federation and is permanently closed.
                      {item.rejectionReason && ` Reason: "${item.rejectionReason}"`}
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Response Modal Dialog */}
      <WorkerResponseDialog
        complaint={selectedComplaint}
        open={responseDialogOpen}
        onOpenChange={setResponseDialogOpen}
        workerId={currentWorkerId}
        workerName={currentWorkerName}
        onSuccess={() => {
          fetchComplaints();
        }}
      />
    </div>
  );
}
