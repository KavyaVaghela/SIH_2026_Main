"use client";

import * as React from "react";
import {
  ChevronRight,
  ArrowLeft,
  Pencil,
  MapPin,
  Calendar,
  Clock,
  Receipt,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceBookingDraft, BookingFlowStep } from "../types";

export interface StepReviewProps {
  draft: ServiceBookingDraft;
  onEditStep: (step: BookingFlowStep) => void;
  onProceedToMatching: () => void;
  onBack: () => void;
}

export function StepReview({
  draft,
  onEditStep,
  onProceedToMatching,
  onBack,
}: StepReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-600 text-white text-xs px-2.5 py-0.5">
            STEP 7 OF 7
          </Badge>
          <span className="text-xs text-slate-500 font-medium">Final Verification</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
          Review Service Booking Requirement
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Please verify your service details before we search for verified cooperative workers nearby
        </p>
      </div>

      <div className="space-y-4">
        {/* 1. Selected Service & Work Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                1 & 2. Service Trade & Work
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {draft.service?.title || "Not selected"}
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                Category: {draft.category?.name}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditStep(1)}
              className="text-xs h-8 border-slate-300 gap-1 text-slate-700"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 font-normal">
            {draft.service?.description}
          </p>
        </Card>

        {/* 2. Problem Description & Photo Preview Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                3. Problem Description & Photos
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditStep(3)}
              className="text-xs h-8 border-slate-300 gap-1 text-slate-700"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          </div>

          <div className="pt-3 space-y-3">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200/80">
              &quot;{draft.description}&quot;
            </p>

            {draft.photoUrl && (
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200/80">
                {/* eslint-disable-next-html-element-attribute */}
                {/* eslint-disable-next-html-element-content-type */}
                <img
                  src={draft.photoUrl}
                  alt="Requirement attachment"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Photo attached
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    Available for matched worker inspection
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 3. Platform Estimate Breakdown Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                4. Platform Price Estimate
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditStep(4)}
              className="text-xs h-8 border-slate-300 gap-1 text-slate-700"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          </div>

          <div className="pt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Minimum Service Visit Charge:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">₹{draft.estimate?.minimumVisitCharge}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Platform & GST Tax Breakdown:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">₹{((draft.estimate?.platformFee || 0) + (draft.estimate?.taxAmount || 0)).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 font-bold text-sm text-emerald-800 dark:text-emerald-300">
              <span>Estimated Price Range:</span>
              <span className="text-base">₹{Math.round(draft.estimate?.estimatedTotal || 0)}</span>
            </div>
          </div>
        </Card>

        {/* 4. Address & Date/Time Slot Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Address Summary */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  5. Service Location
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditStep(5)}
                className="text-xs h-7 border-slate-300 gap-1 text-slate-700"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </Button>
            </div>

            <div className="pt-2 text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold mb-1">
                {draft.address?.title}
              </Badge>
              <p className="font-bold text-slate-900 dark:text-slate-100">{draft.address?.addressLine1}</p>
              {draft.address?.addressLine2 && <p className="text-slate-500">{draft.address?.addressLine2}</p>}
              <p className="text-slate-500">{draft.address?.city}, {draft.address?.state} - {draft.address?.postalCode}</p>
            </div>
          </Card>

          {/* Schedule Summary */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  6. Preferred Schedule
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditStep(6)}
                className="text-xs h-7 border-slate-300 gap-1 text-slate-700"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </Button>
            </div>

            <div className="pt-2 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Date: {draft.preferredDate}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Time Slot: {draft.preferredTimeSlot}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Trust Box & Primary CTA */}
      <Card className="bg-emerald-900 text-white p-5 rounded-xl shadow-md space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Ready to Search Cooperative Worker Pool</h4>
            <p className="text-xs text-emerald-200 mt-0.5">
              By continuing, your requirement will be matched against verified local trade worker availability in Ahmedabad.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-emerald-800">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-xs text-slate-200 hover:text-white hover:bg-emerald-800">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Schedule
          </Button>

          <Button
            onClick={onProceedToMatching}
            className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs px-6 py-2.5 shadow-lg gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            Continue to Find Workers
            <ChevronRight className="w-4 h-4 text-emerald-700" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
