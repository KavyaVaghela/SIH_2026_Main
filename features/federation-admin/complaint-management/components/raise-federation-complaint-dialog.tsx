"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import {
  FEDERATION_COMPLAINT_CATEGORIES,
  type FederationComplaintCategory,
} from "../types";
import type { GrievancePriority } from "@/types/complaints/v2";

interface RaiseFederationComplaintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<boolean>;
  isSubmitting: boolean;
  federationName?: string;
}

function Label({
  htmlFor,
  className = "",
  children,
}: {
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={`block text-xs font-semibold ${className}`}>
      {children}
    </label>
  );
}

export function RaiseFederationComplaintDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  federationName,
}: RaiseFederationComplaintDialogProps) {
  const [category, setCategory] = React.useState<FederationComplaintCategory>(
    FEDERATION_COMPLAINT_CATEGORIES[0]
  );
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<GrievancePriority>("MEDIUM");
  const [additionalInfo, setAdditionalInfo] = React.useState("");

  // File upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Validation
  const [formError, setFormError] = React.useState<string | null>(null);

  // Cleanup preview URL on unmount or file change
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetForm = () => {
    setCategory(FEDERATION_COMPLAINT_CATEGORIES[0]);
    setSubject("");
    setDescription("");
    setPriority("MEDIUM");
    setAdditionalInfo("");
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileError(null);
    setFormError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setFileError("Invalid format. Only JPG, JPEG, and PNG images are supported.");
      return;
    }

    // Validate MIME type
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      setFileError("Unsupported file type. Please upload a standard JPG or PNG image.");
      return;
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError("File size exceeds maximum allowed limit of 5MB.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!subject.trim()) {
      setFormError("Complaint subject / title is required.");
      return;
    }

    if (!description.trim()) {
      setFormError("Problem description is required.");
      return;
    }

    const formData = new FormData();
    formData.append("category", category);
    formData.append("subject", subject.trim());
    formData.append("description", description.trim());
    formData.append("priority", priority);

    if (additionalInfo.trim()) {
      formData.append("subcategory", additionalInfo.trim());
    }

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    const success = await onSubmit(formData);
    if (success) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
            <ShieldAlert className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold">Raise Federation Complaint</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Lodge an official grievance from{" "}
            <strong>{federationName || "your federation"}</strong> to the Super Admin for central platform arbitration.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Category Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="complaint-category" className="text-xs font-semibold">
              Complaint Category <span className="text-rose-500">*</span>
            </Label>
            <select
              id="complaint-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as FederationComplaintCategory)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {FEDERATION_COMPLAINT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Subject / Headline */}
          <div className="space-y-1.5">
            <Label htmlFor="complaint-subject" className="text-xs font-semibold">
              Subject / Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="complaint-subject"
              placeholder="e.g., Delay in platform disbursement settlement for Zone 2"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label htmlFor="complaint-priority" className="text-xs font-semibold">
              Suggested Priority (Optional)
            </Label>
            <select
              id="complaint-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as GrievancePriority)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="LOW">Low — Administrative enquiry</option>
              <option value="MEDIUM">Medium — Standard dispute</option>
              <option value="HIGH">High — Urgent financial or operational impediment</option>
              <option value="CRITICAL">Critical — Safety hazard or systemic outage</option>
            </select>
          </div>

          {/* Problem Description */}
          <div className="space-y-1.5">
            <Label htmlFor="complaint-description" className="text-xs font-semibold">
              Problem Description <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="complaint-description"
              placeholder="Provide complete details regarding the incident, affected workers or bookings, and impact on federation operations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="text-xs"
              required
            />
          </div>

          {/* Additional Information */}
          <div className="space-y-1.5">
            <Label htmlFor="complaint-additional-info" className="text-xs font-semibold">
              Additional Information (Optional)
            </Label>
            <Textarea
              id="complaint-additional-info"
              placeholder="Any supplementary references, ticket numbers, or relevant dates..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Evidence Upload (Phase 1 Compliant) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Evidence Image (Optional)</Label>
            <p className="text-[11px] text-muted-foreground">
              Attach supporting evidence. Supported formats: <strong>JPG, JPEG, PNG</strong> (max 5MB).
            </p>

            {previewUrl ? (
              <div className="relative rounded-lg border border-border p-2 bg-muted/20 w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Evidence preview"
                  className="h-32 w-auto max-w-full rounded object-cover border border-border"
                />
                <div className="flex items-center justify-between gap-2 mt-2">
                  <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px]">
                    {selectedFile?.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="fed-evidence-input"
                />
                <label
                  htmlFor="fed-evidence-input"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 rounded-lg p-4 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs font-semibold text-foreground">Click to upload evidence photo</span>
                  <span className="text-[10px] text-muted-foreground">JPG, JPEG or PNG up to 5MB</span>
                </label>
              </div>
            )}

            {fileError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {fileError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Submitting Complaint...
                </>
              ) : (
                "Submit Complaint to Super Admin"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
