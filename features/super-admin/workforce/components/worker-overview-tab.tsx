"use client";

import * as React from "react";
import { User, Building2, MapPin, Mail, Phone, Calendar, Briefcase, Award, ShieldCheck, Hash } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { WorkerStatusBadge } from "./worker-status-badge";
import type { WorkerDetails } from "../types";

interface WorkerOverviewTabProps {
  worker: WorkerDetails;
}

export function WorkerOverviewTab({ worker }: WorkerOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Experience</span>
          <p className="text-2xl font-bold text-foreground mt-1">{worker.experienceYears} Years</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Verified craft practice</p>
        </Card>

        <Card className="border shadow-xs p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Hourly Wage Rate</span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            ₹{worker.hourlyRate} / hr
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Approved cooperative rate</p>
        </Card>

        <Card className="border shadow-xs p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Jobs Completed</span>
          <p className="text-2xl font-bold text-foreground mt-1">{worker.completedJobs}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Out of {worker.totalJobs} total jobs</p>
        </Card>

        <Card className="border shadow-xs p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Customer Satisfaction</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ★ {worker.averageRating}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Platform rating score</p>
        </Card>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-foreground flex items-center space-x-2">
              <User className="h-5 w-5 text-emerald-700" />
              <span>Worker Profile & Registration Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            {/* Identity Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-muted/40 border">
              <Avatar
                src={worker.avatarUrl || undefined}
                fallback={worker.fullName}
                size="xl"
                className="h-20 w-20 text-xl border-2 border-emerald-600/30 shrink-0"
              />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">{worker.fullName}</h3>
                  <Badge variant="outline" className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {worker.profession}
                  </Badge>
                  {worker.registrationType && (
                    <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider">
                      {worker.registrationType.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center font-mono font-medium text-foreground">
                    <Hash className="h-3.5 w-3.5 mr-0.5 text-muted-foreground" />
                    {worker.memberId || "Pending ID"}
                  </span>
                  <span>•</span>
                  <span>{worker.societyName}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Date of Birth</span>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {worker.dateOfBirth ? new Date(worker.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not provided"}
                </p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Gender</span>
                <p className="text-sm font-medium text-foreground mt-0.5 capitalize">
                  {worker.gender || "Not specified"}
                </p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Cooperative Society</span>
                <p className="text-sm font-bold text-foreground flex items-center mt-0.5">
                  <Building2 className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                  {worker.societyName}
                </p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Platform Joining Date</span>
                <p className="text-sm font-medium text-foreground flex items-center mt-0.5">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {worker.joiningDate}
                </p>
              </div>
            </div>

            {worker.address && (
              <div className="pt-3 border-t space-y-1">
                <span className="text-xs text-muted-foreground">Operating Address</span>
                <p className="text-xs font-medium text-foreground leading-relaxed flex items-start">
                  <MapPin className="h-4 w-4 mr-1.5 shrink-0 text-emerald-700 mt-0.5" />
                  {worker.address}
                </p>
              </div>
            )}

            <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Service Radius Limit</span>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  {worker.serviceRadiusKm} km coverage
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Last Recorded Activity</span>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  {worker.lastActiveAt || "Recently"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Contacts Sidebar */}
        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-foreground">Status & Verification</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Live Availability</span>
                <WorkerStatusBadge type="availability" status={worker.availabilityStatus} />
              </div>

              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-xs text-muted-foreground">Skill Verification</span>
                <WorkerStatusBadge type="verification" status={worker.verificationStatus} />
              </div>

              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-xs text-muted-foreground">Account Status</span>
                <span className="text-xs font-bold text-foreground">{worker.accountStatus}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-foreground">Direct Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">{worker.phone || "N/A"}</span>
              </div>
              {worker.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <a href={`mailto:${worker.email}`} className="text-emerald-700 hover:underline">
                    {worker.email}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
