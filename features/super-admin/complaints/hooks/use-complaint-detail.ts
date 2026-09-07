"use client";

import * as React from "react";
import { complaintsService } from "../services/complaints-service";
import type { ComplaintDetails, ComplaintStatus } from "../types";

export function useComplaintDetail(id: string) {
  const [complaint, setComplaint] = React.useState<ComplaintDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const fetchDetail = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await complaintsService.getComplaintById(id);
      if (data) {
        setComplaint(data);
      } else {
        setError("Complaint record could not be found.");
      }
    } catch (err) {
      console.error("Failed to load complaint details:", err);
      setError("An error occurred while retrieving the complaint record.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const startReview = async () => {
    if (!complaint) return;
    setIsSubmitting(true);
    try {
      await complaintsService.updateStatus(complaint.id, "IN_REVIEW");
      await fetchDetail();
    } catch (err) {
      console.error("Failed to transition complaint to review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const markResolved = async (resolutionNotes: string) => {
    if (!complaint) return;
    setIsSubmitting(true);
    try {
      await complaintsService.updateStatus(complaint.id, "RESOLVED", resolutionNotes);
      await fetchDetail();
    } catch (err) {
      console.error("Failed to resolve complaint:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNote = async (noteContent: string) => {
    if (!complaint) return;
    setIsSubmitting(true);
    try {
      await complaintsService.addNote(complaint.id, noteContent);
      await fetchDetail();
    } catch (err) {
      console.error("Failed to append admin note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignToFederation = async (assigneeName: string) => {
    if (!complaint) return;
    setIsSubmitting(true);
    try {
      await complaintsService.assignComplaint(complaint.id, assigneeName);
      await fetchDetail();
    } catch (err) {
      console.error("Failed to assign complaint:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    complaint,
    isLoading,
    isSubmitting,
    error,
    startReview,
    markResolved,
    addNote,
    assignToFederation,
    refresh: fetchDetail,
  };
}
