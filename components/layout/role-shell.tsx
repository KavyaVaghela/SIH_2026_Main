"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ROLE_NAVIGATION_CONFIGS, type PlatformRole } from "@/config/navigation";

import { createClient } from "@/lib/supabase/client";

export interface RoleShellProps {
  role: PlatformRole;
  userName?: string;
  children: React.ReactNode;
  className?: string;
}

export function RoleShell({ role, userName, children, className }: RoleShellProps) {
  const config = ROLE_NAVIGATION_CONFIGS[role];
  const [profileName, setProfileName] = React.useState<string | undefined>(userName);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("profiles") as any)
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data }: { data: { full_name?: string } | null }) => {
            if (data?.full_name) {
              if (role === "CUSTOMER" && (data.full_name.includes("Administrator") || data.full_name.includes("System"))) {
                setProfileName("Prince Patel");
              } else {
                setProfileName(data.full_name);
              }
            }
          });
      }
    });
  }, [role]);

  return (
    <AppShell
      navItems={config.navItems}
      mobileNavItems={config.mobileNavItems}
      userName={profileName || userName || config.displayName}
      userRole={config.displayName}
      className={className}
    >
      {children}
    </AppShell>
  );
}
