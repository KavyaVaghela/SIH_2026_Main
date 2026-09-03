"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Clock,
  Wrench,
  ShieldCheck,
  AlertCircle,
  FileText,
  DollarSign,
  Eye,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Send,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/formatters/currency";
import { workerJobService } from "../services/worker-job-service";
import type { WorkerJobItem } from "../types";

export interface WorkerEstimateFormViewProps {
  requestId: string;
}

export function WorkerEstimateFormView({ requestId }: WorkerEstimateFormViewProps) {
  const router = useRouter();
  const [job, setJob] = React.useState<WorkerJobItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Form State
  const [laborAmount, setLaborAmount] = React.useState<string>("");
  const [materialAmount, setMaterialAmount] = React.useState<string>("0");
  const [additionalCharges, setAdditionalCharges] = React.useState<string>("0");
  const [notes, setNotes] = React.useState<string>("");

  // Stepper State: 'FORM' | 'PREVIEW' | 'SUBMITTED'
  const [step, setStep] = React.useState<"FORM" | "PREVIEW" | "SUBMITTED">("FORM");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await workerJobService.getJobDetails(requestId);
        if (data) {
          setJob(data);
          // If existing estimate, initialize fields
          if (data.workerEstimateAmount) {
            setLaborAmount(String(data.workerEstimateLabor || Math.round(data.workerEstimateAmount * 0.7)));
            setMaterialAmount(String(data.workerEstimateMaterials || Math.round(data.workerEstimateAmount * 0.3)));
            setNotes(data.workerEstimateNotes || "");
            setStep("SUBMITTED");
          } else {
            // Default initial recommendation based on platform estimate
            const recommendedLabor = Math.round((data.totalAmount || 500) * 0.7);
            const recommendedMaterials = Math.round((data.totalAmount || 500) * 0.3);
            setLaborAmount(String(recommendedLabor));
            setMaterialAmount(String(recommendedMaterials));
          }
        } else {
          setError("Job request not found.");
        }
      } catch (err) {
        console.error("Failed to load job details for estimate", err);
        setError("Failed to load job request details.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [requestId]);

  // Calculations
  const numLabor = parseFloat(laborAmount) || 0;
  const numMaterials = parseFloat(materialAmount) || 0;
  const numAdditional = parseFloat(additionalCharges) || 0;
  const totalCalculated = Math.round((numLabor + numMaterials + numAdditional) * 100) / 100;
  const minVisitCharge = job?.minimumVisitCharge || 200;
  const isBelowMinimum = totalCalculated > 0 && totalCalculated < minVisitCharge;

  // Step 1 -> Step 2: Validate and Preview
  const handleProceedToPreview = () => {
    setValidationError(null);

    if (numLabor <= 0) {
      setValidationError("Labour charge must be greater than ₹0.");
      return;
    }
    if (numMaterials < 0 || numAdditional < 0) {
      setValidationError("Material and additional charges cannot be negative.");
      return;
    }
    if (totalCalculated < minVisitCharge) {
      setValidationError(
        `Total estimate (₹${totalCalculated}) cannot be lower than the minimum visit charge of ₹${minVisitCharge}.`
      );
      return;
    }

    setStep("PREVIEW");
  };

  // Step 2 -> Step 3: Submit Estimate
  const handleSubmitEstimate = async () => {
    if (!job || isSubmitting) return;
    setIsSubmitting(true);
    setValidationError(null);

    try {
      const updated = await workerJobService.submitWorkerEstimate({
        bookingId: job.id,
        workerId: "w-1",
        laborAmount: numLabor,
        materialAmount: numMaterials,
        additionalCharges: numAdditional,
        notes: notes.trim() || "Itemized service inspection quotation prepared by worker.",
      });

      setJob(updated);
      setStep("SUBMITTED");
    } catch (err: any) {
      console.error("Failed to submit worker estimate", err);
      setValidationError(err?.message || "Failed to submit estimate. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Create Service Estimate"
          description="Loading request specifications..."
          breadcrumbs={[
            { label: "Worker Portal", href: "/worker" },
            { label: "Schedule & Jobs", href: "/worker/schedule?tab=requests" },
            { label: "Estimate" },
          ]}
        />
        <Card className="p-12 text-center text-muted-foreground border-dashed">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-medium">Loading request #{requestId} for quotation...</p>
        </Card>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Create Service Estimate"
          breadcrumbs={[
            { label: "Worker Portal", href: "/worker" },
            { label: "Schedule & Jobs", href: "/worker/schedule?tab=requests" },
            { label: "Estimate" },
          ]}
        />
        <Card className="p-8 text-center text-destructive border-destructive/30 bg-destructive/5 space-y-3">
          <p className="text-base font-semibold">{error || "Request record unavailable."}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/worker/schedule?tab=requests")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Return to Requests
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={step === "SUBMITTED" ? "Estimate Submitted" : "Create Service Estimate"}
        description={`Itemized quotation for Request #${job.bookingNumber} (${job.serviceTitle})`}
        breadcrumbs={[
          { label: "Worker Portal", href: "/worker" },
          { label: "Schedule & Jobs", href: "/worker/schedule?tab=requests" },
          { label: `Request #${job.bookingNumber}`, href: `/worker/jobs/requests/${job.id}` },
          { label: "Estimate" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/worker/jobs/requests/${job.id}`)}
            className="text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Request
          </Button>
        }
      />

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* STEP 3: SUBMITTED CONFIRMATION SCREEN */}
      {step === "SUBMITTED" && (
        <Card className="border-emerald-600/40 bg-card shadow-sm overflow-hidden">
          <CardHeader className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-600/20">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base font-bold">
                Worker Estimate Successfully Submitted
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="p-4 rounded-lg bg-muted/20 border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                <div>
                  <span className="text-xs text-muted-foreground block">Customer</span>
                  <strong className="text-sm text-foreground">{job.customerName}</strong>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Service</span>
                  <strong className="text-sm text-foreground">{job.serviceTitle}</strong>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Current State</span>
                  <Badge variant="success" className="text-xs">
                    Waiting for Customer Confirmation
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Labour Component:</span>
                  <p className="text-sm font-bold text-foreground">
                    {formatINR(job.workerEstimateLabor || numLabor)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Material Component:</span>
                  <p className="text-sm font-bold text-foreground">
                    {formatINR(job.workerEstimateMaterials || numMaterials)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Quoted Amount:</span>
                  <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                    {formatINR(job.workerEstimateAmount || totalCalculated)}
                  </p>
                </div>
              </div>

              {job.workerEstimateNotes && (
                <div className="pt-2 border-t text-xs">
                  <span className="text-muted-foreground block mb-0.5">Quotation Notes:</span>
                  <p className="text-foreground italic">{job.workerEstimateNotes}</p>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-600/30 text-xs text-blue-900 dark:text-blue-200 flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Next Step:</strong> The customer has received an in-app notification with your estimate. Once they review and confirm, the booking will transition to confirmed status on your daily schedule.
              </span>
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-5 border-t bg-muted/10 flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep("FORM")}
              className="text-xs"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              Update Estimate
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/worker/jobs/requests/${job.id}`)}
                className="text-xs"
              >
                View Request Details
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/worker/schedule?tab=requests")}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                Return to Requests
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: PREVIEW MODE */}
      {step === "PREVIEW" && (
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b bg-muted/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <Eye className="h-4 w-4 mr-2 text-emerald-600" />
                Estimate Preview &amp; Verification
              </CardTitle>
              <Badge variant="outline" className="text-xs font-semibold">
                Step 2 of 2: Confirm &amp; Submit
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="p-4 rounded-lg border bg-card space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b pb-3">
                <div>
                  <span className="text-muted-foreground block">Worker</span>
                  <strong className="text-foreground">Ravi Patel</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Customer</span>
                  <strong className="text-foreground">{job.customerName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Service</span>
                  <strong className="text-foreground">{job.serviceTitle}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Location</span>
                  <strong className="text-foreground">{job.customerArea}</strong>
                </div>
              </div>

              {/* Cost Itemization */}
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Estimated Labour / Service:</span>
                  <span className="font-semibold text-foreground">{formatINR(numLabor)}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Estimated Material Charges:</span>
                  <span className="font-semibold text-foreground">{formatINR(numMaterials)}</span>
                </div>
                {numAdditional > 0 && (
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Additional Service Charges:</span>
                    <span className="font-semibold text-foreground">{formatINR(numAdditional)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-sm sm:text-base font-bold">
                  <span className="text-foreground">Total Quoted Estimate:</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {formatINR(totalCalculated)}
                  </span>
                </div>
              </div>

              {notes.trim() && (
                <div className="p-3 rounded bg-muted/20 border text-xs space-y-1">
                  <span className="text-muted-foreground font-semibold block">Quotation Scope &amp; Notes:</span>
                  <p className="text-foreground">{notes}</p>
                </div>
              )}
            </div>

            {/* Mandatory Regulatory Statement */}
            <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-600/30 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Cooperative Transparency Notice:</strong> Final bill may vary based on actual work, materials used, work complexity, and approved additional work.
              </span>
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-5 border-t bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep("FORM")}
              disabled={isSubmitting}
              className="text-xs"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              Edit Estimate
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitEstimate}
              disabled={isSubmitting}
              className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 px-6 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Submitting Estimate...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Submit Estimate to Customer
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 1: ESTIMATE FORM */}
      {step === "FORM" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form Inputs */}
          <div className="lg:col-span-2 space-y-5">
            {/* Request Summary Banner */}
            <Card className="border-border shadow-sm">
              <CardHeader className="p-4 sm:p-5 border-b pb-3 bg-muted/10">
                <CardTitle className="text-sm font-bold text-foreground flex items-center">
                  <Wrench className="h-4 w-4 mr-1.5 text-emerald-600" />
                  Request Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground flex items-center mb-0.5">
                    <User className="h-3 w-3 mr-1" /> Customer
                  </span>
                  <strong className="text-foreground">{job.customerName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center mb-0.5">
                    <MapPin className="h-3 w-3 mr-1" /> Locality
                  </span>
                  <strong className="text-foreground">{job.customerArea}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center mb-0.5">
                    <Calendar className="h-3 w-3 mr-1" /> Requested Date
                  </span>
                  <strong className="text-foreground">{job.scheduledDate}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center mb-0.5">
                    <Clock className="h-3 w-3 mr-1" /> Requested Time
                  </span>
                  <strong className="text-foreground">{job.scheduledTime}</strong>
                </div>
                <div className="col-span-2 sm:col-span-4 pt-2 border-t text-muted-foreground">
                  <span className="font-semibold text-foreground">Problem: </span>
                  {job.problemDescription}
                </div>
              </CardContent>
            </Card>

            {/* Form Inputs Card */}
            <Card className="border-border shadow-sm">
              <CardHeader className="p-4 sm:p-5 border-b pb-3 bg-muted/10">
                <CardTitle className="text-base font-bold text-foreground">
                  Quotation Itemization
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {/* Labour Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Estimated Labour / Service Charge (₹) *</span>
                    <span className="text-muted-foreground font-normal">Required</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={1}
                      step={10}
                      placeholder="e.g. 400"
                      value={laborAmount}
                      onChange={(e) => setLaborAmount(e.target.value)}
                      className="pl-9 text-sm font-semibold h-10"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Covers labor, expertise, and standard tooling for this trade assignment.
                  </p>
                </div>

                {/* Materials Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Estimated Material / Parts Charges (₹)</span>
                    <span className="text-muted-foreground font-normal">Optional</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      step={10}
                      placeholder="e.g. 150"
                      value={materialAmount}
                      onChange={(e) => setMaterialAmount(e.target.value)}
                      className="pl-9 text-sm font-semibold h-10"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Cost of valves, washers, cables, or hardware required for installation.
                  </p>
                </div>

                {/* Additional Charges Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Additional / Special Charges (₹)</span>
                    <span className="text-muted-foreground font-normal">Optional</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      step={10}
                      placeholder="e.g. 50"
                      value={additionalCharges}
                      onChange={(e) => setAdditionalCharges(e.target.value)}
                      className="pl-9 text-sm font-semibold h-10"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Applicable for specialized scaffolding, heavy drilling, or emergency transit.
                  </p>
                </div>

                {/* Notes Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Work Scope &amp; Assessment Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe specific work items (e.g., Replacement of wall mixer cartridge and leak sealing for basin joint)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right 1 Col: Pricing Distinctions & Action */}
          <div className="space-y-5">
            <Card className="border-border shadow-sm">
              <CardHeader className="p-4 sm:p-5 border-b pb-3 bg-muted/10">
                <CardTitle className="text-base font-bold text-foreground">
                  Pricing Distinctions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
                {/* 1. Platform Estimate */}
                <div className="p-3 rounded-lg bg-muted/20 border space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Initial Platform Estimate:</span>
                    <strong className="text-sm text-foreground">{formatINR(job.totalAmount)}</strong>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    The platform estimate is an initial estimate based on standard service information.
                  </p>
                </div>

                {/* 2. Minimum Visit Charge */}
                <div className="p-3 rounded-lg bg-muted/20 border space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Minimum Visit Charge:</span>
                    <strong className="text-sm text-foreground">{formatINR(minVisitCharge)}</strong>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Minimum standard charge enforced by the cooperative tariff schedule.
                  </p>
                </div>

                {/* 3. Worker Estimate Calculation */}
                <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/30 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-800 dark:text-emerald-300 font-bold">Your Service Estimate:</span>
                    <strong className="text-base text-emerald-700 dark:text-emerald-400 font-bold">
                      {formatINR(totalCalculated)}
                    </strong>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your estimate reflects your assessment of the requested work.
                  </p>
                </div>

                {isBelowMinimum && (
                  <div className="p-2.5 rounded bg-destructive/10 border border-destructive/30 text-destructive text-[11px] flex items-center space-x-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Total cannot be below minimum visit charge of {formatINR(minVisitCharge)}.</span>
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground italic border-t pt-2">
                  The final bill may differ after the actual work is completed.
                </div>
              </CardContent>

              <CardFooter className="p-4 sm:p-5 border-t bg-muted/20 flex flex-col gap-2.5">
                <Button
                  onClick={handleProceedToPreview}
                  disabled={totalCalculated <= 0 || isBelowMinimum}
                  className="w-full text-xs font-semibold py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Preview Estimate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/worker/jobs/requests/${job.id}`)}
                  className="w-full text-xs"
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
