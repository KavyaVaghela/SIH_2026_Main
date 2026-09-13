"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Briefcase,
  FileCheck2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  CreditCard,
  Building2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import type { WorkerApplicationItem } from "../types";

interface WorkerApplicationDetailDialogProps {
  application: WorkerApplicationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (app: WorkerApplicationItem) => void;
  onReject: (app: WorkerApplicationItem) => void;
}

export function WorkerApplicationDetailDialog({
  application,
  isOpen,
  onClose,
  onAccept,
  onReject,
}: WorkerApplicationDetailDialogProps) {
  if (!application) return null;

  const isPending = application.status === "PENDING";
  const isExistingWorker = application.registrationType === "EXISTING_WORKER";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-blue-700 dark:text-blue-400" />
          <span>Membership Application — {application.applicantName}</span>
        </div>
      }
      description={`Application ID: ${application.id} • Submitted on ${application.submittedDate}`}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-4 text-xs">
        {/* Status Header Bar */}
        <div className="flex flex-wrap items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20 gap-2">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-medium block">
              Application Category & Status
            </span>
            <div className="flex items-center space-x-2 mt-1">
              <Badge
                variant="outline"
                className={
                  isExistingWorker
                    ? "border-purple-500/40 text-purple-700 dark:text-purple-300 bg-purple-500/10 font-semibold"
                    : "border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-500/10 font-semibold"
                }
              >
                {isExistingWorker ? "Existing Worker Digital Access" : "New Worker Application"}
              </Badge>

              {application.status === "PENDING" && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-500/10">
                  <Clock className="h-3 w-3 mr-1" /> Pending Review
                </Badge>
              )}
              {application.status === "ACCEPTED" && (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 bg-emerald-500/10">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Accepted & Inducted
                </Badge>
              )}
              {application.status === "REJECTED" && (
                <Badge variant="outline" className="border-rose-500/40 text-rose-700 bg-rose-500/10">
                  <XCircle className="h-3 w-3 mr-1" /> Rejected
                </Badge>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-muted-foreground uppercase font-medium block">
              Federation Member ID
            </span>
            <span className="font-mono text-xs font-bold text-foreground">
              {application.memberId || (isExistingWorker ? "Not provided" : "Generated on Induction")}
            </span>
            {application.reviewedAt && (
              <span className="text-[10px] text-muted-foreground block font-mono">
                Reviewed: {application.reviewedAt}
              </span>
            )}
          </div>
        </div>

        {/* Rejection Notice if rejected */}
        {application.status === "REJECTED" && application.rejectionReason && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-1">
            <span className="font-semibold text-[11px]">Recorded Rejection Reason:</span>
            <p className="text-xs">{application.rejectionReason}</p>
          </div>
        )}

        {/* 1. PERSONAL DETAILS & AVATAR */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-card space-y-2.5">
          <div className="flex items-center space-x-1.5 font-semibold text-foreground text-xs border-b border-border/60 pb-1.5">
            <User className="h-3.5 w-3.5 text-blue-700" />
            <span>Personal Information</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Worker Avatar / Thumbnail */}
            {application.avatarUrl ? (
              <div className="shrink-0 flex flex-col items-center">
                <img
                  src={application.avatarUrl}
                  alt={application.applicantName}
                  className="w-20 h-20 rounded-lg object-cover border border-border shadow-xs"
                />
                <span className="text-[10px] text-muted-foreground mt-1">Profile Photo</span>
              </div>
            ) : (
              <div className="shrink-0 w-20 h-20 rounded-lg bg-muted flex flex-col items-center justify-center border border-border">
                <User className="w-8 h-8 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground mt-0.5">No Photo</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs flex-1">
              <div>
                <span className="text-muted-foreground text-[10px]">Full Legal Name</span>
                <p className="font-semibold text-foreground">{application.applicantName}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Date of Birth / Gender</span>
                <p className="font-medium text-foreground">
                  {application.dateOfBirth} ({application.gender || "Not specified"})
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Mobile Contact</span>
                <p className="font-mono text-foreground">{application.phone}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Email Address</span>
                <p className="font-mono text-foreground">{application.email}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground text-[10px]">Registered Residence</span>
                <p className="text-foreground leading-relaxed">
                  {application.address}, {application.city}, {application.state}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. PROFESSIONAL & COMPETENCY */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-card space-y-2.5">
          <div className="flex items-center space-x-1.5 font-semibold text-foreground text-xs border-b border-border/60 pb-1.5">
            <Briefcase className="h-3.5 w-3.5 text-emerald-700" />
            <span>Trade Qualification & Pricing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <span className="text-muted-foreground text-[10px]">Trade Specialty</span>
              <p className="font-semibold text-foreground">{application.profession}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px]">Experience</span>
              <p className="font-medium text-foreground">{application.experienceYears} Years</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px]">Tariff Proposal</span>
              <p className="font-semibold text-foreground">₹{application.hourlyRate} / hour</p>
            </div>
            <div className="sm:col-span-3">
              <span className="text-muted-foreground text-[10px]">Declared Skill Competencies</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {application.skills.length > 0 ? (
                  application.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-muted text-xs font-medium text-foreground"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground italic text-[11px]">No specific skills declared</span>
                )}
              </div>
            </div>

            {application.previousWorkDetails && (
              <div className="sm:col-span-3 bg-muted/20 p-2 rounded border border-border/40">
                <span className="text-muted-foreground text-[10px] block font-medium">
                  Previous Work Details / Trade History
                </span>
                <p className="text-foreground mt-0.5 whitespace-pre-line text-xs">
                  {application.previousWorkDetails}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. BANKING DETAILS */}
        {(application.bankName || application.bankAccountNumber) && (
          <div className="p-3.5 rounded-lg border border-border/80 bg-card space-y-2.5">
            <div className="flex items-center space-x-1.5 font-semibold text-foreground text-xs border-b border-border/60 pb-1.5">
              <CreditCard className="h-3.5 w-3.5 text-cyan-700" />
              <span>Direct Benefit Transfer & Bank Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground text-[10px]">Bank Name</span>
                <p className="font-semibold text-foreground">{application.bankName || "Not specified"}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Account Holder</span>
                <p className="font-medium text-foreground">{application.bankAccountHolder || application.applicantName}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Account Number</span>
                <p className="font-mono text-foreground font-semibold">{application.bankAccountNumber || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">IFSC Code</span>
                <p className="font-mono text-foreground font-semibold">{application.bankIfscCode || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. VERIFIED DOCUMENTS & KYC */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-card space-y-2.5">
          <div className="flex items-center space-x-1.5 font-semibold text-foreground text-xs border-b border-border/60 pb-1.5">
            <FileCheck2 className="h-3.5 w-3.5 text-purple-700" />
            <span>Supporting Credentials & KYC Documents</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Government ID details */}
            {(application.govtIdType || application.govtIdNumber) && (
              <div className="p-2.5 rounded border border-border/60 bg-muted/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-medium text-foreground block text-xs">
                    {application.govtIdType || "Government Identity"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ID: {application.govtIdNumber}
                  </span>
                </div>
                {application.govtIdDocumentUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `/api/storage/document?path=${encodeURIComponent(application.govtIdDocumentUrl || "")}`,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    className="h-6 px-2 text-[11px] text-blue-700 dark:text-blue-300"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Doc
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-[10px]">No file attached</Badge>
                )}
              </div>
            )}

            {/* Other documents from application.documents array if any */}
            {application.documents.map((doc, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded border border-border/60 bg-muted/20 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-foreground block text-xs">{doc.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {doc.category} • {doc.fileType} ({doc.fileSize || "1 MB"})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => alert(`Previewing application credential: ${doc.name}`)}
                  className="h-6 px-2 text-[11px] text-emerald-800 dark:text-emerald-300"
                >
                  <Download className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>

          {isPending && (
            <div className="flex items-center space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onClose();
                  onReject(application);
                }}
                className="text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject Application
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onAccept(application);
                }}
                className="text-xs bg-emerald-800 hover:bg-emerald-900 text-white"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Accept & Induct Worker
              </Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

