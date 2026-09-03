import * as React from "react";
import { RoleShell } from "@/components/layout/role-shell";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="WORKER" userName="Ravi Patel">{children}</RoleShell>;
}
