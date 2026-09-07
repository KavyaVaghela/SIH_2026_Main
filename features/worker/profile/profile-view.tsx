"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileHeaderCard } from "./profile-header-card";
import { CooperativeAffiliationCard } from "./cooperative-affiliation-card";
import { SkillsSection } from "./skills-section";
import { VerificationBadgesCard } from "./verification-badges-card";
import { ProfileEditDialogs } from "./profile-edit-dialogs";
import { DEMO_WORKER_PROFILE } from "../services/worker-mock-data";
import type { WorkerProfileDetails } from "../types";

export function ProfileView() {
  const [profile, setProfile] = React.useState<WorkerProfileDetails>(DEMO_WORKER_PROFILE);
  const [isEditProfileOpen, setIsEditProfileOpen] = React.useState(false);
  const [isUpdateSkillsOpen, setIsUpdateSkillsOpen] = React.useState(false);

  const handleProfileSuccess = (updated: Partial<WorkerProfileDetails>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="My Profile"
        description="Cooperative member identification, trade certifications, and verified credentials."
        breadcrumbs={[
          { label: "Worker Portal", href: "/worker" },
          { label: "My Profile" },
        ]}
      />

      {/* 1. Worker Header & Primary Actions */}
      <ProfileHeaderCard
        profile={profile}
        onEditProfile={() => setIsEditProfileOpen(true)}
        onUpdateSkills={() => setIsUpdateSkillsOpen(true)}
      />

      {/* 2. Institutional Cooperative & Federation Affiliation */}
      <CooperativeAffiliationCard profile={profile} />

      {/* 3. Trade Skills & Customer Languages */}
      <SkillsSection profile={profile} />

      {/* 4. Verification Matrix & Trust Badges */}
      <VerificationBadgesCard
        verifications={profile.verifications}
        phone={profile.phone}
      />

      {/* Dialog Modals */}
      <ProfileEditDialogs
        profile={profile}
        isEditProfileOpen={isEditProfileOpen}
        isUpdateSkillsOpen={isUpdateSkillsOpen}
        onCloseEditProfile={() => setIsEditProfileOpen(false)}
        onCloseUpdateSkills={() => setIsUpdateSkillsOpen(false)}
        onSaveProfileSuccess={handleProfileSuccess}
      />
    </div>
  );
}
