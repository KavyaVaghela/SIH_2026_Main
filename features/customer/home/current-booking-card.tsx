"use client";

import * as React from "react";
import { Clock, ShieldCheck, Phone, MapPin, User, ChevronRight, KeyRound } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface CurrentBookingData {
  id: string;
  bookingNumber: string;
  serviceTitle: string;
  categoryName: string;
  workerName: string;
  workerPhone: string;
  cooperativeName: string;
  statusDisplay: string;
  statusCode: string;
  scheduledTime: string;
  addressText: string;
  otpCode: string;
  totalAmount: number;
}

export interface CurrentBookingCardProps {
  booking?: CurrentBookingData | null;
  onViewDetails?: (bookingId: string) => void;
}

export function CurrentBookingCard({
  booking,
  onViewDetails,
}: CurrentBookingCardProps) {
  if (!booking) {
    return (
      <Card className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center shadow-sm rounded-xl">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Active Booking in Progress</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          You don&apos;t have an ongoing service job right now. Select a service category above to book a professional.
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden rounded-xl">
      {/* Top Status Accent Line */}
      <div className="h-1 bg-emerald-600" />

      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
              ONGOING BOOKING
            </Badge>
            <span className="text-xs text-slate-500 font-mono font-medium">{booking.bookingNumber}</span>
          </div>
          <CardTitle className="text-base text-slate-900 dark:text-slate-100 font-bold mt-1.5">
            {booking.serviceTitle}
          </CardTitle>
        </div>

        <Badge className="bg-emerald-600 text-white text-xs px-2.5 py-1 font-semibold">
          {booking.statusDisplay}
        </Badge>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Worker & Cooperative Row */}
        <div className="flex items-start justify-between bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {booking.workerName}
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                {booking.cooperativeName}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs gap-1.5"
            onClick={() => window.open(`tel:${booking.workerPhone}`)}
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Call Worker
          </Button>
        </div>

        {/* Address & Scheduled Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{booking.addressText}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{booking.scheduledTime}</span>
          </div>
        </div>

        {/* Service Start OTP Box */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-medium">
            <KeyRound className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Share Service Start OTP with worker:</span>
          </div>
          <span className="font-mono font-extrabold text-base tracking-wider text-emerald-800 dark:text-emerald-300 bg-white dark:bg-emerald-900/60 px-3 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 shadow-xs">
            {booking.otpCode}
          </span>
        </div>

        {/* Footer Billing & Details CTA */}
        <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs">
            <span className="text-slate-500">Estimated Total: </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">₹{booking.totalAmount}</span>
          </div>

          <Button
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1 font-semibold"
            onClick={() => onViewDetails?.(booking.id)}
          >
            Track Status
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
