import * as React from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProtectedFieldBadgeProps {
  className?: string;
  variant?: "default" | "minimal" | "compact";
  label?: string;
}

export function ProtectedFieldBadge({
  className,
  variant = "default",
  label = "Statutorily Protected",
}: ProtectedFieldBadgeProps) {
  if (variant === "compact") {
    return (
      <span
        title="This official field cannot be edited directly. Any modification requires a Super Admin verified change request."
        className={cn(
          "inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20",
          className
        )}
      >
        <Lock className="h-2.5 w-2.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
        <span>Protected</span>
      </span>
    );
  }

  if (variant === "minimal") {
    return (
      <span
        title="Direct editing disabled. Super Admin approval required."
        className={cn("inline-flex items-center text-muted-foreground", className)}
      >
        <Lock className="h-3 w-3 text-muted-foreground/80 hover:text-emerald-700 transition-colors" />
      </span>
    );
  }

  return (
    <span
      title="Protected official record: Updates require formal change request submission and Super Admin approval."
      className={cn(
        "inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/80",
        className
      )}
    >
      <ShieldCheck className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
      <span>{label}</span>
    </span>
  );
}
