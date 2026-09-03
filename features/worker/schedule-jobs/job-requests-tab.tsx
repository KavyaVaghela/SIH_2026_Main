"use client";

import * as React from "react";
import { Search, Filter, AlertCircle, RefreshCw, PlusCircle, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobRequestCard } from "./components/job-request-card";
import { workerJobService } from "../services/worker-job-service";
import type { WorkerJobItem, JobRequestFilterOption } from "../types";

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
  const [isCreatingTest, setIsCreatingTest] = React.useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = React.useState<string | null>(null);

  // Stage counts
  const newCount = requests.filter((r) => r.status === "REQUEST_SENT").length;
  const reviewingCount = requests.filter((r) => r.status === "WORKER_REVIEWING").length;
  const interestedCount = requests.filter(
    (r) => r.status === "WORKER_INTERESTED" || r.status === "CUSTOMER_CONFIRMATION_PENDING"
  ).length;

  const filteredRequests = React.useMemo(() => {
    return requests.filter((req) => {
      // Stage filters (Part 11)
      if (filterOption === "NEW" && req.status !== "REQUEST_SENT") {
        return false;
      }
      if (filterOption === "REVIEWING" && req.status !== "WORKER_REVIEWING") {
        return false;
      }
      if (
        filterOption === "INTERESTED" &&
        req.status !== "WORKER_INTERESTED" &&
        req.status !== "CUSTOMER_CONFIRMATION_PENDING"
      ) {
        return false;
      }

      // Attribute filters
      if (filterOption === "TODAY") {
        const isToday =
          req.scheduledDate.toLowerCase().includes("today") ||
          req.scheduledStartAt.toLowerCase().includes("today");
        if (!isToday) return false;
      }
      if (filterOption === "EMERGENCY" && req.urgency !== "EMERGENCY") {
        return false;
      }
      if (
        filterOption === "PLUMBING" &&
        !req.serviceTitle.toLowerCase().includes("plumb") &&
        !req.categoryName.toLowerCase().includes("plumb") &&
        !req.serviceTitle.toLowerCase().includes("pipe") &&
        !req.serviceTitle.toLowerCase().includes("tap")
      ) {
        return false;
      }
      if (
        filterOption === "ELECTRICAL" &&
        !req.serviceTitle.toLowerCase().includes("electr") &&
        !req.categoryName.toLowerCase().includes("electr")
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = req.serviceTitle.toLowerCase().includes(q);
        const matchesCustomer = req.customerName.toLowerCase().includes(q);
        const matchesLocation = req.customerArea.toLowerCase().includes(q);
        const matchesProblem = req.problemDescription.toLowerCase().includes(q);
        const matchesRef = req.bookingNumber.toLowerCase().includes(q);
        return matchesTitle || matchesCustomer || matchesLocation || matchesProblem || matchesRef;
      }

      return true;
    });
  }, [requests, filterOption, searchQuery]);

  // Development simulation helper (Part 10)
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
      {/* Cooperative Dispatch Notice & Dev Test Utility */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-700/30 text-xs text-muted-foreground gap-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Cooperative Dispatch Queue:</strong> Incoming customer requests awaiting review, quotation, and confirmation.
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Part 10: Development-Only Test Simulation */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateTestRequest}
            disabled={isCreatingTest}
            className="h-7 text-xs border-dashed border-emerald-600/50 hover:bg-emerald-100/50 text-emerald-800 dark:text-emerald-300"
            title="Development test simulation: Creates a real customer request in the database"
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

      {/* Test Creation Feedback */}
      {testSuccessMessage && (
        <div className="p-3 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-600 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
          <span>✓ {testSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setTestSuccessMessage(null)}
            className="text-xs font-bold hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Part 11: Stage Categorization Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setFilterOption("ALL")}
          className={`p-3 rounded-lg border text-left transition-all ${
            filterOption === "ALL"
              ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm"
              : "bg-card hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">All Requests</span>
            <Badge variant="outline" className="text-[10px]">{requests.length}</Badge>
          </div>
          <span className="text-base font-bold text-foreground block mt-1">{requests.length} Total</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterOption("NEW")}
          className={`p-3 rounded-lg border text-left transition-all ${
            filterOption === "NEW"
              ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm"
              : "bg-card hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">New Requests</span>
            <Badge variant="outline" className="text-[10px] border-emerald-600/40 text-emerald-700">{newCount}</Badge>
          </div>
          <span className="text-base font-bold text-foreground block mt-1">{newCount} New</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterOption("REVIEWING")}
          className={`p-3 rounded-lg border text-left transition-all ${
            filterOption === "REVIEWING"
              ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm"
              : "bg-card hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Under Review</span>
            <Badge variant="warning" className="text-[10px]">{reviewingCount}</Badge>
          </div>
          <span className="text-base font-bold text-foreground block mt-1">{reviewingCount} Reviewing</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterOption("INTERESTED")}
          className={`p-3 rounded-lg border text-left transition-all ${
            filterOption === "INTERESTED"
              ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm"
              : "bg-card hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Interest Sent</span>
            <Badge variant="success" className="text-[10px]">{interestedCount}</Badge>
          </div>
          <span className="text-base font-bold text-foreground block mt-1">{interestedCount} Sent</span>
        </button>
      </div>

      {/* Search & Topic Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 rounded-lg border bg-card">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by service, customer, or locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center">
            <Filter className="h-3 w-3 mr-1" /> Attribute:
          </span>

          {[
            { id: "TODAY", label: "Today" },
            { id: "EMERGENCY", label: "Emergency" },
            { id: "PLUMBING", label: "Plumbing" },
            { id: "ELECTRICAL", label: "Electrical" },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() =>
                setFilterOption(filterOption === btn.id ? "ALL" : (btn.id as JobRequestFilterOption))
              }
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filterOption === btn.id
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center text-muted-foreground space-y-2 border-dashed">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600" />
          <p className="text-sm font-medium">Loading your job requests...</p>
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

      {/* Empty State */}
      {!loading && !error && filteredRequests.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground space-y-2 border-dashed">
          <p className="text-sm font-medium text-foreground">
            {searchQuery.trim() || filterOption !== "ALL"
              ? "No job requests matching your filters."
              : "No new job requests right now."}
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            New requests submitted by households in your cooperative territory will appear here automatically.
          </p>
        </Card>
      )}

      {/* Job Requests List */}
      {!loading && !error && filteredRequests.length > 0 && (
        <div className="space-y-3.5">
          {filteredRequests.map((req) => (
            <JobRequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}
