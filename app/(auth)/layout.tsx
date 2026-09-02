import * as React from "react";
import { Building2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 sm:p-6">
      <div className="mb-6 flex items-center space-x-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="text-left">
          <h1 className="font-bold text-lg leading-tight text-foreground">Cooperative Gig Platform</h1>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Community Owned Digital Marketplace</p>
        </div>
      </div>

      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
