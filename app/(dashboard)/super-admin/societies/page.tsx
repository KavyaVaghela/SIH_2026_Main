"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ToastItem } from "@/components/ui/toast";
import { useSocieties } from "@/features/super-admin/cooperative-societies/hooks/use-societies";
import { SocietyFilters } from "@/features/super-admin/cooperative-societies/components/society-filters";
import { SocietyTable } from "@/features/super-admin/cooperative-societies/components/society-table";
import { AddSocietyDialog } from "@/features/super-admin/cooperative-societies/components/add-society-dialog";
import { SocietyStatusDialog } from "@/features/super-admin/cooperative-societies/components/society-status-dialog";

export default function SocietiesPage() {
  const {
    data,
    totalCount,
    locations,
    isLoading,
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
  } = useSocieties();

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback Notifications Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} message={toast} onDismiss={removeToast} />
        ))}
      </div>

      <PageHeader
        title="Cooperative Societies Governance"
        description="Register, audit, verify, and govern primary worker cooperative societies across all regions."
        breadcrumbs={[{ label: "Super Admin", href: "/super-admin" }, { label: "Cooperative Societies" }]}
      />

      {/* Filter and Search Bar */}
      <SocietyFilters
        filters={filters}
        locations={locations}
        onFilterChange={updateFilters}
        onReset={resetFilters}
        onAddClick={() => setIsAddDialogOpen(true)}
      />

      {/* Main Societies Data Table */}
      <SocietyTable
        data={data}
        totalCount={totalCount}
        currentPage={filters.page}
        pageSize={filters.pageSize}
        onPageChange={(page) => updateFilters({ page })}
        onStatusAction={(society, targetStatus) => setStatusDialogTarget({ society, targetStatus })}
        isLoading={isLoading}
      />

      {/* Add Society Registration Form Modal */}
      <AddSocietyDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleCreateSociety}
        isSubmitting={isSubmitting}
      />

      {/* Status Action Confirmation Dialog */}
      <SocietyStatusDialog
        target={statusDialogTarget}
        onClose={() => setStatusDialogTarget(null)}
        onConfirm={handleUpdateStatus}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
