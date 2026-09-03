"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  FileEdit,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  changeRequestSchema,
  changeRequestFieldOptions,
  type ChangeRequestFormData,
} from "../schemas/change-request-schema";
import type { OfficialFederationDetails, ChangeRequestField } from "../types";

interface ChangeRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  officialDetails: OfficialFederationDetails;
  initialField?: ChangeRequestField | null;
  onSubmit: (data: ChangeRequestFormData) => Promise<boolean>;
  isSubmitting: boolean;
}

export function ChangeRequestDialog({
  isOpen,
  onClose,
  officialDetails,
  initialField,
  onSubmit,
  isSubmitting,
}: ChangeRequestDialogProps) {
  // Confirmation step state
  const [isConfirming, setIsConfirming] = React.useState<boolean>(false);
  const [pendingFormData, setPendingFormData] = React.useState<ChangeRequestFormData | null>(null);

  // Helper to resolve current value based on selected field
  const getCurrentValueForField = React.useCallback(
    (field: ChangeRequestField): string => {
      switch (field) {
        case "name":
          return officialDetails.name;
        case "registrationNumber":
          return officialDetails.registrationNumber;
        case "address":
          return officialDetails.address;
        case "serviceRegion":
          return officialDetails.serviceRegion;
        case "contactEmail":
          return officialDetails.contactEmail;
        case "contactPhone":
          return officialDetails.contactPhone;
        case "officialDocuments":
          return "4 Registered Documents (Registration, Bylaws, GSTIN, Audit Report)";
        default:
          return "";
      }
    },
    [officialDetails]
  );

  const selectedInitialField = initialField || "name";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangeRequestFormData>({
    resolver: zodResolver(changeRequestSchema),
    defaultValues: {
      field: selectedInitialField,
      currentValue: getCurrentValueForField(selectedInitialField),
      requestedValue: "",
      reason: "",
      supportingDocumentNote: "",
    },
  });

  const currentField = watch("field");
  const currentValue = watch("currentValue");

  // When initialField prop changes or modal opens, reset form values
  React.useEffect(() => {
    if (isOpen) {
      const field = initialField || "name";
      const currentVal = getCurrentValueForField(field);
      reset({
        field,
        currentValue: currentVal,
        requestedValue: "",
        reason: "",
        supportingDocumentNote: "",
      });
      setIsConfirming(false);
      setPendingFormData(null);
    }
  }, [isOpen, initialField, getCurrentValueForField, reset]);

  // When field dropdown changes, update currentValue
  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newField = e.target.value as ChangeRequestField;
    setValue("field", newField, { shouldValidate: true });
    setValue("currentValue", getCurrentValueForField(newField), { shouldValidate: true });
  };

  const onPreSubmit = (data: ChangeRequestFormData) => {
    setPendingFormData(data);
    setIsConfirming(true);
  };

  const handleFinalConfirmSubmit = async () => {
    if (!pendingFormData) return;
    const success = await onSubmit(pendingFormData);
    if (success) {
      setIsConfirming(false);
      setPendingFormData(null);
    }
  };

  return (
    <>
      <Dialog
        isOpen={isOpen && !isConfirming}
        onClose={onClose}
        title={
          <div className="flex items-center space-x-2 text-foreground">
            <FileEdit className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <span>Request Official Information Change</span>
          </div>
        }
        description="Submit a formal amendment proposal to the Super Admin Directorate. Official records remain unchanged until reviewed and approved."
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-4 text-xs">
          {/* Regulatory Notice Banner */}
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="leading-relaxed">
              <strong className="font-semibold">Statutory Governance Workflow:</strong> Under cooperative regulations, changes to official records are not instantaneous. The Federation Admin submits the request, which is routed to the Super Admin audit queue.
            </p>
          </div>

          {/* 1. Field Selection */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-foreground">
              Official Section / Field Being Changed <span className="text-destructive">*</span>
            </label>
            <Select
              value={currentField}
              onChange={handleFieldChange}
              error={!!errors.field}
            >
              {changeRequestFieldOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {errors.field && (
              <p className="text-[11px] text-destructive flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.field.message}</span>
              </p>
            )}
          </div>

          {/* 2. Current Official Value (Read-Only Display) */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-muted-foreground">
              Current Official Record (Active in Database)
            </label>
            <div className="p-2.5 rounded-md border border-border bg-muted/40 font-mono text-xs text-foreground select-all break-all">
              {currentValue || "No recorded value"}
            </div>
            <input type="hidden" {...register("currentValue")} />
            {errors.currentValue && (
              <p className="text-[11px] text-destructive">{errors.currentValue.message}</p>
            )}
          </div>

          {/* 3. Requested New Value */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-foreground">
              Proposed New Value <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Enter exact proposed new value..."
              {...register("requestedValue")}
              error={!!errors.requestedValue}
            />
            {errors.requestedValue ? (
              <p className="text-[11px] text-destructive flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.requestedValue.message}</span>
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Must be an exact, verified value reflecting the official legal modification.
              </p>
            )}
          </div>

          {/* 4. Reason for Change */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-foreground">
              Justification & Administrative Rationale <span className="text-destructive">*</span>
            </label>
            <Textarea
              rows={3}
              placeholder="Detail the operational, legal, or municipal reason for this change (minimum 10 characters)..."
              {...register("reason")}
              error={!!errors.reason}
            />
            {errors.reason ? (
              <p className="text-[11px] text-destructive flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.reason.message}</span>
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Explain clearly for the reviewing Super Admin (e.g., Board resolution, office relocation, municipal rezoning).
              </p>
            )}
          </div>

          {/* 5. Supporting Document Note */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-foreground">
              Supporting Reference / Document Note <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <Input
              placeholder="e.g. Board Resolution No. 42/2026, Municipal Gazette Notification #109"
              {...register("supportingDocumentNote")}
              error={!!errors.supportingDocumentNote}
            />
            {errors.supportingDocumentNote && (
              <p className="text-[11px] text-destructive">{errors.supportingDocumentNote.message}</p>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-800 hover:bg-emerald-900 text-white"
            >
              Continue to Confirmation
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Step Dialog */}
      <Dialog
        isOpen={isOpen && isConfirming}
        onClose={() => setIsConfirming(false)}
        title="Confirm Change Request Submission"
        description="Please verify your submission details before dispatching to the Super Admin audit queue."
        className="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2.5">
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Target Field:</span>
              <span className="font-semibold text-foreground">
                {changeRequestFieldOptions.find((o) => o.value === pendingFormData?.field)?.label || pendingFormData?.field}
              </span>
            </div>

            <div className="space-y-1 py-1 border-b border-border/60">
              <span className="text-muted-foreground block text-[11px]">Current Official Value:</span>
              <span className="font-mono text-muted-foreground block bg-background/80 p-1.5 rounded border border-border/40 line-through">
                {pendingFormData?.currentValue}
              </span>
            </div>

            <div className="space-y-1 py-1 border-b border-border/60">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold block text-[11px]">
                Requested New Value:
              </span>
              <span className="font-mono text-foreground font-medium block bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded border border-emerald-500/20">
                {pendingFormData?.requestedValue}
              </span>
            </div>

            <div className="space-y-1 py-1">
              <span className="text-muted-foreground block text-[11px]">Administrative Rationale:</span>
              <p className="text-foreground leading-relaxed italic bg-background/80 p-2 rounded border border-border/40">
                "{pendingFormData?.reason}"
              </p>
            </div>

            {pendingFormData?.supportingDocumentNote && (
              <div className="space-y-1 pt-1 border-t border-border/60">
                <span className="text-muted-foreground block text-[11px]">Document Reference:</span>
                <span className="text-foreground font-medium">
                  {pendingFormData.supportingDocumentNote}
                </span>
              </div>
            )}
          </div>

          <div className="p-3 bg-muted/40 rounded border border-border/60 text-muted-foreground text-[11px] flex items-start space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              By clicking <strong className="text-foreground">Submit Formal Request</strong>, this proposal will be logged under status <strong className="text-amber-700 dark:text-amber-400">Pending</strong>. Canonical federation records will remain intact.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirming(false)}
              disabled={isSubmitting}
            >
              Back to Edit
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleFinalConfirmSubmit}
              disabled={isSubmitting}
              className="bg-emerald-800 hover:bg-emerald-900 text-white"
            >
              {isSubmitting ? "Submitting Request..." : "Submit Formal Request"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
