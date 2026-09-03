"use client";

import * as React from "react";
import { federationInformationService } from "../services/federation-information-service";
import type {
  FederationInformationData,
  FederationChangeRequest,
  ChangeRequestField,
} from "../types";
import { changeRequestFieldOptions, type ChangeRequestFormData } from "../schemas/change-request-schema";
import type { ToastMessage } from "@/components/ui/toast";

export function useFederationInformation() {
  const [data, setData] = React.useState<FederationInformationData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialogs state
  const [isChangeDialogOpen, setIsChangeDialogOpen] = React.useState<boolean>(false);
  const [selectedFieldForChange, setSelectedFieldForChange] = React.useState<ChangeRequestField | null>(null);
  const [selectedRequestForDetail, setSelectedRequestForDetail] = React.useState<FederationChangeRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Toasts feedback
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((title: string, description: string, variant: ToastMessage["variant"] = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastMessage = { id, title, description, variant };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await federationInformationService.getFederationInformation();
      setData(result);
    } catch (err) {
      console.error("Failed to load federation information:", err);
      setError("Unable to load statutory federation records. Please verify connectivity.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openChangeDialog = (field?: ChangeRequestField) => {
    setSelectedFieldForChange(field || "name");
    setIsChangeDialogOpen(true);
  };

  const closeChangeDialog = () => {
    setIsChangeDialogOpen(false);
    setSelectedFieldForChange(null);
  };

  const openDetailDialog = (request: FederationChangeRequest) => {
    setSelectedRequestForDetail(request);
    setIsDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedRequestForDetail(null);
  };

  const handleSubmitChangeRequest = async (formData: ChangeRequestFormData): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const fieldOption = changeRequestFieldOptions.find((opt) => opt.value === formData.field);
      const fieldLabel = fieldOption ? fieldOption.label : formData.field;

      const newRequest = await federationInformationService.submitChangeRequest({
        field: formData.field,
        fieldLabel,
        currentValue: formData.currentValue,
        requestedValue: formData.requestedValue,
        reason: formData.reason,
        supportingDocumentNote: formData.supportingDocumentNote,
      });

      // Update local state without mutating canonical officialDetails
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          changeRequests: [newRequest, ...prev.changeRequests],
        };
      });

      addToast(
        "Change Request Submitted",
        `Request ${newRequest.id} for "${fieldLabel}" has been submitted for Super Admin review. Official details remain unchanged until approved.`,
        "success"
      );

      closeChangeDialog();
      return true;
    } catch (err) {
      console.error("Failed to submit change request:", err);
      addToast(
        "Submission Failed",
        "Could not submit change request. Please check inputs and retry.",
        "destructive"
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
    isChangeDialogOpen,
    selectedFieldForChange,
    openChangeDialog,
    closeChangeDialog,
    selectedRequestForDetail,
    isDetailDialogOpen,
    openDetailDialog,
    closeDetailDialog,
    isSubmitting,
    handleSubmitChangeRequest,
    toasts,
    removeToast,
  };
}
