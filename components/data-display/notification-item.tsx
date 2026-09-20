import * as React from "react";
import { Bell, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
  type?: "info" | "success" | "warning" | "alert";
  priority?: "low" | "medium" | "high" | "urgent";
  targetRoute?: string;
  onClick?: () => void;
  className?: string;
}

export function NotificationItem({
  title,
  message,
  timestamp,
  isRead = false,
  type = "info",
  priority,
  onClick,
  className,
}: NotificationItemProps) {
  const icons = {
    info: <Info className="h-4 w-4 text-sky-500" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    alert: <Bell className="h-4 w-4 text-destructive" />,
  };

  const priorityStyles: Record<string, string> = {
    urgent: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
    high: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
    medium: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-900",
    low: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === "Enter" || e.key === " ") && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex items-start space-x-3 rounded-lg border p-3 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/20",
        !isRead
          ? "bg-muted/40 dark:bg-slate-800/30 font-medium border-l-4 border-l-primary hover:bg-accent/60"
          : "bg-card hover:bg-accent/40 opacity-85 hover:opacity-100",
        className
      )}
    >
      <div className="mt-0.5 shrink-0">{icons[type]}</div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h5 className="text-xs sm:text-sm font-semibold text-foreground truncate">{title}</h5>
            {!isRead && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0"
                aria-label="Unread notification"
              />
            )}
          </div>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
            {timestamp}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {message}
        </p>
        {priority && (
          <div className="pt-0.5 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.2 rounded border text-[10px] font-semibold uppercase tracking-wider",
                priorityStyles[priority] || priorityStyles.low
              )}
            >
              {priority}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
