"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ROLE_NAVIGATION_CONFIGS, type PlatformRole } from "@/config/navigation";

export interface RoleShellProps {
  role: PlatformRole;
  userName?: string;
  children: React.ReactNode;
  className?: string;
}

export function RoleShell({ role, userName, children, className }: RoleShellProps) {
  const config = ROLE_NAVIGATION_CONFIGS[role];

  return (
    <AppShell
      navItems={config.navItems}
      mobileNavItems={config.mobileNavItems}
      userName={userName || config.displayName}
      userRole={config.displayName}
      className={className}
    >
      {children}
    </AppShell>
  );
}
