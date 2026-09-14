"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronRight,
  Search,
  FolderOpen,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { GrievanceCase, GrievanceLifecycleStatus, GrievancePriority } from "@/types/complaints/v2";

export default function WorkerGrievancesPage() {
  const router = useRouter();
  const [grievances, setGrievances] = React.useState<GrievanceCase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  const fetchGrievances = React.useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const workerId = user?.id || "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";

      const res = await fetch(`/api/complaints?role=WORKER&actorId=${workerId}`);
      const data = await res.json();
      if (data.success && data.complaints) {
        setGrievances(data.complaints);
      }
    } catch (err) {
      console.error("Failed to load worker grievances:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  const filtered = grievances.filter((g) => {
    if (statusFilter !== "ALL" && g.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.complaintNumber.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: GrievanceLifecycleStatus) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs">Open</Badge>;
      case "UNDER_REVIEW":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-bold text-xs">Under Review</Badge>;
      case "ACTION_REQUIRED":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 font-bold text-xs">Statement Required</Badge>;
      case "RESOLVED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs">Resolved</Badge>;
      case "CLOSED":
        return <Badge className="bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs">Closed</Badge>;
      case "ESCALATED":
        return <Badge className="bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 font-bold text-xs">State Review</Badge>;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            My Cooperative Grievances
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Report workplace concerns, unfair reviews, or payment disputes, and submit responses to federation conciliation inquiries.
          </p>
        </div>

        <Button
          onClick={() => router.push("/worker/grievances/new")}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Raise Grievance
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search grievance records..."
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
            <option value="ACTION_REQUIRED">Action Required</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Grievances List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading worker grievances...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-3">
          <FolderOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">No Grievances on File</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have no active disputes or pending statements. The federation grievance system protects worker safety, fair remuneration, and review integrity.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => router.push("/worker/grievances/new")}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
            >
              Raise a Grievance
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/worker/guidance?q=grievance")}
              className="text-xs font-medium"
            >
              Worker Rights Guide
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {item.complaintNumber}
                    </span>
                    {getStatusBadge(item.status)}
                    {getPriorityBadge(item.priority)}
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
                  Open Case File
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Category</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.category}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Involved Party</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.targetName || item.raisedByName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Date</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                {item.description}
              </p>

              {item.status === "ACTION_REQUIRED" && (
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    Federation officer requested your statement.
                  </span>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/worker/grievances/${item.id}`)}
                    className="bg-purple-700 hover:bg-purple-800 text-white text-[11px] h-7 font-bold"
                  >
                    Submit Statement
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
