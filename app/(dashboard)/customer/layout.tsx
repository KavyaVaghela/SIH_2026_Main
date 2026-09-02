import * as React from "react";
import { RoleShell } from "@/components/layout/role-shell";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="CUSTOMER">{children}</RoleShell>;
}
