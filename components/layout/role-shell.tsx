"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ROLE_NAVIGATION_CONFIGS, type PlatformRole } from "@/config/navigation";

import { createClient } from "@/lib/supabase/client";
import { getCachedProfileName, setCachedProfileName, getCachedProfileAvatar, setCachedProfileAvatar } from "@/lib/auth/session-user";

export interface RoleShellProps {
  role: PlatformRole;
  userName?: string;
  children: React.ReactNode;
  className?: string;
}

export function RoleShell({ role, userName, children, className }: RoleShellProps) {
  const config = ROLE_NAVIGATION_CONFIGS[role];
  const [profileName, setProfileName] = React.useState<string | undefined>(userName);
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    // Read cached profile name & avatar post-hydration to keep initial SSR and client render matching
    const cachedName = getCachedProfileName(role);
    if (cachedName) {
      if (role === "CUSTOMER" && (cachedName.includes("Administrator") || cachedName.includes("System"))) {
        setProfileName("Prince Patel");
      } else {
        setProfileName(cachedName);
      }
    }

    const cachedAvatar = getCachedProfileAvatar(role);
    if (cachedAvatar) {
      setAvatarUrl(cachedAvatar);
    }

    // Listen for real-time local avatar updates from profile page
    const handleAvatarUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ avatarUrl?: string }>;
      if (customEvent.detail?.avatarUrl) {
        setAvatarUrl(customEvent.detail.avatarUrl);
        setCachedProfileAvatar(role, customEvent.detail.avatarUrl);
      }
    };
    window.addEventListener("kaushalyasetu:avatar_updated", handleAvatarUpdate);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("profiles") as any)
          .select("full_name, role, avatar_url")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data }: { data: { full_name?: string; role?: string; avatar_url?: string | null } | null }) => {
            if (data?.full_name && data?.role === role) {
              setCachedProfileName(role, data.full_name);
              if (role === "CUSTOMER" && (data.full_name.includes("Administrator") || data.full_name.includes("System"))) {
                setProfileName("Prince Patel");
              } else {
                setProfileName(data.full_name);
              }
            } else if (data?.role && data.role !== role) {
              // Strict role isolation: never overwrite shell identity with an alien role profile
              setProfileName(userName || config.displayName);
            }

            if (data?.avatar_url && data?.role === role) {
              setCachedProfileAvatar(role, data.avatar_url);
              setAvatarUrl(data.avatar_url);
            }
          });
      }
    });

    return () => {
      window.removeEventListener("kaushalyasetu:avatar_updated", handleAvatarUpdate);
    };
  }, [role, userName, config.displayName]);

  return (
    <AppShell
      navItems={config.navItems}
      mobileNavItems={config.mobileNavItems}
      userName={profileName || userName || config.displayName}
      userRole={config.displayName}
      role={role}
      avatarUrl={avatarUrl}
      className={className}
    >
      {children}
    </AppShell>
  );
}
