"use client";

import * as React from "react";
import { ShieldPlus, HeartHandshake, GraduationCap, Gift } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface WelfareBenefitsCardProps {
  benefits: Array<{
    title: string;
    description: string;
  }>;
}

export function WelfareBenefitsCard({ benefits }: WelfareBenefitsCardProps) {
  const getBenefitIcon = (title: string) => {
    if (title.toLowerCase().includes("accident")) {
      return ShieldPlus;
    }
    if (title.toLowerCase().includes("emergency")) {
      return HeartHandshake;
    }
    return GraduationCap;
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Cooperative Welfare Benefits
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Guaranteed mutual benefits backed by state cooperative federations
            </p>
          </div>
        </div>

        <Badge variant="outline" className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 text-xs">
          3 Active Programs
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {benefits.map((item) => {
            const IconComp = getBenefitIcon(item.title);
            return (
              <div
                key={item.title}
                className="p-4 rounded-lg border bg-card hover:bg-muted/20 transition-colors space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                    <IconComp className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    {item.title}
                  </h4>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
