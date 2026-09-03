"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, ArrowRight, CheckCircle, Hourglass } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkerScheduleItem } from "../types";

export interface TodayScheduleCardProps {
  scheduleItems: WorkerScheduleItem[];
}

export function TodayScheduleCard({ scheduleItems }: TodayScheduleCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">
              Today&apos;s Schedule
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Sequential service itinerary for Ahmedabad city
            </p>
          </div>
        </div>

        <Link
          href="/worker/schedule?tab=schedule"
          className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center"
        >
          View Full Schedule
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
          {scheduleItems.map((item) => {
            const isConfirmed = item.status === "Confirmed";

            return (
              <div key={item.id} className="relative group">
                {/* Status Dot */}
                <div
                  className={`absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                    isConfirmed ? "bg-emerald-600" : "bg-amber-500"
                  }`}
                />

                <div className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        {item.time}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm font-semibold text-foreground">
                        {item.serviceTitle}
                      </span>
                    </div>

                    <Badge
                      variant={isConfirmed ? "success" : "warning"}
                      className="text-[10px] py-0 px-2 font-medium"
                    >
                      {isConfirmed ? (
                        <CheckCircle className="h-2.5 w-2.5 mr-1" />
                      ) : (
                        <Hourglass className="h-2.5 w-2.5 mr-1" />
                      )}
                      {item.status}
                    </Badge>
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground space-x-3 pt-0.5">
                    <span className="flex items-center truncate">
                      <MapPin className="h-3 w-3 mr-1 text-muted-foreground shrink-0" />
                      {item.customerArea}
                    </span>
                    <span className="flex items-center text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1 shrink-0" />
                      {item.estimatedDuration}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
