"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldAlert, Users, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkerComplaintSubsection } from "../types";

interface WorkerComplaintsHeaderProps {
  activeTab: WorkerComplaintSubsection;
  onTabChange: (tab: WorkerComplaintSubsection) => void;
  myComplaintsCount: number;
  customerComplaintsCount: number;
  pendingResponseCount: number;
}

export function WorkerComplaintsHeader({
  activeTab,
  onTabChange,
  myComplaintsCount,
  customerComplaintsCount,
  pendingResponseCount,
}: WorkerComplaintsHeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            Worker Complaint Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage issues you have reported regarding service jobs, and review or respond to customer inquiries.
          </p>
        </div>

        <Button
          onClick={() => router.push("/worker/grievances/new")}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Raise New Complaint
        </Button>
      </div>

      {/* Dual Subsection Tabs */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => onTabChange("MY_COMPLAINTS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "MY_COMPLAINTS"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span>My Complaints</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 h-4 ${
              activeTab === "MY_COMPLAINTS"
                ? "bg-white/20 text-white dark:bg-black/20 dark:text-slate-900"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {myComplaintsCount}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("COMPLAINTS_FROM_CUSTOMERS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
            activeTab === "COMPLAINTS_FROM_CUSTOMERS"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Complaints From Customers</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 h-4 ${
              activeTab === "COMPLAINTS_FROM_CUSTOMERS"
                ? "bg-white/20 text-white dark:bg-black/20 dark:text-slate-900"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {customerComplaintsCount}
          </Badge>

          {pendingResponseCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-purple-700 dark:text-purple-300 font-extrabold bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-full animate-pulse border border-purple-300 dark:border-purple-800">
              <MessageSquareWarning className="w-3 h-3" />
              {pendingResponseCount} Action Required
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
