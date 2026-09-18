"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  ChevronRight,
  Shield,
  FileText,
  User,
  Briefcase,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { GrievanceCase, GrievanceLifecycleStatus, GrievancePriority } from "@/types/complaints/v2";

interface FederationComplaintsListProps {
  complaints: GrievanceCase[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function FederationComplaintsList({
  complaints,
  isLoading,
  onRefresh,
}: FederationComplaintsListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");
  const [federationFilter, setFederationFilter] = React.useState<string>("ALL");

  // Unique federations list for filter
  const federations = React.useMemo(() => {
    const map = new Map<string, string>();
    complaints.forEach((c) => {
      if (c.federationId) {
        map.set(c.federationId, c.federationName || "Regional Federation");
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [complaints]);

  // Client-side filtration over real authorized Super Admin dataset
  const filteredComplaints = React.useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && c.priority !== priorityFilter) return false;
      if (federationFilter !== "ALL" && c.federationId !== federationFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = c.complaintNumber?.toLowerCase().includes(q);
        const matchSubject = c.subject?.toLowerCase().includes(q);
        const matchDesc = c.description?.toLowerCase().includes(q);
        const matchComplainant = c.raisedByName?.toLowerCase().includes(q);
        const matchTarget = c.targetName?.toLowerCase().includes(q);
        const matchFed = c.federationName?.toLowerCase().includes(q);
        const matchBooking = c.bookingContext?.bookingNumber?.toLowerCase().includes(q);

        if (
          !matchNumber &&
          !matchSubject &&
          !matchDesc &&
          !matchComplainant &&
          !matchTarget &&
          !matchFed &&
          !matchBooking
        ) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, statusFilter, priorityFilter, federationFilter, searchQuery]);

  const getStatusBadge = (status: GrievanceLifecycleStatus) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">Open</Badge>;
      case "UNDER_REVIEW":
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">Under Review</Badge>;
      case "ACTION_REQUIRED":
        return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20">Action Required</Badge>;
      case "RESOLVED":
        return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">Resolved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "CLOSED":
        return <Badge variant="secondary">Closed</Badge>;
      case "ESCALATED":
        return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">Escalated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: GrievancePriority) => {
    switch (priority) {
      case "CRITICAL":
        return <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">Critical</Badge>;
      case "HIGH":
        return <Badge className="bg-amber-600 text-white text-[10px] uppercase font-bold tracking-wider">High</Badge>;
      case "MEDIUM":
        return <Badge variant="outline" className="text-muted-foreground text-[10px] uppercase">Medium</Badge>;
      case "LOW":
        return <Badge variant="secondary" className="text-[10px] uppercase">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <Card className="p-3 border-border/40 shadow-sm bg-card/60 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tracking #, subject, federation, complainant, or booking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              aria-label="Filter by lifecycle status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 py-1 text-xs rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACTION_REQUIRED">Action Required</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLOSED">Closed</option>
              <option value="ESCALATED">Escalated</option>
            </select>

            {/* Priority Filter */}
            <select
              aria-label="Filter by priority level"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 px-2.5 py-1 text-xs rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Federation Filter */}
            <select
              aria-label="Filter by cooperative federation"
              value={federationFilter}
              onChange={(e) => setFederationFilter(e.target.value)}
              className="h-9 px-2.5 py-1 text-xs rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring max-w-[200px]"
            >
              <option value="ALL">All Federations</option>
              {federations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            {(statusFilter !== "ALL" || priorityFilter !== "ALL" || federationFilter !== "ALL" || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("ALL");
                  setPriorityFilter("ALL");
                  setFederationFilter("ALL");
                  setSearchQuery("");
                }}
                className="text-xs h-9 text-muted-foreground hover:text-foreground"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Complaints List / Table */}
      {filteredComplaints.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/60 bg-muted/20">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Federation Complaints Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            {searchQuery || statusFilter !== "ALL" || priorityFilter !== "ALL" || federationFilter !== "ALL"
              ? "No federation-originated complaints match your current filter parameters."
              : "There are currently no complaints submitted by Federation Administrators requiring Super Admin action."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map((c) => (
            <Card
              key={c.id}
              className="p-4 border-border/40 hover:border-border transition-all shadow-sm hover:shadow-md bg-card"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  {/* Top Bar: Tracking #, Federation, Category, Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                      {c.complaintNumber}
                    </span>
                    {c.raisedByRole === "FEDERATION_ADMIN" && (
                      <Badge className="bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-[11px] font-bold">
                        Federation Complaint
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[11px] font-medium flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                      {c.federationName || "Regional Federation"}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                      {c.category}
                    </Badge>
                    {getPriorityBadge(c.priority)}
                    {getStatusBadge(c.status)}
                    {(c.status === "ESCALATED" || c.escalation?.isEscalated) && (
                      <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-[10px] font-semibold">
                        Escalated to Central
                      </Badge>
                    )}
                  </div>

                  {/* Subject & Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{c.subject}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.description}</p>
                  </div>

                  {/* Context Info: Complainant, Target, Booking, Timestamps */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t border-border/40">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-indigo-500" />
                      <span>
                        Complainant: <strong className="text-foreground">{c.raisedByName}</strong> ({c.raisedByRole === "FEDERATION_ADMIN" ? "Federation Admin" : c.raisedByRole})
                      </span>
                    </div>

                    {c.targetName && (
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        <span>
                          Target: <strong className="text-foreground">{c.targetName}</strong>
                          {c.targetRole ? ` (${c.targetRole})` : ""}
                        </span>
                      </div>
                    )}

                    {c.bookingContext?.bookingNumber && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                          Job: <strong className="text-foreground">{c.bookingContext.bookingNumber}</strong>
                          {c.bookingContext.serviceTitle ? ` (${c.bookingContext.serviceTitle})` : ""}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Logged: {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {c.updatedAt && c.updatedAt !== c.createdAt && (
                        <span className="text-muted-foreground/80">
                          · Updated: {new Date(c.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center justify-end lg:pl-4">
                  <Link href={`/super-admin/complaints/${c.id}`}>
                    <Button size="sm" variant="outline" className="h-9 text-xs font-semibold group">
                      <span>Review Workspace</span>
                      <ChevronRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
