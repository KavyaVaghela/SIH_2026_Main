"use client";

import React from "react";
import { Sparkles, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck, Tag, Eye, AlertTriangle, HelpCircle, ShieldAlert } from "lucide-react";
import { AnalysisResult } from "@/types/smartserve";

interface AnalysisResultCardProps {
  result: AnalysisResult;
  onViewService: (category: string) => void;
  onReset: () => void;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
  result,
  onViewService,
  onReset,
}) => {
  const isUnsupported = result.category === "Unsupported" || result.confidence === 0;

  // Render Unsupported / Invalid Prompt View
  if (isUnsupported) {
    return (
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300 bg-amber-50/70 p-6 sm:p-8 shadow-sm transition-all animate-fade-in">
        <div className="flex items-center gap-3 border-b border-amber-200 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-950">
              No Household Service Detected
            </h3>
            <p className="text-xs font-medium text-amber-800">
              Please enter a valid household problem (e.g., pipe leak, broken fan, AC issue, laptop repair)
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-white p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              AI Diagnostic Feedback
            </h4>
            <p className="mt-1.5 text-sm font-medium text-amber-900 leading-relaxed">
              “{result.explanation}”
            </p>
          </div>

          {result.followUpQuestion && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-100/60 p-3 text-xs font-semibold text-amber-900 border border-amber-200">
              <HelpCircle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>{result.followUpQuestion}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 rounded-xl bg-amber-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-950 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Describing Household Problem</span>
          </button>
        </div>
      </div>
    );
  }

  // Render Hazardous Safety Alert View if fire/gas leak/live wire reported
  if (result.isHazardous) {
    return (
      <div className="relative overflow-hidden rounded-3xl border-2 border-red-500 bg-red-50 p-6 sm:p-8 shadow-md transition-all animate-fade-in">
        <div className="flex items-center gap-3 border-b border-red-200 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                High Safety Hazard
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-red-950 mt-0.5">
              Critical Emergency Hazard Warning
            </h3>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-red-200 bg-white p-4">
          <p className="text-sm font-semibold text-red-900 leading-relaxed">
            {result.explanation}
          </p>
          {result.followUpQuestion && (
            <p className="mt-3 text-xs font-bold text-red-800 pt-2 border-t border-red-100">
              {result.followUpQuestion}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-xs font-bold text-red-900 hover:bg-red-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Back to Safety Assistant</span>
          </button>

          <a
            href="tel:108"
            className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Call Emergency Services (108 / 101)</span>
          </a>
        </div>
      </div>
    );
  }

  // Standard Valid Result View
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#075E43]/40 bg-[#E8F8F2] p-6 sm:p-8 shadow-md transition-all animate-fade-in">
      
      {/* Decorative Top Accent Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#075E43] via-[#0B8F68] to-[#075E43]" />

      {/* Top Header Label & Confidence Meter & Urgency Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#075E43]/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-[#075E43]/40 bg-white px-3 py-1 text-xs font-bold text-[#17233C] shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#075E43]" />
            <span>AI Recommendation</span>
          </div>

          {result.urgency && (
            <div className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
              result.urgency.toLowerCase() === "high"
                ? "bg-red-50 text-red-700 border-red-200"
                : result.urgency.toLowerCase() === "low"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}>
              <AlertTriangle className="h-3 w-3" />
              <span>Urgency: {result.urgency}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#17233C]">Confidence Score:</span>
          <div className="flex items-center gap-1.5 rounded-full border border-[#075E43]/40 bg-white px-3 py-0.5 text-xs font-extrabold text-[#17233C]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>{result.confidence}%</span>
          </div>
        </div>
      </div>

      {/* Recommendation Key Details */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {/* Recommended Category */}
        <div className="rounded-2xl border-2 border-[#075E43]/30 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5F718A]">
            <Tag className="h-3.5 w-3.5 text-[#075E43]" />
            <span>Category</span>
          </div>
          <p className="mt-1 text-xl font-extrabold text-[#17233C]">
            {result.category}
          </p>
        </div>

        {/* Recommended Specific Service */}
        <div className="rounded-2xl border-2 border-[#075E43]/30 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5F718A]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#075E43]" />
            <span>Recommended Service</span>
          </div>
          <p className="mt-1 text-xl font-extrabold text-[#17233C]">
            {result.service}
          </p>
        </div>
      </div>

      {/* AI Explanation & Follow Up Question Box */}
      <div className="mt-6 rounded-2xl border-2 border-[#075E43]/30 bg-white/90 p-4 space-y-3">
        <div>
          <h4 className="text-xs font-bold text-[#17233C] uppercase tracking-wider">
            AI Analysis & Reasoning
          </h4>
          <p className="mt-2 text-sm font-medium text-[#17233C] leading-relaxed">
            “{result.explanation}”
          </p>
        </div>

        {result.followUpQuestion && (
          <div className="flex items-start gap-2 rounded-xl bg-[#E8F8F2] p-3 text-xs font-medium text-[#17233C] border border-[#075E43]/30">
            <HelpCircle className="h-4 w-4 text-[#075E43] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-[11px] uppercase tracking-wider text-[#5F718A]">AI Clarifying Question:</span>
              <p className="mt-0.5">{result.followUpQuestion}</p>
            </div>
          </div>
        )}

        {result.visualAnalysis && (
          <div className="flex items-center gap-2 rounded-xl bg-[#E8F8F2] p-2.5 text-xs font-medium text-[#17233C] border border-[#075E43]/30">
            <Eye className="h-4 w-4 text-[#075E43] shrink-0" />
            <span>{result.visualAnalysis}</span>
          </div>
        )}

        {result.estimatedPriceRange && (
          <div className="flex items-center justify-between text-xs font-bold text-[#17233C] pt-2 border-t border-[#075E43]/20">
            <span>Cooperative Fixed Price Range:</span>
            <span className="text-[#075E43]">{result.estimatedPriceRange}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 rounded-xl border-2 border-[#075E43]/40 bg-white px-4 py-2.5 text-xs font-bold text-[#17233C] hover:bg-[#E8F8F2] transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#075E43]" />
          <span>Analyze Another Problem</span>
        </button>

        <button
          type="button"
          onClick={() => onViewService(result.category)}
          className="flex items-center gap-2 rounded-xl bg-[#075E43] border border-[#044E39] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#075E43]/30 transition-all hover:bg-[#044E39] active:scale-98"
        >
          <span>View Service & Book Worker</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
};
