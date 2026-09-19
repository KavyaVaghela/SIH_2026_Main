"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { GrievanceCase } from "@/types/complaints/v2";
import type { SuperAdminComplaintSubsection, ComplaintOverviewAnalytics } from "../types/v2";
import { SuperAdminComplaintsHeader } from "./super-admin-complaints-header";
import { FederationComplaintsList } from "./federation-complaints-list";
import { FederationComplaintOverview } from "./federation-complaint-overview";

export function ComplaintsDashboard() {
  const [activeSection, setActiveSection] = React.useState<SuperAdminComplaintSubsection>("FEDERATION_COMPLAINTS");
  const [federationComplaints, setFederationComplaints] = React.useState<GrievanceCase[]>([]);
  const [overviewAnalytics, setOverviewAnalytics] = React.useState<ComplaintOverviewAnalytics | null>(null);

  const [isLoadingComplaints, setIsLoadingComplaints] = React.useState<boolean>(true);
  const [isLoadingOverview, setIsLoadingOverview] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  const [overviewFilters, setOverviewFilters] = React.useState<{
    federationId?: string;
    status?: string;
    priority?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  // 1. Fetch Federation-originated complaints (raised by FEDERATION_ADMIN)
  const fetchFederationComplaints = React.useCallback(async () => {
    setIsLoadingComplaints(true);
    try {
      const res = await fetch("/api/complaints?role=SUPER_ADMIN&complainantRole=FEDERATION_ADMIN&includeEscalated=true");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.complaints)) {
          setFederationComplaints(json.complaints);
        }
      }
    } catch (err) {
      console.error("Failed to load federation complaints:", err);
    } finally {
      setIsLoadingComplaints(false);
    }
  }, []);

  // 2. Fetch Multi-Federation Complaint Overview & Analytics
  const fetchOverviewAnalytics = React.useCallback(async () => {
    setIsLoadingOverview(true);
    try {
      const params = new URLSearchParams({ scope: "platform" });
      if (overviewFilters.federationId) params.set("federationId", overviewFilters.federationId);
      if (overviewFilters.status) params.set("status", overviewFilters.status);
      if (overviewFilters.priority) params.set("priority", overviewFilters.priority);
      if (overviewFilters.category) params.set("category", overviewFilters.category);
      if (overviewFilters.dateFrom) params.set("dateFrom", overviewFilters.dateFrom);
      if (overviewFilters.dateTo) params.set("dateTo", overviewFilters.dateTo);

      const res = await fetch(`/api/complaints/analytics?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.overview) {
          setOverviewAnalytics(json.overview);
        }
      }
    } catch (err) {
      console.error("Failed to load overview analytics:", err);
    } finally {
      setIsLoadingOverview(false);
    }
  }, [overviewFilters]);

  // Initial load
  React.useEffect(() => {
    fetchFederationComplaints();
    fetchOverviewAnalytics();
  }, [fetchFederationComplaints, fetchOverviewAnalytics]);

  // Supabase Realtime Subscription on complaints table with unmount cleanup
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("super-admin-complaints-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaints",
        },
        () => {
          fetchFederationComplaints();
          fetchOverviewAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFederationComplaints, fetchOverviewAnalytics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchFederationComplaints(), fetchOverviewAnalytics()]);
    setIsRefreshing(false);
  };

  const totalFeds = overviewAnalytics?.federations?.length || 0;

  return (
    <div className="space-y-6">
      <SuperAdminComplaintsHeader
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        federationComplaintCount={federationComplaints.length}
        totalFederationsCount={totalFeds}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {activeSection === "FEDERATION_COMPLAINTS" && (
        <FederationComplaintsList
          complaints={federationComplaints}
          isLoading={isLoadingComplaints}
          onRefresh={fetchFederationComplaints}
        />
      )}

      {activeSection === "FEDERATION_OVERVIEW" && (
        <FederationComplaintOverview
          overview={overviewAnalytics}
          isLoading={isLoadingOverview}
          onFilterChange={setOverviewFilters}
          activeFilters={overviewFilters}
        />
      )}
    </div>
  );
}
