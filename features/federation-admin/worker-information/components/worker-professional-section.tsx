"use client";

import * as React from "react";
import { Briefcase, Wrench, IndianRupee, Compass, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkerProfessionalDetails } from "../types";

interface WorkerProfessionalSectionProps {
  professional: WorkerProfessionalDetails;
}

export function WorkerProfessionalSection({ professional }: WorkerProfessionalSectionProps) {
  const getProficiencyBadge = (level: string) => {
    switch (level) {
      case "Master":
        return <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-800 text-white">Master</Badge>;
      case "Advanced":
        return <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">Advanced</Badge>;
      case "Intermediate":
        return <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">Intermediate</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground">Beginner</Badge>;
    }
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Professional Skills & Trade Competency
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Trade classification, skill specializations, and dispatch pricing benchmarks
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Core Trade Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px]">Primary Trade Profession</span>
            <p className="font-semibold text-foreground text-xs">{professional.profession}</p>
            <span className="text-[10px] text-muted-foreground">{professional.tradeCategory}</span>
          </div>

          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px]">Trade Experience</span>
            <p className="font-semibold text-foreground text-xs">
              {professional.experienceYears} Years
            </p>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
              Verified Experience Tier
            </span>
          </div>

          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px]">Authorized Hourly Tariff</span>
            <p className="font-semibold text-foreground text-xs">
              ₹{professional.hourlyRate} / hr
            </p>
            <span className="text-[10px] text-muted-foreground">
              Min. Visit Fee: ₹{professional.minimumVisitCharge}
            </span>
          </div>

          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px] flex items-center space-x-1">
              <Compass className="h-3 w-3" />
              <span>Service Radius</span>
            </span>
            <p className="font-semibold text-foreground text-xs">
              {professional.serviceRadiusKm} km
            </p>
            <span className="text-[10px] text-muted-foreground">Operational dispatch perimeter</span>
          </div>
        </div>

        {/* Verified Skills Roster */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-foreground">
            <Wrench className="h-3.5 w-3.5 text-emerald-600" />
            <span>Assessed Trade Skills & Competencies</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {professional.skills.map((skill) => (
              <div
                key={skill.id}
                className="p-2.5 rounded border border-border/60 bg-card hover:bg-muted/20 transition-colors flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-foreground block">{skill.name}</span>
                  <span className="text-[10px] text-muted-foreground">{skill.category}</span>
                </div>
                {getProficiencyBadge(skill.proficiencyLevel)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
