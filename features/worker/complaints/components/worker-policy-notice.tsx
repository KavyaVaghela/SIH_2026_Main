"use client";

import * as React from "react";
import { ShieldCheck, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

export function WorkerPolicyNotice() {
  return (
    <Card className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-2">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
        <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
          Cooperative Member Protection Notice
        </span>
      </div>
      <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
        Customer complaints are reviewed individually by Federation staff. A complaint does not automatically impact your standing or membership. Federation staff will request your perspective before taking any action. You will receive an official notification if a response is required.
      </p>
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400/90 pt-0.5">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>You are guaranteed an official hearing and fair mediation before any conciliation decision is finalized.</span>
      </div>
    </Card>
  );
}
