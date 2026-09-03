"use client";

import * as React from "react";
import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface UpcomingBookingData {
  id: string;
  bookingNumber: string;
  serviceTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  addressText: string;
  estimatedAmount: number;
}

export interface UpcomingBookingCardProps {
  bookings?: UpcomingBookingData[];
  onViewAll?: () => void;
}

export function UpcomingBookingCard({
  bookings = [],
  onViewAll,
}: UpcomingBookingCardProps) {
  if (bookings.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 p-5 text-center shadow-sm rounded-xl">
        <Calendar className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-xs">No Upcoming Bookings</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          You don&apos;t have any scheduled appointments for later.
        </p>
      </Card>
    );
  }

  const firstBooking = bookings[0];

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Scheduled Appointment
          </CardTitle>
        </div>
        <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 font-semibold">
          CONFIRMED
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{firstBooking.serviceTitle}</h4>
            <span className="text-[11px] text-slate-500 font-mono">{firstBooking.bookingNumber}</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">₹{firstBooking.estimatedAmount}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{firstBooking.scheduledDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{firstBooking.scheduledTime}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[200px]">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{firstBooking.addressText}</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 p-0 h-auto gap-1 font-medium"
            onClick={onViewAll}
          >
            View All ({bookings.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
