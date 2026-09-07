"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox, Calendar, Wallet, HeartHandshake, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function QuickActionsCard() {
  const actions = [
    {
      title: "View Job Requests",
      description: "Review incoming service requests",
      href: "/worker/schedule?tab=requests",
      icon: Inbox,
      color: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/40",
    },
    {
      title: "My Schedule",
      description: "Check upcoming bookings & timings",
      href: "/worker/schedule?tab=schedule",
      icon: Calendar,
      color: "text-blue-700 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/40",
    },
    {
      title: "Earnings",
      description: "Track payouts & bank settlements",
      href: "/worker/earnings",
      icon: Wallet,
      color: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/40",
    },
    {
      title: "Welfare",
      description: "Health insurance & trade certificates",
      href: "/worker/welfare",
      icon: HeartHandshake,
      color: "text-teal-700 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800/40",
    },
  ];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3">
        <CardTitle className="text-base sm:text-lg font-bold text-foreground">
          Quick Actions
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Direct navigation to core cooperative member workflows
        </p>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((act) => {
            const IconComp = act.icon;
            return (
              <Link
                key={act.title}
                href={act.href}
                className="flex items-center justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/40 hover:border-emerald-600/30 transition-all group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${act.bgColor}`}>
                    <IconComp className={`h-4 w-4 ${act.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                      {act.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {act.description}
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all shrink-0 ml-2" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
