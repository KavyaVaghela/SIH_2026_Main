"use client";

import * as React from "react";
import { LifeBuoy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AssistanceStats, WorkerAssistanceItem } from "../types";

export interface WorkerAssistancePanelProps {
  stats: AssistanceStats;
  requests: WorkerAssistanceItem[];
  onRequestClick: (req: WorkerAssistanceItem) => void;
  onViewAll?: () => void;
}

function getAssistanceBadge(status: string) {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300/60";
    case "Under Review":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300/60";
    case "Approved":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300/60";
    case "Resolved":
      return "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300/60";
    case "Rejected":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300/60";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300";
  }
}

export function WorkerAssistancePanel({
  stats,
  requests,
  onRequestClick,
  onViewAll,
}: WorkerAssistancePanelProps) {
  return (
    <Card className="border border-border/80 shadow-sm flex flex-col justify-between h-full min-w-0 max-w-full overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-emerald-600 shrink-0" />
              <CardTitle className="text-base font-bold text-foreground truncate">
                Worker Assistance
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitor welfare requests and ensure timely resolution.
            </p>
          </div>

          <Button
            onClick={onViewAll}
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 px-2 font-medium shrink-0"
          >
            View All &rarr;
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 min-w-0 max-w-full">
        {/* Stat Summary Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40 text-center min-w-0">
            <div className="text-base font-bold text-amber-700 dark:text-amber-400">{stats.pending}</div>
            <div className="text-[10px] font-semibold text-muted-foreground truncate">Pending Requests</div>
          </div>

          <div className="p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/40 text-center min-w-0">
            <div className="text-base font-bold text-blue-700 dark:text-blue-400">{stats.underReview}</div>
            <div className="text-[10px] font-semibold text-muted-foreground truncate">Under Review</div>
          </div>

          <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/40 text-center min-w-0">
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">{stats.approved}</div>
            <div className="text-[10px] font-semibold text-muted-foreground truncate">Approved</div>
          </div>

          <div className="p-2 rounded-lg bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-900/40 text-center min-w-0">
            <div className="text-base font-bold text-purple-700 dark:text-purple-400">{stats.resolved}</div>
            <div className="text-[10px] font-semibold text-muted-foreground truncate">Resolved</div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/60">
              <tr>
                <th className="py-2 px-3 font-semibold">Worker</th>
                <th className="py-2 px-3 font-semibold">Federation</th>
                <th className="py-2 px-3 font-semibold">Request Type</th>
                <th className="py-2 px-3 font-semibold">Submitted</th>
                <th className="py-2 px-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground">
              {requests.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRequestClick(item)}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {item.workerInitials}
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                        {item.workerName}
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-muted-foreground font-medium truncate max-w-[120px]">
                    {item.federationName}
                  </td>

                  <td className="py-2.5 px-3 text-foreground font-semibold">
                    {item.requestType}
                  </td>

                  <td className="py-2.5 px-3 text-muted-foreground">
                    {item.submittedAt}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getAssistanceBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
