"use client";

import * as React from "react";
import { societiesService } from "../services/societies-service";
import type {
  SocietyListItem,
  AddSocietyFormPayload,
  SocietyStatus,
  SocietyFilterOptions,
} from "../types";
import type { ToastMessage } from "@/components/ui/toast";

export function useSocieties() {
  const [filters, setFilters] = React.useState<SocietyFilterOptions>({
    searchQuery: "",
    location: "ALL",
    status: "ALL",
    sortBy: "name",
    sortOrder: "asc",
    page: 1,
    pageSize: 10,
  });

  const [data, setData] = React.useState<SocietyListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [locations, setLocations] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState<boolean>(false);
  const [statusDialogTarget, setStatusDialogTarget] = React.useState<{
    society: SocietyListItem;
    targetStatus: SocietyStatus;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Toast Notification Messages
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = (title: string, description: string, variant: "success" | "destructive" | "warning" = "success") => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchSocieties = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await societiesService.getSocieties(filters);
      setData(res.data);
      setTotalCount(res.totalCount);
      setLocations(res.locations);
    } catch (err) {
      console.error("Failed to load societies:", err);
      setError("Failed to fetch societies. Please check network connection.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchSocieties();
  }, [fetchSocieties]);

  const updateFilters = (newFilters: Partial<SocietyFilterOptions>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1, // Reset page on filter change
    }));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: "",
      location: "ALL",
      status: "ALL",
      sortBy: "name",
      sortOrder: "asc",
      page: 1,
      pageSize: 10,
    });
  };

  const handleCreateSociety = async (payload: AddSocietyFormPayload): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const created = await societiesService.createSociety(payload);
      addToast("Society Created Successfully", `${created.name} registered under registration code ${created.code}.`, "success");
      setIsAddDialogOpen(false);
      fetchSocieties();
      return true;
    } catch {
      addToast("Failed to Add Society", "An error occurred while saving the cooperative society.", "destructive");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: SocietyStatus): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await societiesService.updateSocietyStatus(id, newStatus);
      const statusLabel = newStatus === "ACTIVE" ? "Activated" : newStatus === "SUSPENDED" ? "Suspended" : "Updated";
      addToast("Status Updated", `Cooperative society status set to ${statusLabel}.`, "success");
      setStatusDialogTarget(null);
      fetchSocieties();
      return true;
    } catch {
      addToast("Status Update Failed", "Could not update status. Please try again.", "destructive");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    data,
    totalCount,
    locations,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    isAddDialogOpen,
    setIsAddDialogOpen,
    statusDialogTarget,
    setStatusDialogTarget,
    isSubmitting,
    handleCreateSociety,
    handleUpdateStatus,
    toasts,
    removeToast,
    refresh: fetchSocieties,
  };
}
