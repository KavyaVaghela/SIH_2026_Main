"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusExplainerModal } from "./status-explainer-modal";
import type { PlatformRole } from "@/config/navigation";

export interface StatusExplainerBadgeProps {
  statusCode: string;
  role: PlatformRole;
  displayLabel?: string;
  className?: string;
}

export function StatusExplainerBadge({
  statusCode,
  role,
  displayLabel,
  className,
}: StatusExplainerBadgeProps) {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer ${className || ""}`}
        title="Click to understand what this status means"
      >
        <span>{displayLabel || statusCode}</span>
        <HelpCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
      </button>

      <StatusExplainerModal
        statusCode={statusCode}
        role={role}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
