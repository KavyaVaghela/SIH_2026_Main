"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Clock,
  Navigation,
  Wrench,
  ShieldCheck,
  Building2,
  AlertCircle,
  FileText,
  CheckCircle2,
  RefreshCw,
  History,
  Car,
  ExternalLink,
  Sparkles,
  KeyRound,
  Play,
  Check,
  Plus,
  Trash2,
  Camera,
  Upload,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatINR } from "@/lib/formatters/currency";
import { RouteMap } from "@/components/maps/route-map";
import { workerJobService } from "../services/worker-job-service";
import { CANONICAL_STATUS_LABELS, type WorkerJobItem, type BookingStatusHistoryItem } from "../types";

export interface ActiveJobDetailViewProps {
  bookingId: string;
}

export function ActiveJobDetailView({ bookingId }: ActiveJobDetailViewProps) {
  const router = useRouter();
  const [job, setJob] = React.useState<WorkerJobItem | null>(null);
  const [history, setHistory] = React.useState<BookingStatusHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [computedDistance, setComputedDistance] = React.useState<number | null>(null);

  // Task 6 State: OTP Verification
  const [otpInput, setOtpInput] = React.useState("");
  const [otpError, setOtpError] = React.useState<string | null>(null);

  // Task 6 State: Work Notes & Materials
  const [workNotesInput, setWorkNotesInput] = React.useState("");
  const [newMaterialInput, setNewMaterialInput] = React.useState("");
  const [materialsList, setMaterialsList] = React.useState<string[]>([]);

  // Task 6 State: Before & After Photos
  const [beforePhoto, setBeforePhoto] = React.useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = React.useState<string | null>(null);
  const beforeFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const afterFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Task 6 State: Completion Confirmation Dialog
  const [isCompleteModalOpen, setIsCompleteModalOpen] = React.useState(false);
  const [isSavingDetails, setIsSavingDetails] = React.useState(false);

  const loadJobData = React.useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [data, hist] = await Promise.all([
        workerJobService.getJobDetails(bookingId),
        workerJobService.getStatusHistory(bookingId),
      ]);
      if (data) {
        setJob(data);
        setHistory(hist);
        if (data.workNotes) setWorkNotesInput(data.workNotes);
        if (data.materialsUsed) setMaterialsList(data.materialsUsed);
        if (data.beforePhotoUrl) setBeforePhoto(data.beforePhotoUrl);
        if (data.afterPhotoUrl) setAfterPhoto(data.afterPhotoUrl);
      } else {
        setActionError("Active job booking not found.");
      }
    } catch (err) {
      console.error("Failed to load active job details", err);
      setActionError("Failed to load active job details.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  React.useEffect(() => {
    loadJobData();
  }, [loadJobData]);

  // Coordinates for RouteMap
  const { origin, destination } = React.useMemo(() => {
    return workerJobService.getJobCoordinates(job?.customerArea);
  }, [job?.customerArea]);

  // Action: Accept Job (BOOKING_CONFIRMED -> WORKER_ACCEPTED)
  const handleAcceptJob = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await workerJobService.acceptJob(job.id, "w-1");
      const hist = await workerJobService.getStatusHistory(job.id);
      setJob(updated);
      setHistory(hist);
      setActionSuccess("Job Accepted! You're scheduled to provide this service to the customer.");
    } catch (err: any) {
      console.error("Failed to accept job", err);
      setActionError(err?.message || "Failed to accept job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Start Travel (WORKER_ACCEPTED -> ON_THE_WAY)
  const handleStartTravel = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await workerJobService.startTravel(job.id, "w-1");
      const hist = await workerJobService.getStatusHistory(job.id);
      setJob(updated);
      setHistory(hist);
      setActionSuccess("Transit initiated! Customer has been notified that you are on the way.");
    } catch (err: any) {
      console.error("Failed to start travel", err);
      setActionError(err?.message || "Failed to initiate travel. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Mark Arrived (ON_THE_WAY -> ARRIVED)
  const handleMarkArrived = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await workerJobService.markArrived(job.id, "w-1");
      const hist = await workerJobService.getStatusHistory(job.id);
      setJob(updated);
      setHistory(hist);
      setActionSuccess("Worker arrival recorded! Please obtain the OTP from the customer to verify service start.");
    } catch (err: any) {
      console.error("Failed to mark arrival", err);
      setActionError(err?.message || "Failed to mark arrival. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Verify OTP (ARRIVED -> OTP_VERIFIED)
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpInput).trim();
    if (!job || !code) {
      setOtpError("Please enter the 6-digit OTP code.");
      return;
    }
    setIsSubmitting(true);
    setOtpError(null);
    setActionError(null);
    try {
      const updated = await workerJobService.verifyServiceOtp(job.id, code, "w-1");
      const hist = await workerJobService.getStatusHistory(job.id);
      setJob(updated);
      setHistory(hist);
      setActionSuccess("Customer Verified — OTP verified successfully. You can now start the service.");
      setOtpInput("");
    } catch (err: any) {
      console.error("OTP verification failed", err);
      setOtpError("Incorrect OTP. Please check the OTP and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Start Service (OTP_VERIFIED -> SERVICE_STARTED)
  const handleStartService = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await workerJobService.startService(job.id, "w-1");
      const hist = await workerJobService.getStatusHistory(job.id);
      setJob(updated);
      setHistory(hist);
      setActionSuccess("Service Started! Work is currently in progress. You can record notes and materials below.");
    } catch (err: any) {
      console.error("Failed to start service", err);
      setActionError(err?.message || "Failed to start service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Save Notes & Materials
  const handleSaveDetails = async () => {
    if (!job || isSavingDetails) return;
    setIsSavingDetails(true);
    try {
      const updated = await workerJobService.updateServiceDetails(
        job.id,
        {
          workNotes: workNotesInput,
          materialsUsed: materialsList,
          beforePhotoUrl: beforePhoto,
          afterPhotoUrl: afterPhoto,
        },
        "w-1"
      );
      setJob(updated);
      setActionSuccess("Work documentation saved to service record.");
    } catch (err: any) {
      console.error("Failed to save work documentation", err);
      setActionError("Failed to save work documentation.");
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Action: Add Material to List
  const handleAddMaterial = () => {
    const trimmed = newMaterialInput.trim();
    if (!trimmed) return;
    if (!materialsList.includes(trimmed)) {
      setMaterialsList((prev) => [...prev, trimmed]);
    }
    setNewMaterialInput("");
  };

  // Action: Remove Material from List
  const handleRemoveMaterial = (itemToRemove: string) => {
    setMaterialsList((prev) => prev.filter((item) => item !== itemToRemove));
  };

  // Action: Handle Photo Upload via FileReader
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setActionError("Photo size must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === "before") {
        setBeforePhoto(dataUrl);
      } else {
        setAfterPhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Action: Complete Service (SERVICE_STARTED -> SERVICE_COMPLETED)
  const handleCompleteService = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      // First save latest work notes & materials
      await workerJobService.updateServiceDetails(
        job.id,
        {
          workNotes: workNotesInput,
          materialsUsed: materialsList,
          beforePhotoUrl: beforePhoto,
          afterPhotoUrl: afterPhoto,
        },
        "w-1"
      );

      const updated = await workerJobService.completeService(job.id, "w-1");
      const hist = await workerJobService.getStatusHistory(job.id);
      setJob(updated);
      setHistory(hist);
      setIsCompleteModalOpen(false);
      setActionSuccess(
        "Service Completed! Work has been registered. You can now create the final customer service bill."
      );
    } catch (err: any) {
      console.error("Failed to complete service", err);
      setActionError(err?.message || "Failed to complete service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Task 7 Action: Simulate Payment Success (Dev Only)
  const handleSimulatePaymentSuccess = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const result = await workerJobService.simulatePaymentSuccess(job.id, "w-1");
      const hist = await workerJobService.getStatusHistory(job.id);
      setJob(result.job);
      setHistory(hist);
      setActionSuccess(
        "Payment Successful! Booking has transitioned to BOOKING_COMPLETED and your availability has been reset to AVAILABLE."
      );
    } catch (err: any) {
      console.error("Payment simulation failed", err);
      setActionError(err?.message || "Payment simulation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Task 7 Action: Simulate Payment Failure (Dev Only)
  const handleSimulatePaymentFailure = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const result = await workerJobService.simulatePaymentFailure(job.id, "w-1");
      const hist = await workerJobService.getStatusHistory(job.id);
      setJob(result.job);
      setHistory(hist);
      setActionError(
        "Customer Payment Failed (Simulated). The booking remains in PAYMENT_PENDING for customer retry."
      );
    } catch (err: any) {
      console.error("Payment failure simulation error", err);
      setActionError(err?.message || "Payment failure simulation error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dev Simulation: Customer Confirmation (CUSTOMER_CONFIRMATION_PENDING -> BOOKING_CONFIRMED)
  const handleSimulateConfirmation = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await workerJobService.simulateCustomerConfirmation(job.id);
      const hist = await workerJobService.getStatusHistory(job.id);
      setJob(updated);
      setHistory(hist);
      setActionSuccess("Customer confirmation simulated! Booking is now confirmed and ready for Worker Acceptance.");
    } catch (err: any) {
      console.error("Failed to simulate confirmation", err);
      setActionError(err?.message || "Simulation failed. Please verify booking status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // External Navigation Link
  const handleOpenNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Active Job Execution"
          description="Loading dispatch and route information..."
          breadcrumbs={[
            { label: "Worker Portal", href: "/worker" },
            { label: "Schedule & Jobs", href: "/worker/schedule?tab=active" },
            { label: "Active Job" },
          ]}
        />
        <Card className="p-12 text-center text-muted-foreground border-dashed">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-medium">Loading active job #{bookingId}...</p>
        </Card>
      </div>
    );
  }

  if (actionError && !job) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Active Job Execution"
          breadcrumbs={[
            { label: "Worker Portal", href: "/worker" },
            { label: "Schedule & Jobs", href: "/worker/schedule?tab=active" },
            { label: "Active Job" },
          ]}
        />
        <Card className="p-8 text-center text-destructive border-destructive/30 bg-destructive/5 space-y-3">
          <p className="text-base font-semibold">{actionError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/worker/schedule?tab=active")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Return to Schedule &amp; Jobs
          </Button>
        </Card>
      </div>
    );
  }

  if (!job) return null;

  // Canonical Stage Flags
  const isConfirmationPending = job.status === "CUSTOMER_CONFIRMATION_PENDING";
  const isConfirmed = job.status === "BOOKING_CONFIRMED";
  const isAccepted = job.status === "WORKER_ACCEPTED";
  const isOnTheWay = job.status === "ON_THE_WAY";
  const isArrived = job.status === "ARRIVED";
  const isOtpVerified = job.status === "OTP_VERIFIED";
  const isServiceStarted = job.status === "SERVICE_STARTED";
  const isServiceCompleted = job.status === "SERVICE_COMPLETED";
  const isBillGenerated = job.status === "BILL_GENERATED";
  const isPaymentPending = job.status === "PAYMENT_PENDING";
  const isPaymentReceived = job.status === "PAYMENT_RECEIVED";
  const isBookingCompleted = job.status === "BOOKING_COMPLETED";

  // Display badge
  const statusLabel = CANONICAL_STATUS_LABELS[job.status] || job.status;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Active Job #${job.bookingNumber}`}
        description={`${job.serviceTitle} for ${job.customerName}`}
        breadcrumbs={[
          { label: "Worker Portal", href: "/worker" },
          { label: "Schedule & Jobs", href: "/worker/schedule?tab=active" },
          { label: `Job #${job.bookingNumber}` },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/worker/schedule?tab=active")}
            className="text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Schedule
          </Button>
        }
      />

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/40 text-emerald-900 dark:text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Action Error Alert */}
      {actionError && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Real Customer Confirmation Pending Status */}
      {isConfirmationPending && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-600/40 space-y-1.5">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
              Awaiting Customer Confirmation
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your estimate has been submitted. The customer is reviewing the quotation in their Customer Portal and will confirm the booking directly.
          </p>
        </div>
      )}

      {/* Main Grid: Job Context & Dynamic Execution Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, RouteMap (during travel), and Service Workspace (after start) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Job Overview Card */}
          <Card className="border-border shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b pb-3 bg-muted/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-lg font-bold text-foreground">
                    {job.serviceTitle}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs font-semibold border-emerald-600/40 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                    {statusLabel}
                  </Badge>
                  {job.urgency === "EMERGENCY" && (
                    <Badge variant="destructive" className="text-xs font-bold">
                      EMERGENCY
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Customer & Location Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                    <User className="h-3.5 w-3.5 mr-1 text-primary" />
                    Customer Name
                  </span>
                  <p className="text-base font-bold text-foreground">{job.customerName}</p>
                  <p className="text-xs text-muted-foreground">Verified Household Customer</p>
                </div>

                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    Service Address
                  </span>
                  <p className="text-base font-bold text-foreground">{job.customerArea}</p>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Navigation className="h-3 w-3 mr-1 text-blue-600" />
                    Distance: <strong className="text-foreground ml-1">{computedDistance || job.distanceKm} km</strong>
                  </p>
                </div>
              </div>

              {/* Timing & Payout Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border bg-card space-y-1">
                  <span className="text-muted-foreground flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-amber-600" /> Date
                  </span>
                  <strong className="text-foreground block">{job.scheduledDate}</strong>
                </div>
                <div className="p-3 rounded-lg border bg-card space-y-1">
                  <span className="text-muted-foreground flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1 text-teal-600" /> Time
                  </span>
                  <strong className="text-foreground block">{job.scheduledTime}</strong>
                </div>
                <div className="p-3 rounded-lg border bg-card space-y-1">
                  <span className="text-muted-foreground block">Agreed Amount</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 block text-sm">
                    {formatINR(job.workerEstimateAmount || job.totalAmount)}
                  </strong>
                </div>
              </div>

              {/* Problem Scope */}
              <div className="space-y-1.5 pt-2 border-t text-xs">
                <span className="font-semibold text-muted-foreground flex items-center">
                  <FileText className="h-3.5 w-3.5 mr-1" /> Problem Specification
                </span>
                <p className="p-3 rounded-lg border bg-muted/20 text-foreground leading-relaxed">
                  {job.problemDescription}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SHARED GOOGLE MAP / ROUTEMAP (Visible in Travel & Arrival stages) */}
          {(isAccepted || isOnTheWay || isArrived) && (
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="p-4 border-b bg-muted/10 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-sm font-bold text-foreground">
                    Location &amp; Travel Directions
                  </CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenNavigation}
                  className="h-7 text-xs border-emerald-600/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50"
                >
                  <ExternalLink className="h-3 w-3 mr-1 text-emerald-600" />
                  Open in Maps
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <RouteMap
                  origin={origin}
                  destination={destination}
                  workerName="Ravi Patel (You)"
                  customerName={job.customerName}
                  onDistanceCalculated={(dist) => setComputedDistance(dist)}
                  className="w-full h-[320px] rounded-lg border border-border overflow-hidden shadow-inner"
                />

                <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground px-1 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" />
                    <span>Your Location: <strong>Navrangpura Trade Center</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" />
                    <span>Customer Destination: <strong>{job.customerArea}</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TASK 6: ACTIVE SERVICE WORKSPACE (Visible during & after SERVICE_STARTED) */}
          {(isServiceStarted || isServiceCompleted) && (
            <Card className="border-emerald-700/30 shadow-sm overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b bg-muted/10 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-base font-bold text-foreground">
                    Service Execution Workspace
                  </CardTitle>
                </div>
                <Badge variant={isServiceCompleted ? "secondary" : "default"} className="text-xs">
                  {isServiceCompleted ? "Work Completed" : "In Progress"}
                </Badge>
              </CardHeader>

              <CardContent className="p-5 space-y-5 text-xs sm:text-sm">
                {/* Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-emerald-600" /> Started At
                    </span>
                    <p className="font-bold text-foreground">
                      {job.actualStartAt ? new Date(job.actualStartAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                    </p>
                  </div>

                  {job.actualEndAt && (
                    <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Completed At
                      </span>
                      <p className="font-bold text-foreground">
                        {new Date(job.actualEndAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Work Notes */}
                <div className="space-y-2">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span>Technician Work Notes</span>
                    {isServiceStarted && (
                      <span className="text-[11px] text-muted-foreground font-normal">
                        Record diagnostic findings and work performed
                      </span>
                    )}
                  </label>
                  {isServiceStarted ? (
                    <textarea
                      rows={3}
                      value={workNotesInput}
                      onChange={(e) => setWorkNotesInput(e.target.value)}
                      placeholder="e.g. Disassembled faucet cartridge, replaced worn seal, cleaned aerator filter, and tested flow under line pressure."
                      className="w-full p-3 rounded-lg border bg-card text-foreground text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <p className="p-3 rounded-lg border bg-muted/20 text-foreground text-xs">
                      {job.workNotes || "No detailed notes entered."}
                    </p>
                  )}
                </div>

                {/* Materials Used */}
                <div className="space-y-2">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span>Materials &amp; Replacement Parts Used</span>
                    {isServiceStarted && (
                      <span className="text-[11px] text-muted-foreground font-normal">
                        Itemize spare parts for invoicing in Task 7
                      </span>
                    )}
                  </label>

                  {/* Material Input for Started State */}
                  {isServiceStarted && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMaterialInput}
                        onChange={(e) => setNewMaterialInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddMaterial();
                          }
                        }}
                        placeholder="e.g. Brass Cartridge 35mm, Teflon Tape"
                        className="flex-1 px-3 py-2 text-xs border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddMaterial}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                    </div>
                  )}

                  {/* Materials Tag List */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {materialsList.length > 0 ? (
                      materialsList.map((item, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="px-2.5 py-1 text-xs flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/30 text-emerald-900 dark:text-emerald-200"
                        >
                          <span>{item}</span>
                          {isServiceStarted && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(item)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No materials added yet.</span>
                    )}
                  </div>
                </div>

                {/* Before & After Documentation Photos */}
                <div className="space-y-2 pt-2 border-t">
                  <label className="font-semibold text-foreground">
                    Work Verification Photos (Before &amp; After)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Before Photo */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">1. Before Service (Initial State)</span>
                      {beforePhoto ? (
                        <div className="relative w-full h-36 rounded-lg overflow-hidden border bg-muted/20">
                          {/* eslint-disable-next-html-element-content-type */}
                          {/* eslint-disable-next-html-element-attribute */}
                          <img src={beforePhoto} alt="Before Service" className="w-full h-full object-cover" />
                          {isServiceStarted && (
                            <button
                              type="button"
                              onClick={() => setBeforePhoto(null)}
                              className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black text-white rounded-full text-xs"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ) : isServiceStarted ? (
                        <div
                          onClick={() => beforeFileInputRef.current?.click()}
                          className="border-2 border-dashed border-border hover:border-emerald-600 rounded-lg p-4 text-center cursor-pointer bg-muted/10 transition-colors"
                        >
                          <Camera className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                          <p className="text-xs font-medium text-foreground">Upload Before Photo</p>
                          <p className="text-[10px] text-muted-foreground">PNG or JPG up to 5MB</p>
                          <input
                            ref={beforeFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, "before")}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="h-24 rounded-lg border bg-muted/10 flex items-center justify-center text-xs text-muted-foreground italic">
                          No photo provided
                        </div>
                      )}
                    </div>

                    {/* After Photo */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">2. After Service (Completed Work)</span>
                      {afterPhoto ? (
                        <div className="relative w-full h-36 rounded-lg overflow-hidden border bg-muted/20">
                          {/* eslint-disable-next-html-element-content-type */}
                          {/* eslint-disable-next-html-element-attribute */}
                          <img src={afterPhoto} alt="After Service" className="w-full h-full object-cover" />
                          {isServiceStarted && (
                            <button
                              type="button"
                              onClick={() => setAfterPhoto(null)}
                              className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black text-white rounded-full text-xs"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ) : isServiceStarted ? (
                        <div
                          onClick={() => afterFileInputRef.current?.click()}
                          className="border-2 border-dashed border-border hover:border-emerald-600 rounded-lg p-4 text-center cursor-pointer bg-muted/10 transition-colors"
                        >
                          <Camera className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                          <p className="text-xs font-medium text-foreground">Upload After Photo</p>
                          <p className="text-[10px] text-muted-foreground">PNG or JPG up to 5MB</p>
                          <input
                            ref={afterFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, "after")}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="h-24 rounded-lg border bg-muted/10 flex items-center justify-center text-xs text-muted-foreground italic">
                          No photo provided
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Documentation Button (During Service) */}
                {isServiceStarted && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSaveDetails}
                      disabled={isSavingDetails}
                      className="text-xs border-emerald-600/40 text-emerald-800 dark:text-emerald-300"
                    >
                      {isSavingDetails ? (
                        <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 mr-1.5" />
                      )}
                      Save Documentation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Audit Status History Timeline */}
          {history.length > 0 && (
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="p-4 border-b pb-2 bg-muted/10">
                <CardTitle className="text-sm font-bold text-foreground flex items-center">
                  <History className="h-4 w-4 mr-1.5 text-primary" />
                  Dispatch Lifecycle &amp; Status History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                <div className="divide-y text-xs">
                  {history.map((hist, idx) => (
                    <div key={hist.id || idx} className="py-2 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                        <span className="font-semibold text-foreground">
                          {CANONICAL_STATUS_LABELS[hist.newStatus] || hist.newStatus}
                        </span>
                        {hist.notes && (
                          <span className="text-muted-foreground italic truncate max-w-xs">
                            — {hist.notes}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(hist.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Dynamic State Execution Actions */}
        <div className="space-y-5">
          <Card className="border-border shadow-sm sticky top-6">
            <CardHeader className="p-4 sm:p-5 border-b pb-3 bg-muted/10">
              <CardTitle className="text-base font-bold text-foreground">
                Execution Controls
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
              {/* STAGE 1: BOOKING_CONFIRMED -> Worker Accepts */}
              {isConfirmed && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-600/30 text-blue-900 dark:text-blue-200 space-y-1">
                    <div className="flex items-center font-bold">
                      <CheckCircle2 className="h-4 w-4 mr-1.5 text-blue-600 shrink-0" />
                      Booking Confirmed by Customer
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-blue-200/80">
                      The customer has approved your service estimate. Please accept the job to confirm your commitment.
                    </p>
                  </div>

                  <Button
                    onClick={handleAcceptJob}
                    disabled={isSubmitting}
                    className="w-full text-xs font-semibold py-3 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Accept Job
                  </Button>
                </div>
              )}

              {/* STAGE 2: WORKER_ACCEPTED -> Ready to Start Travel */}
              {isAccepted && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/30 text-emerald-900 dark:text-emerald-200 space-y-1">
                    <div className="flex items-center font-bold">
                      <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600 shrink-0" />
                      Job Accepted
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-emerald-200/80">
                      You are scheduled to provide this service. When you are ready to depart, click &ldquo;Start Travel&rdquo;.
                    </p>
                  </div>

                  <Button
                    onClick={handleStartTravel}
                    disabled={isSubmitting}
                    className="w-full text-xs font-semibold py-3 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Car className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Start Travel
                  </Button>
                </div>
              )}

              {/* STAGE 3: ON_THE_WAY -> In Transit & Arrived Action */}
              {isOnTheWay && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-600/30 text-teal-900 dark:text-teal-200 space-y-1.5">
                    <div className="flex items-center font-bold">
                      <Car className="h-4 w-4 mr-1.5 text-teal-600 shrink-0" />
                      You&apos;re On The Way
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-teal-200/80">
                      Customer is tracking your transit. Estimated distance: <strong>{computedDistance || job.distanceKm} km</strong> (~12 min).
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleOpenNavigation}
                    className="w-full text-xs border-emerald-600/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50"
                  >
                    <Navigation className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                    Open Navigation (Google Maps)
                  </Button>

                  <Button
                    onClick={handleMarkArrived}
                    disabled={isSubmitting}
                    className="w-full text-xs font-semibold py-3 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    I&apos;ve Arrived
                  </Button>
                </div>
              )}

              {/* STAGE 4: ARRIVED -> OTP Verification Required */}
              {isArrived && (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-600/30 text-amber-950 dark:text-amber-200 space-y-1">
                    <div className="flex items-center font-bold text-amber-900 dark:text-amber-300">
                      <KeyRound className="h-4 w-4 mr-1.5 text-amber-600 shrink-0" />
                      Verify Customer OTP
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-amber-200/80">
                      Enter the 6-digit OTP provided by the customer to verify the service start.
                    </p>
                  </div>

                  {/* OTP Input Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Customer OTP Code:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otpInput}
                      onChange={(e) => {
                        setOtpInput(e.target.value.replace(/\D/g, ""));
                        setOtpError(null);
                      }}
                      className="w-full text-center tracking-widest font-mono text-lg font-bold py-2 px-3 border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    {otpError && (
                      <p className="text-[11px] text-destructive font-medium flex items-center pt-0.5">
                        <AlertCircle className="h-3 w-3 mr-1 shrink-0" />
                        {otpError}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => handleVerifyOtp()}
                    disabled={isSubmitting || otpInput.length !== 6}
                    className="w-full text-xs font-semibold py-3 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Verify OTP
                  </Button>

                  {/* Development Helper for OTP */}
                  <div className="p-2.5 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Dev OTP:</span>
                      <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                        {job.otpCode || "940218"}
                      </strong>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyOtp(job.otpCode || "940218")}
                      className="w-full h-7 text-[10px] border-emerald-600/40 text-emerald-800 dark:text-emerald-300"
                    >
                      Autofill &amp; Verify (Dev)
                    </Button>
                  </div>
                </div>
              )}

              {/* STAGE 5: OTP_VERIFIED -> Ready to Start Service */}
              {isOtpVerified && (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/40 text-emerald-900 dark:text-emerald-200 space-y-1">
                    <div className="flex items-center font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600 shrink-0" />
                      Customer Verified
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-emerald-200/80">
                      OTP verified successfully. You can now start the service.
                    </p>
                  </div>

                  <Button
                    onClick={handleStartService}
                    disabled={isSubmitting}
                    className="w-full text-xs font-semibold py-3 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Start Service
                  </Button>
                </div>
              )}

              {/* STAGE 6: SERVICE_STARTED -> Service In Progress & Complete Service Action */}
              {isServiceStarted && (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-600/40 text-blue-900 dark:text-blue-200 space-y-1">
                    <div className="flex items-center font-bold text-blue-800 dark:text-blue-300">
                      <Wrench className="h-4 w-4 mr-1.5 text-blue-600 shrink-0" />
                      Service In Progress
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-blue-200/80">
                      Work is underway. Document your notes and replacement parts in the workspace on the left.
                    </p>
                  </div>

                  <Button
                    onClick={() => setIsCompleteModalOpen(true)}
                    className="w-full text-xs font-semibold py-3 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Complete Service
                  </Button>
                </div>
              )}

              {/* STAGE 7: SERVICE_COMPLETED -> Create Service Bill */}
              {isServiceCompleted && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/40 text-emerald-900 dark:text-emerald-200 space-y-1.5">
                    <div className="flex items-center font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600 shrink-0" />
                      Service Execution Completed
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-emerald-200/80">
                      Actual on-site work is completed. Please create the final service bill and itemize materials used.
                    </p>
                  </div>

                  <Button
                    onClick={() => router.push(`/worker/jobs/${job.id}/bill`)}
                    className="w-full text-xs font-semibold py-3 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Create Service Bill
                  </Button>
                </div>
              )}

              {/* STAGE 8: BILL_GENERATED / PAYMENT_PENDING -> Awaiting Customer Payment */}
              {(isBillGenerated || isPaymentPending) && (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-600/30 text-amber-950 dark:text-amber-200 space-y-1.5">
                    <div className="flex items-center font-bold text-amber-900 dark:text-amber-300">
                      <Clock className="h-4 w-4 mr-1.5 text-amber-600 shrink-0" />
                      Awaiting Customer Payment
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-amber-200/80">
                      Invoice has been generated. The customer will review and pay from their portal.
                    </p>
                  </div>

                  {/* Bill Details Box */}
                  <div className="p-3 rounded-lg border bg-card space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Invoice Reference:</span>
                      <span className="font-mono font-bold text-foreground">
                        {job.invoiceNumber || "INV-PENDING"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Final Bill Total:</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                        {formatINR(job.invoiceTotal || job.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Payment Status:</span>
                      <Badge variant="outline" className="text-[10px] border-amber-600 text-amber-800 dark:text-amber-300">
                        {job.paymentStatus || "PENDING"}
                      </Badge>
                    </div>
                  </div>

                  {/* Customer Payment In-Progress Notice */}
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                      Awaiting Customer Settlement
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      The customer has received the invoice and is paying via the Customer Dashboard. This screen will update automatically to <strong>Booking Completed</strong> once payment is verified.
                    </p>
                  </div>
                </div>
              )}

              {/* STAGE 9: PAYMENT_RECEIVED / BOOKING_COMPLETED -> Terminal Workflow Success */}
              {(isPaymentReceived || isBookingCompleted) && (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/40 text-emerald-900 dark:text-emerald-200 space-y-1.5">
                    <div className="flex items-center font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600 shrink-0" />
                      Booking Completed &amp; Paid
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-emerald-200/80">
                      Customer payment confirmed. Worker earnings have been updated and your availability status has been reset to <strong>AVAILABLE</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-card space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Settlement Amount:</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatINR(job.workerEarnings || Math.round((job.invoiceTotal || job.totalAmount) * 0.95))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Availability Status:</span>
                      <span className="font-bold text-emerald-600">AVAILABLE</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push("/worker/earnings")}
                    className="w-full text-xs font-semibold py-3 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    View in Worker Earnings
                  </Button>
                </div>
              )}

              {/* Cooperative Safety Protocol */}
              <div className="p-3 rounded-lg bg-muted/20 border text-xs text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground flex items-center">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Cooperative Protocol
                </span>
                <p className="text-[11px] leading-relaxed">
                  Verify tool safety, cooperative member ID, and customer greeting etiquette upon arrival.
                </p>
              </div>

              <div className="pt-2 border-t flex items-center text-[11px] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600 shrink-0" />
                <span>{job.cooperativeName} dispatch protocol.</span>
              </div>
            </CardContent>

            <CardFooter className="p-4 sm:p-5 border-t bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/worker/schedule?tab=active")}
                className="w-full text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back to Schedule &amp; Jobs
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog: Complete Service (Part 13) */}
      <Dialog
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Complete this service?"
        description="The service will be marked completed. Billing will be handled next."
        footer={
          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompleteModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCompleteService}
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
            >
              {isSubmitting ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1.5" />
              )}
              Complete Service
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            Please ensure you have inspected the repaired fittings with the customer and entered all replacement materials.
          </p>

          <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agreed Estimate:</span>
              <strong className="text-foreground">{formatINR(job.workerEstimateAmount || job.totalAmount)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Materials itemized:</span>
              <strong className="text-foreground">{materialsList.length} items</strong>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
