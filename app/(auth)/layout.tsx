import * as React from "react";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-center text-center">
        <Logo href="/" showTagline size="lg" />
      </div>

      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
