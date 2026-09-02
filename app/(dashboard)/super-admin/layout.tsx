import * as React from "react";
import { RoleShell } from "@/components/layout/role-shell";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="SUPER_ADMIN">{children}</RoleShell>;
}
