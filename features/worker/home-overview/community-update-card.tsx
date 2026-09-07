"use client";

import * as React from "react";
import Link from "next/link";
import { Megaphone, Calendar, Building2, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CommunityUpdateCard() {
  return (
    <Card className="border-emerald-700/20 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5 sm:mt-0 shadow-sm">
              <Megaphone className="h-4 w-4" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-semibold px-2 py-0.5">
                  Community Update
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-emerald-600" />
                  September 10, 2026
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground">
                New Safety Training Program — September 10
              </h3>

              <p className="text-xs text-muted-foreground flex items-center pt-0.5">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Organized by ABC Labour Cooperative Society
              </p>

              <p className="text-xs text-muted-foreground/90 pt-1 leading-relaxed max-w-2xl">
                Free hands-on refresher on modern pipeline leak diagnostics, pressurized safety valves, and updated cooperative insurance compliances at the Federation Training Bhawan.
              </p>
            </div>
          </div>

          <div className="flex items-center sm:self-center shrink-0 pt-2 sm:pt-0">
            <Link
              href="/worker/welfare"
              className="inline-flex items-center justify-center rounded-md text-xs font-semibold px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-sm"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              View Training Details
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
