"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  Wallet,
  UserPlus,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecentActivityItem } from "../types";

interface RecentActivityCardProps {
  activities: RecentActivityItem[];
  isLoading?: boolean;
  className?: string;
}

function getActivityIcon(type: RecentActivityItem["type"]) {
  switch (type) {
    case "JOB_COMPLETED":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "WORKER_ACCEPTED":
      return <UserCheck className="h-4 w-4 text-amber-600" />;
    case "COMPLAINT_ALERT":
      return <AlertTriangle className="h-4 w-4 text-rose-600 animate-pulse" />;
    case "PAYMENT_RECEIVED":
      return <Wallet className="h-4 w-4 text-emerald-600" />;
    case "NEW_WORKER_REGISTERED":
      return <UserPlus className="h-4 w-4 text-blue-600" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
}

export function RecentActivityCard({ activities, isLoading, className }: RecentActivityCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <Activity className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-foreground">
              Recent Operational Activity
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time events, worker dispatches, and grievance triage notifications.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
          <Clock className="h-3 w-3 mr-1 text-emerald-600" /> Live Feed
        </Badge>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No recent operational events recorded for the selected timeframe.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-muted/60 shrink-0 mt-0.5">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        • {item.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.href && (
                  <Link
                    href={item.href}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center shrink-0 self-end sm:self-center hover:underline cursor-pointer"
                  >
                    View Details <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
