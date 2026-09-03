"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Mail, Calendar, Clock, Lock } from "lucide-react";
import type { SuperAdminProfile } from "../types";

interface ProfileHeaderCardProps {
  profile: SuperAdminProfile;
}

export function ProfileHeaderCard({ profile }: ProfileHeaderCardProps) {
  return (
    <Card className="border shadow-xs bg-gradient-to-br from-card via-card to-emerald-950/5 dark:to-emerald-950/20">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative">
            <Avatar
              src={profile.avatarUrl || undefined}
              fallback={profile.fullName}
              className="h-20 w-20 text-xl font-bold border-2 border-emerald-700/40 shadow-xs"
            />
            <span
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-700 text-white shadow-xs"
              title="Verified Administrator"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
          </div>

          {/* Profile Identity Info */}
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {profile.fullName}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{profile.email}</span>
                </p>
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-2">
                <Badge
                  variant="outline"
                  className="bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 text-xs font-bold px-2.5 py-1"
                >
                  <Lock className="h-3 w-3 mr-1 text-emerald-700 inline" />
                  SUPER_ADMIN
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 border-t text-[11px] text-muted-foreground">
              <span className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                Member since {profile.createdAt}
              </span>

              {profile.lastLoginAt && (
                <span className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                  Last active: {profile.lastLoginAt}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
