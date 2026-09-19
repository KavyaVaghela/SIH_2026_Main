"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export const PageHeader: React.FC = () => {
  return (
    <div className="rounded-3xl border-2 border-[#075E43]/40 bg-[#E8F8F2] p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#075E43] text-white shadow-md">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <span className="rounded-full bg-[#075E43]/15 px-3 py-1 text-xs font-extrabold text-[#075E43] border border-[#075E43]/30">
            SmartServe AI Module
          </span>
          <h2 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-[#17233C]">
            Describe your household problem and let SmartServe recommend the right service.
          </h2>
        </div>
      </div>
    </div>
  );
};
