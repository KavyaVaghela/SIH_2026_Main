"use client";

import * as React from "react";
import { Award, CheckCircle2, AlertTriangle, ShieldCheck, Clock, FolderOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkerCertificationItem } from "../types";

interface WorkerCertificationSectionProps {
  certifications: WorkerCertificationItem[];
}

export function WorkerCertificationSection({ certifications }: WorkerCertificationSectionProps) {
  const getStatusBadge = (status: WorkerCertificationItem["status"]) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center text-[10px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
            Verified & Valid
          </span>
        );
      case "EXPIRING_SOON":
        return (
          <span className="inline-flex items-center text-[10px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
            <Clock className="h-3 w-3 mr-1 text-amber-600" />
            Expiring Soon
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center text-[10px] font-medium text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/20">
            <AlertTriangle className="h-3 w-3 mr-1 text-rose-600" />
            Expired
          </span>
        );
    }
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Trade Certifications & Accreditations
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Statutory government vocational certifications and technical training credentials
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {certifications.length === 0 ? (
          <div className="text-center py-6 px-4 border border-dashed border-border/80 rounded-lg bg-muted/20 space-y-2">
            <FolderOpen className="h-5 w-5 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              No vocational trade certifications are currently recorded for this worker profile.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/15 transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {cert.certificateNumber}
                    </span>
                    {getStatusBadge(cert.status)}
                  </div>
                  <h4 className="font-semibold text-foreground text-xs leading-snug">
                    {cert.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">{cert.issuingBody}</p>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Issued: {cert.issueDate}</span>
                  <span>{cert.expiryDate ? `Expires: ${cert.expiryDate}` : "Lifetime Validity"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
