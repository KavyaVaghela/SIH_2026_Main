"use client";

import * as React from "react";
import { User, Calendar, MapPin, Phone, Mail, ShieldAlert, HeartHandshake } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { WorkerPersonalDetails } from "../types";

interface WorkerPersonalSectionProps {
  personal: WorkerPersonalDetails;
}

export function WorkerPersonalSection({ personal }: WorkerPersonalSectionProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
            <User className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Personal Information
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Member identity, residential details, and emergency communication records
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          {/* Full Name & Worker ID */}
          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px]">Full Legal Name</span>
            <p className="font-semibold text-foreground text-xs">{personal.fullName}</p>
            <span className="font-mono text-[10px] text-muted-foreground block">
              ID: {personal.workerId}
            </span>
          </div>

          {/* Date of Birth & Gender */}
          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px] flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Date of Birth</span>
            </span>
            <p className="font-medium text-foreground text-xs">{personal.dateOfBirth}</p>
            <span className="text-[10px] text-muted-foreground block">
              Gender: {personal.gender}
            </span>
          </div>

          {/* Joining Date */}
          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px] flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Cooperative Induction Date</span>
            </span>
            <p className="font-medium text-foreground text-xs">{personal.joiningDate}</p>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">
              Verified Member
            </span>
          </div>

          {/* Phone */}
          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px] flex items-center space-x-1">
              <Phone className="h-3 w-3" />
              <span>Contact Telephone</span>
            </span>
            <p className="font-mono font-medium text-foreground text-xs">{personal.phone}</p>
            <span className="text-[10px] text-muted-foreground block">Primary mobile number</span>
          </div>

          {/* Email */}
          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px] flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span>Cooperative Portal Email</span>
            </span>
            <p className="font-mono font-medium text-foreground text-xs truncate">
              {personal.email}
            </p>
            <span className="text-[10px] text-muted-foreground block">Institutional mailbox</span>
          </div>

          {/* Emergency Contact */}
          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5">
            <span className="text-muted-foreground text-[11px] flex items-center space-x-1">
              <HeartHandshake className="h-3 w-3" />
              <span>Emergency Contact</span>
            </span>
            <p className="font-medium text-foreground text-xs">
              {personal.emergencyContactName || "Not on file"}
            </p>
            <span className="font-mono text-[10px] text-muted-foreground block">
              {personal.emergencyContactPhone || "N/A"}
            </span>
          </div>

          {/* Residential Address (Spans 2 columns on lg) */}
          <div className="p-2.5 rounded border border-border/60 bg-muted/20 space-y-0.5 lg:col-span-3">
            <span className="text-muted-foreground text-[11px] flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>Registered Residence Address</span>
            </span>
            <p className="font-medium text-foreground text-xs leading-relaxed">
              {personal.address}
            </p>
            <span className="text-[10px] text-muted-foreground block">
              Postal Code: {personal.postalCode} • {personal.city}, {personal.state}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
