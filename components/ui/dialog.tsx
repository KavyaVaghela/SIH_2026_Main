"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  onClose: () => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

export interface DialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  open,
  onClose,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const isVisible = open !== undefined ? open : !!isOpen;
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  if (!isVisible) return null;

  // Single-component mode (when title, footer, or traditional props are passed)
  if (title || footer || description) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          className={cn(
            "relative w-full max-w-lg rounded-xl border border-border/80 bg-white dark:bg-slate-900 p-6 text-card-foreground shadow-2xl animate-in zoom-in-95",
            className
          )}
        >
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          {(title || description) && (
            <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
              {title && <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          )}

          <div className="my-2">{children}</div>

          {footer && <div className="mt-6 flex justify-end space-x-2">{footer}</div>}
        </div>
      </div>
    );
  }

  // Standard / Compound component mode
  return (
    <DialogContext.Provider value={{ open: isVisible, onClose: handleClose }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          className={cn(
            "relative w-full max-w-lg rounded-xl border border-border/80 bg-white dark:bg-slate-900 p-6 text-card-foreground shadow-2xl animate-in zoom-in-95",
            className
          )}
        >
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(DialogContext);
  return (
    <div
      className={cn(
        "relative w-full max-w-lg rounded-xl border border-border/80 bg-white dark:bg-slate-900 p-6 text-card-foreground shadow-2xl animate-in zoom-in-95",
        className
      )}
    >
      <button
        onClick={() => ctx?.onClose()}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
      {children}
    </div>
  );
}

export function DialogHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}>
      {children}
    </div>
  );
}

export function DialogTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

export function DialogFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mt-6 flex justify-end space-x-2", className)}>{children}</div>;
}
