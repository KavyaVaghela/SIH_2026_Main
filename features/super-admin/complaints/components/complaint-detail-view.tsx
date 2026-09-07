"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  Briefcase,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  ShieldAlert,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";
import { useComplaintDetail } from "../hooks/use-complaint-detail";
import { ComplaintStatusBadge, ComplaintCategoryBadge } from "./complaint-status-badge";
import { ComplaintActionBar } from "./complaint-action-bar";
import { ComplaintNotesSection } from "./complaint-notes-section";

export function ComplaintDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const {
    complaint,
    isLoading,
    isSubmitting,
    error,
    startReview,
    markResolved,
    addNote,
    assignToFederation,
  } = useComplaintDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-80" />
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-rose-600" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Complaint Record Not Found</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {error || "The requested grievance ticket could not be located."}
        </p>
        <Link
          href="/super-admin/complaints"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Complaints Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title={`Complaint #${complaint.complaintNumber}`}
        description={`Category: ${complaint.categoryLabel} | Society: ${complaint.societyName} | Logged: ${complaint.createdAt}`}
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Complaints", href: "/super-admin/complaints" },
          { label: complaint.complaintNumber },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-emerald-800/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Complaints
            </Button>
          </div>
        }
      />

      {/* Workflow Controls & State Transitions */}
      <ComplaintActionBar
        status={complaint.status}
        assignedTo={complaint.assignedTo}
        onStartReview={startReview}
        onMarkResolved={markResolved}
        onAssignToFederation={assignToFederation}
        isSubmitting={isSubmitting}
      />

      {/* Main Grid: Details Left (2 cols), Stakeholders Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complaint Statement, Resolution Notes, Admin Notes */}
        <div className="space-y-6 lg:col-span-2">
          {/* Original Complaint Statement Card */}
          <Card
            className={`border shadow-sm ${
              complaint.isSafetyCritical ? "border-rose-300 dark:border-rose-900" : ""
            }`}
          >
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-700" />
                <span>Original Complainant Statement</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <ComplaintCategoryBadge
                  category={complaint.category}
                  label={complaint.categoryLabel}
                />
                <ComplaintStatusBadge status={complaint.status} />
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="p-4 rounded-xl bg-muted/30 border leading-relaxed text-xs text-foreground space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                  Reported Grievance Description:
                </span>
                <p className="text-sm font-medium text-foreground whitespace-pre-line">
                  {complaint.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div>
                  <span className="text-muted-foreground block">Incident Date Logged:</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{complaint.createdAt}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block">Current Assignee:</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {complaint.assignedTo || "Unassigned / General Triage"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block">Safety Priority:</span>
                  <span className="mt-0.5 block">
                    {complaint.isSafetyCritical ? (
                      <span className="text-rose-600 font-bold flex items-center">
                        <ShieldAlert className="h-3.5 w-3.5 mr-1" /> High Safety Hazard
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Standard SLA</span>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formal Resolution Outcome Card (if resolved) */}
          {complaint.status === "RESOLVED" && complaint.resolutionNotes && (
            <Card className="border shadow-sm border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Formal Administrative Resolution Statement</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-2 text-xs">
                <p className="text-foreground leading-relaxed font-medium">
                  {complaint.resolutionNotes}
                </p>
                <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                  <span>Resolved By: <span className="font-semibold text-foreground">{complaint.resolvedBy || "Super Admin"}</span></span>
                  <span>Resolved At: <span className="font-medium text-foreground">{complaint.resolvedAt}</span></span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Separate Internal Admin Review Notes Section */}
          <ComplaintNotesSection
            notes={complaint.notes}
            onAddNote={addNote}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Right Column: Stakeholders & Linked Service Booking */}
        <div className="space-y-6">
          {/* Customer Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-foreground flex items-center space-x-2">
                <User className="h-4 w-4 text-emerald-700" />
                <span>Complainant Customer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <p className="text-sm font-bold text-foreground">{complaint.customerName}</p>
              <div className="flex items-center space-x-2 text-muted-foreground pt-1">
                <Phone className="h-3.5 w-3.5 text-emerald-700" />
                <span className="font-semibold text-foreground">{complaint.customerPhone}</span>
              </div>
              {complaint.customerEmail && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{complaint.customerEmail}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Worker Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-foreground flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-emerald-700" />
                <span>Target Cooperative Worker</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {complaint.workerId ? (
                <>
                  <div>
                    <Link
                      href={`/super-admin/workforce/${complaint.workerId}`}
                      className="text-sm font-bold text-foreground hover:text-emerald-700 hover:underline"
                    >
                      {complaint.workerName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{complaint.workerProfession}</p>
                  </div>

                  {complaint.workerPhone && (
                    <div className="flex items-center space-x-2 text-muted-foreground pt-1 border-t">
                      <Phone className="h-3.5 w-3.5 text-emerald-700" />
                      <span className="font-semibold text-foreground">{complaint.workerPhone}</span>
                    </div>
                  )}

                  <div className="pt-1">
                    <Link
                      href={`/super-admin/workforce/${complaint.workerId}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "w-full text-xs font-semibold"
                      )}
                    >
                      Inspect Worker Profile
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">No individual worker targeted.</p>
              )}
            </CardContent>
          </Card>

          {/* Cooperative Society Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-foreground flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-emerald-700" />
                <span>Cooperative Society</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <Link
                href={`/super-admin/societies/${complaint.societyId}`}
                className="text-sm font-bold text-foreground hover:text-emerald-700 hover:underline block"
              >
                {complaint.societyName}
              </Link>
              <div className="pt-1">
                <Link
                  href={`/super-admin/societies/${complaint.societyId}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full text-xs font-semibold"
                  )}
                >
                  Inspect Society Registry
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Linked Service Booking Card */}
          {complaint.bookingId && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold text-foreground flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-emerald-700" />
                  <span>Linked Gig Booking</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Booking Ref:</span>
                  <Link
                    href={`/super-admin/bookings/${complaint.bookingId}`}
                    className="font-mono font-bold text-emerald-800 dark:text-emerald-300 hover:underline"
                  >
                    {complaint.bookingNumber}
                  </Link>
                </div>

                {complaint.bookingServiceTitle && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-semibold text-foreground truncate max-w-[140px]">
                      {complaint.bookingServiceTitle}
                    </span>
                  </div>
                )}

                {complaint.bookingScheduledAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Scheduled At:</span>
                    <span className="text-muted-foreground">{complaint.bookingScheduledAt}</span>
                  </div>
                )}

                {complaint.bookingAmount && (
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-muted-foreground">Job Escrow Value:</span>
                    <span className="font-mono font-bold text-foreground">₹{complaint.bookingAmount}</span>
                  </div>
                )}

                <div className="pt-1">
                  <Link
                    href={`/super-admin/bookings/${complaint.bookingId}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-full text-xs font-semibold"
                    )}
                  >
                    Inspect Booking Lifecycle
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
