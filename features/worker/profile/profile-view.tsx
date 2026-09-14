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

const INITIAL_WORKER_PROFILE: WorkerProfileDetails = {
  name: "Worker Member",
  email: "",
  phone: "",
  trade: "Skilled Tradesperson",
  cooperativeName: "Cooperative Society",
  cooperativeRole: "Member",
  federationName: "Cooperative Federation",
  location: "Gujarat, India",
  cooperativeId: "PENDING",
  rating: 0,
  reviewsCount: 0,
  experienceYears: 0,
  hourlyRate: 300,
  joiningDate: new Date().toISOString().split("T")[0],
  verifications: {
    identity: false,
    phone: false,
    worker: false,
    skill: false,
  },
  isVerified: false,
  verificationStatus: "pending_verification",
  accountStatus: "ACTIVE",
  address: "Address not provided",
  bio: "Cooperative registered trade worker.",
  skills: [],
  languages: ["Gujarati", "Hindi"],
  certifications: [],
  documents: [],
  idProofNumber: "•••• •••• ••••",
};

export function ProfileView() {
  const [profile, setProfile] = React.useState<WorkerProfileDetails>(INITIAL_WORKER_PROFILE);
  const [isEditProfileOpen, setIsEditProfileOpen] = React.useState(false);
  const [isUpdateSkillsOpen, setIsUpdateSkillsOpen] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user?.id) return;

      try {
        // 1. Fetch Profile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: prof } = await (supabase.from("profiles") as any)
          .select("full_name, phone, email, role, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        // 2. Fetch Worker Record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: wRec } = await (supabase.from("workers") as any)
          .select(`
            id,
            member_id,
            profession,
            hourly_rate,
            experience_years,
            verification_status,
            account_status,
            availability_status,
            date_of_birth,
            gender,
            registration_type,
            created_at,
            federations (id, name, city, state, code)
          `)
          .eq("profile_id", user.id)
          .maybeSingle();

        // 3. Fetch Residential Address
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: addr } = await (supabase.from("addresses") as any)
          .select("address_line1, address_line2, city, state, postal_code")
          .eq("profile_id", user.id)
          .order("is_default", { ascending: false })
          .limit(1)
          .maybeSingle();

        // 4. Fetch Worker Skills
        let fetchedSkills: string[] = [];
        if (wRec?.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: wSkills } = await (supabase.from("worker_skills") as any)
            .select("skills(name)")
            .eq("worker_id", wRec.id);

          if (wSkills && wSkills.length > 0) {
            fetchedSkills = wSkills
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((ws: any) => ws.skills?.name)
              .filter(Boolean);
          }
        }

        const addressText = addr
          ? [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.postal_code ? `- ${addr.postal_code}` : null]
              .filter(Boolean)
              .join(", ")
          : "Address not provided";

        setProfile((prev) => ({
          ...prev,
          name: prof?.full_name || prev.name,
          email: prof?.email || prev.email,
          phone: prof?.phone || prev.phone,
          avatarUrl: prof?.avatar_url || null,
          memberId: wRec?.member_id || "PENDING",
          cooperativeId: wRec?.member_id || "PENDING",
          trade: wRec?.profession || prev.trade,
          hourlyRate: Number(wRec?.hourly_rate) || prev.hourlyRate,
          experienceYears: wRec?.experience_years ?? prev.experienceYears,
          joiningDate: wRec?.created_at ? wRec.created_at.split("T")[0] : prev.joiningDate,
          federationName: wRec?.federations?.name || prev.federationName,
          location: wRec?.federations?.city
            ? `${wRec.federations.city}, ${wRec.federations.state}`
            : prev.location,
          dateOfBirth: wRec?.date_of_birth || null,
          gender: wRec?.gender || null,
          registrationType: wRec?.registration_type || null,
          accountStatus: wRec?.account_status || "ACTIVE",
          verificationStatus: wRec?.verification_status || "pending_verification",
          isVerified: wRec?.verification_status === "verified",
          address: addressText,
          skills: fetchedSkills.length > 0 ? fetchedSkills : (wRec?.profession ? [wRec.profession] : []),
        }));
      } catch (err) {
        console.warn("Notice: Worker profile Supabase query:", err);
      }
    });
  }, []);

  const handleProfileSuccess = (updated: Partial<WorkerProfileDetails>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateAvatar = (newUrl: string) => {
    setProfile((prev) => ({ ...prev, avatarUrl: newUrl }));
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
        onUpdateAvatar={handleUpdateAvatar}
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
