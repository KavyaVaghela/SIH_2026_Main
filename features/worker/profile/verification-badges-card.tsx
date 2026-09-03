"use client";

import * as React from "react";
import { ShieldCheck, UserCheck, PhoneCall, CheckCircle2, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkerProfileDetails } from "../types";

export interface VerificationBadgesCardProps {
  verifications: WorkerProfileDetails["verifications"];
  phone: string;
}

export function VerificationBadgesCard({
  verifications,
  phone,
}: VerificationBadgesCardProps) {
  const items = [
    {
      title: "Identity",
      detail: "Aadhaar / Government ID linked",
      isVerified: verifications.identity,
      icon: UserCheck,
    },
    {
      title: "Phone",
      detail: `${phone} verified OTP`,
      isVerified: verifications.phone,
      icon: PhoneCall,
    },
    {
      title: "Worker",
      detail: "Cooperative membership verified",
      isVerified: verifications.worker,
      icon: CheckCircle2,
    },
    {
      title: "Skill",
      detail: "Trade skill certified by Federation",
      isVerified: verifications.skill,
      icon: Award,
    },
  ];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">
            Cooperative Verification & Trust Badges
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.title}
                className="p-3.5 rounded-lg border bg-card hover:bg-muted/20 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                    <IconComp className="h-4 w-4" />
                  </div>

                  <Badge variant="success" className="text-[10px] py-0 px-2 font-medium">
                    <ShieldCheck className="h-2.5 w-2.5 mr-1" />
                    Verified
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {item.title} — Verified
                  </h4>
                  <p className="text-xs text-muted-foreground pt-0.5 line-clamp-1">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
