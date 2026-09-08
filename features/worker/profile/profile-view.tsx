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

import { createClient } from "@/lib/supabase/client";

export function ProfileView() {
  const [profile, setProfile] = React.useState<WorkerProfileDetails>(DEMO_WORKER_PROFILE);
  const [isEditProfileOpen, setIsEditProfileOpen] = React.useState(false);
  const [isUpdateSkillsOpen, setIsUpdateSkillsOpen] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("profiles") as any)
          .select("full_name, phone, email")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data: prof }: { data: { full_name?: string; phone?: string; email?: string } | null }) => {
            if (prof?.full_name) {
              const fullName = prof.full_name;
              setProfile((prev) => ({
                ...prev,
                name: fullName,
                phone: prof.phone || prev.phone,
              }));
            }
          });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("workers") as any)
          .select("profession, hourly_rate, experience_years, federations(name, city, state)")
          .eq("profile_id", user.id)
          .maybeSingle()
          .then(({ data: wRec }: { data: any }) => {
            if (wRec) {
              setProfile((prev) => ({
                ...prev,
                trade: wRec.profession || "Plumber",
                hourlyRate: Number(wRec.hourly_rate) || prev.hourlyRate,
                experienceYears: wRec.experience_years || prev.experienceYears,
                federationName: wRec.federations?.name || prev.federationName,
                location: wRec.federations?.city ? `${wRec.federations.city}, ${wRec.federations.state}` : prev.location,
              }));
            }
          });
      }
    });
  }, []);

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
