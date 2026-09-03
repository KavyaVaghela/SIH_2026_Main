"use client";

import * as React from "react";
import { Wrench, Languages, Check, IndianRupee } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/formatters/currency";
import type { WorkerProfileDetails } from "../types";

export interface SkillsSectionProps {
  profile: WorkerProfileDetails;
}

export function SkillsSection({ profile }: SkillsSectionProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <Wrench className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">
            Skills & Working Languages
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-5">
        {/* Verified Trade Skills */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
              Verified Trade Specializations
            </h4>
            <span className="text-xs text-muted-foreground">
              Cooperative Standard: <strong className="text-foreground">{formatINR(profile.hourlyRate)}/hr</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {profile.skills.map((skill) => (
              <div
                key={skill}
                className="flex items-center justify-between p-3 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{skill}</span>
                <Badge variant="outline" className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 text-[10px]">
                  <Check className="h-3 w-3 mr-1" />
                  Certified
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Languages Spoken */}
        <div className="space-y-2.5 pt-2 border-t">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
            <Languages className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Customer Communication Languages
          </h4>

          <div className="flex flex-wrap gap-2">
            {profile.languages.map((lang) => (
              <Badge
                key={lang}
                variant="secondary"
                className="text-xs py-1 px-3 bg-muted hover:bg-muted font-medium text-foreground"
              >
                {lang}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
