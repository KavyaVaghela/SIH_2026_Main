"use client";

import * as React from "react";
import { Award, CheckCircle2, Calendar, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkerCertificationItem } from "../types";

export interface CertificationsListCardProps {
  certifications: WorkerCertificationItem[];
}

export function CertificationsListCard({ certifications }: CertificationsListCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Trade Certifications & Compliances
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              National skill qualifications and certified health-safety training
            </p>
          </div>
        </div>

        <Badge variant="success" className="text-xs">
          {certifications.length} Registered
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {certifications.map((cert) => {
            const isVerified = cert.status === "Verified";

            return (
              <div
                key={cert.id}
                className="p-4 rounded-lg border bg-card hover:bg-muted/20 transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={isVerified ? "success" : "secondary"}
                      className="text-[10px] py-0 px-2 font-medium"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                      {cert.status}
                    </Badge>
                    {cert.certCode && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {cert.certCode}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-foreground pt-1">
                    {cert.title}
                  </h4>

                  <p className="text-xs text-muted-foreground">
                    {cert.issuedBy}
                  </p>
                </div>

                <div className="pt-2 border-t flex items-center text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <span>{cert.validityText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
