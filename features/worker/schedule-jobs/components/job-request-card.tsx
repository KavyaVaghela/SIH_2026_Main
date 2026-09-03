"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wrench,
  Zap,
  Droplet,
  MapPin,
  Calendar,
  Clock,
  User,
  ArrowRight,
  AlertTriangle,
  Navigation,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/formatters/currency";
import type { WorkerJobItem } from "../../types";

export interface JobRequestCardProps {
  request: WorkerJobItem;
}

export function JobRequestCard({ request }: JobRequestCardProps) {
  const getServiceIcon = (title: string, category: string) => {
    const text = `${title} ${category}`.toLowerCase();
    if (text.includes("electric") || text.includes("wiring") || text.includes("mcb")) {
      return Zap;
    }
    if (text.includes("drain") || text.includes("tank") || text.includes("leak")) {
      return Droplet;
    }
    return Wrench;
  };

  const ServiceIcon = getServiceIcon(request.serviceTitle, request.categoryName);

  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b pb-3 flex flex-row items-start justify-between space-y-0 bg-muted/10">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800/40 shrink-0">
            <ServiceIcon className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                {request.serviceTitle}
              </CardTitle>
              {request.urgency === "EMERGENCY" ? (
                <Badge variant="destructive" className="text-[10px] py-0 px-2 font-semibold">
                  <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                  EMERGENCY
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] py-0 px-2">
                  STANDARD
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="flex items-center font-medium text-foreground">
                <User className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                Customer: <strong className="ml-1">{request.customerName}</strong>
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">{request.bookingNumber}</span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs text-muted-foreground block">Platform Estimate</span>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            {formatINR(request.totalAmount)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3">
        <p className="text-xs sm:text-sm text-foreground/90 line-clamp-2 leading-relaxed">
          {request.problemDescription}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-emerald-600 shrink-0" />
            <span className="truncate">{request.customerArea}</span>
          </div>

          <div className="flex items-center">
            <Navigation className="h-3.5 w-3.5 mr-1.5 text-blue-600 shrink-0" />
            <span>{request.distanceKm} km away</span>
          </div>

          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-amber-600 shrink-0" />
            <span>{request.scheduledDate}</span>
          </div>

          <div className="flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1.5 text-teal-600 shrink-0" />
            <span>{request.scheduledTime}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 sm:p-5 border-t bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Request Status:</span>
          {request.workerEstimateAmount ? (
            <Badge variant="outline" className="border-emerald-600/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              Estimate: {formatINR(request.workerEstimateAmount)}
            </Badge>
          ) : (
            <>
              {request.status === "REQUEST_SENT" && (
                <Badge variant="outline" className="border-emerald-600/40 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-bold">
                  New Request
                </Badge>
              )}
              {request.status === "WORKER_REVIEWING" && (
                <Badge variant="warning" className="text-xs font-bold">
                  Under Review
                </Badge>
              )}
              {(request.status === "WORKER_INTERESTED" || request.status === "CUSTOMER_CONFIRMATION_PENDING") && (
                <Badge variant="success" className="text-xs font-bold">
                  Interest Sent
                </Badge>
              )}
              {request.status !== "REQUEST_SENT" &&
                request.status !== "WORKER_REVIEWING" &&
                request.status !== "WORKER_INTERESTED" &&
                request.status !== "CUSTOMER_CONFIRMATION_PENDING" && (
                  <Badge variant="secondary" className="text-xs font-bold">
                    {request.status}
                  </Badge>
                )}
            </>
          )}
        </div>

        <Link href={`/worker/jobs/requests/${request.id}`} className="w-full sm:w-auto">
          <Button size="sm" className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4">
            {request.status === "REQUEST_SENT"
              ? "Review Request"
              : request.workerEstimateAmount
              ? "View Estimate"
              : "View Request"}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
