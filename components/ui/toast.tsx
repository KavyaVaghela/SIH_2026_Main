"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "destructive" | "warning" | "info";

export interface ToastMessage {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
}

export function ToastItem({
  message,
  onDismiss,
}: {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const icons = {
    default: null,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    destructive: <XCircle className="h-5 w-5 text-destructive shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-start space-x-3 rounded-lg border bg-card p-4 text-card-foreground shadow-lg transition-all animate-in slide-in-from-right-full",
        message.variant === "destructive" && "border-destructive/30 bg-destructive/5"
      )}
    >
      {icons[message.variant || "default"]}
      <div className="flex-1">
        {message.title && <h5 className="font-semibold text-sm">{message.title}</h5>}
        <p className="text-sm text-muted-foreground">{message.description}</p>
      </div>
      <button
        onClick={() => onDismiss(message.id)}
        className="text-muted-foreground hover:text-foreground p-1 rounded"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
