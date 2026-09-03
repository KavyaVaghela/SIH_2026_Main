"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, ShieldCheck, CheckCircle2, Wrench } from "lucide-react";
import type { WorkerSkillItem, WorkerCertificationItem } from "../types";

interface WorkerSkillsTabProps {
  skills: WorkerSkillItem[];
  certifications: WorkerCertificationItem[];
}

export function WorkerSkillsTab({ skills, certifications }: WorkerSkillsTabProps) {
  return (
    <div className="space-y-6">
      {/* Skill Proficiencies */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold text-foreground flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-emerald-700" />
            <span>Assessed Skill Proficiencies ({skills.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/30 space-y-1 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{skill.name}</span>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold"
                >
                  {skill.proficiencyLevel}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Category: {skill.category}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Verified Certifications */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold text-foreground flex items-center space-x-2">
            <Award className="h-5 w-5 text-emerald-700" />
            <span>Verified Trade Certifications ({certifications.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {certifications.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No official certifications uploaded yet.</p>
          ) : (
            certifications.map((cert) => (
              <div
                key={cert.id}
                className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-foreground">{cert.title}</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                      <ShieldCheck className="h-3 w-3 mr-1 inline" /> {cert.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Issuing Authority: <span className="font-semibold text-foreground">{cert.issuingBody}</span>
                  </p>
                  {cert.certificateNumber && (
                    <p className="text-[10px] font-mono text-muted-foreground">
                      Certificate No: {cert.certificateNumber}
                    </p>
                  )}
                </div>

                <div className="text-xs text-muted-foreground shrink-0 text-left sm:text-right">
                  <p>Issue Date: {cert.issueDate}</p>
                  {cert.expiryDate && <p>Valid Until: {cert.expiryDate}</p>}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
