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
  onClick?: () => void;
  className?: string;
}

export function NotificationItem({
  title,
  message,
  timestamp,
  isRead = false,
  type = "info",
  onClick,
  className,
}: NotificationItemProps) {
  const icons = {
    info: <Info className="h-4 w-4 text-sky-500" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    alert: <Bell className="h-4 w-4 text-destructive" />,
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-start space-x-3 rounded-lg border p-3.5 transition-colors cursor-pointer hover:bg-accent/50",
        !isRead && "bg-muted/40 font-medium border-l-4 border-l-primary",
        className
      )}
    >
      <div className="mt-0.5 shrink-0">{icons[type]}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-foreground">{title}</h5>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
