"use client";

import * as React from "react";
import { Building2, MapPin, Mail, Phone, FileCheck, ShieldCheck, User, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocietyStatusBadge } from "./society-status-badge";
import type { SocietyDetails } from "../types";

interface SocietyOverviewTabProps {
  society: SocietyDetails;
}

export function SocietyOverviewTab({ society }: SocietyOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Registered Workers</p>
          <p className="text-2xl font-bold text-foreground mt-1">{society.totalWorkers}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Active co-op members</p>
        </Card>
        <Card className="border shadow-xs p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Completed Services</p>
          <p className="text-2xl font-bold text-foreground mt-1">{society.completedBookings}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Out of {society.totalBookings} total</p>
        </Card>
        <Card className="border shadow-xs p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Completion Rate</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {society.completionRate}%
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Fulfillment benchmark</p>
        </Card>
        <Card className="border shadow-xs p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Customer Rating</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ★ {society.averageRating}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Average customer feedback</p>
        </Card>
      </div>

      {/* Main Info Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration & Profile Info */}
        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-foreground flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-emerald-700" />
              <span>Society Profile & Governance Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Legal Society Name</span>
                <p className="text-sm font-bold text-foreground">{society.name}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Society Code</span>
                <p className="text-sm font-mono font-bold text-foreground">{society.code}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Registration Number</span>
                <p className="text-sm font-semibold text-foreground">{society.registrationNumber}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Registration Date</span>
                <p className="text-sm font-medium text-foreground flex items-center mt-0.5">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {society.registrationDate}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t space-y-2">
              <span className="text-xs text-muted-foreground">Registered Office Address</span>
              <p className="text-xs font-medium text-foreground leading-relaxed flex items-start">
                <MapPin className="h-4 w-4 mr-1.5 shrink-0 text-emerald-700 mt-0.5" />
                {society.address}
              </p>
            </div>

            {society.serviceRegion && (
              <div className="pt-3 border-t">
                <span className="text-xs text-muted-foreground">Authorized Service Region Corridor</span>
                <p className="text-xs font-semibold text-foreground mt-0.5">{society.serviceRegion}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Contact & Documents */}
        <div className="space-y-6">
          {/* Admin Details */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-foreground flex items-center space-x-2">
                <User className="h-4 w-4 text-emerald-700" />
                <span>Secretary & Admin Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <span className="text-[11px] text-muted-foreground">Designated Secretary</span>
                <p className="text-sm font-bold text-foreground">{society.adminName}</p>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center space-x-2 text-xs">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <a href={`mailto:${society.contactEmail}`} className="text-emerald-700 hover:underline">
                    {society.contactEmail}
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground font-medium">{society.contactPhone}</span>
                </div>
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Governance Status</span>
                <SocietyStatusBadge status={society.status} isActive={society.isActive} />
              </div>
            </CardContent>
          </Card>

          {/* Official Verification Documents */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-foreground flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-emerald-700" />
                <span>Verification Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {society.officialDocuments && society.officialDocuments.length > 0 ? (
                society.officialDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 border text-xs"
                  >
                    <span className="font-medium text-foreground truncate max-w-[180px]">{doc.title}</span>
                    {doc.verified ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        <ShieldCheck className="h-3 w-3 mr-1 inline" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                        Pending
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2">No uploaded documents available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
