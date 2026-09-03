"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox, ArrowRight, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/formatters/currency";
import type { WorkerJobRequest } from "../types";

export interface NewJobRequestsCardProps {
  requests: WorkerJobRequest[];
}

export function NewJobRequestsCard({ requests }: NewJobRequestsCardProps) {
  const count = requests.length;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <Inbox className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">
              {count} New Job Requests
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Direct cooperative member allocations awaiting your review
            </p>
          </div>
        </div>

        <Link href="/worker/schedule?tab=requests">
          <Button size="sm" className="hidden sm:inline-flex bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs">
            View Requests
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors gap-3"
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-sm text-foreground truncate">
                  {req.serviceTitle}
                </span>
                {req.urgency === "EMERGENCY" ? (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-medium">
                    <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                    Emergency
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Standard
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1 text-primary shrink-0" />
                  {req.customerArea}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-primary shrink-0" />
                  {req.timeSlot || req.scheduledTime}
                </span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 shrink-0">
              <span className="text-xs text-muted-foreground sm:text-[11px]">Est. Payout</span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                {formatINR(req.estimatedPayout || req.totalAmount)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>

      <CardFooter className="p-4 pt-0 sm:hidden">
        <Link href="/worker/schedule?tab=requests" className="w-full">
          <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs">
            View Requests ({count})
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
