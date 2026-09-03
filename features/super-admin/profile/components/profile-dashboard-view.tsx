"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useSuperAdminProfile } from "../hooks/use-super-admin-profile";
import { ProfileHeaderCard } from "./profile-header-card";
import { PersonalInfoForm } from "./personal-info-form";
import { AuthorityInfoCard } from "./authority-info-card";
import { PasswordChangeSection } from "./password-change-section";
import { AccountDangerZone } from "./account-danger-zone";

export function ProfileDashboardView() {
  const {
    profile,
    isLoading,
    isSaving,
    isEditing,
    editName,
    editPhone,
    setEditName,
    setEditPhone,
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    isUpdatingPassword,
    successFeedback,
    errorFeedback,
    startEditing,
    cancelEditing,
    saveProfile,
    changePassword,
    logout,
  } = useSuperAdminProfile();

  if (isLoading || !profile) {
    return (
      <div className="space-y-6 pb-12">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-80" />
        </div>
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Super Admin Profile & Account Governance"
        description="Oversee administrative identity credentials, contact information, apex authority affiliations, and security tokens."
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Profile" },
        ]}
      />

      {/* Success Alert */}
      {successFeedback && (
        <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 text-xs font-semibold flex items-center space-x-2 animate-in fade-in-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successFeedback}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorFeedback && (
        <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 text-xs font-semibold flex items-center space-x-2 animate-in fade-in-0">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* 1. Header Card (Avatar + Identity + SUPER_ADMIN badge) */}
      <ProfileHeaderCard profile={profile} />

      {/* 2. Personal & Contact Information Form */}
      <PersonalInfoForm
        profile={profile}
        isEditing={isEditing}
        editName={editName}
        editPhone={editPhone}
        onEditNameChange={setEditName}
        onEditPhoneChange={setEditPhone}
        onStartEdit={startEditing}
        onCancelEdit={cancelEditing}
        onSave={saveProfile}
        isSaving={isSaving}
      />

      {/* 3. Apex Governance Authority Card */}
      <AuthorityInfoCard profile={profile} />

      {/* 4. Password Security Update Workflow */}
      <PasswordChangeSection
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={changePassword}
        isUpdating={isUpdatingPassword}
      />

      {/* 5. Session Termination & Logout */}
      <AccountDangerZone onLogout={logout} />
    </div>
  );
}
