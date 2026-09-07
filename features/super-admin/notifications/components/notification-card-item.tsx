"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotificationCategoryBadge } from "./notification-category-badge";
import {
  Clock,
  ArrowRight,
  Check,
  RotateCcw,
  ExternalLink,
  Circle,
} from "lucide-react";
import type { SuperAdminNotification } from "../types";

interface NotificationCardItemProps {
  notification: SuperAdminNotification;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
}

export function NotificationCardItem({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
}: NotificationCardItemProps) {
  const router = useRouter();

  const handleCardClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    router.push(notification.targetRoute);
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl border transition-all ${
        !notification.isRead
          ? "bg-card border-l-4 border-l-emerald-600 border-y-border border-r-border shadow-xs hover:shadow-sm hover:border-emerald-600"
          : "bg-muted/15 border-border hover:bg-card hover:border-border/80 opacity-80 hover:opacity-100"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Left: Icon / Indicator + Content */}
        <div className="flex items-start space-x-3 flex-1">
          {/* Read/Unread Dot */}
          <div className="pt-1 shrink-0">
            {!notification.isRead ? (
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" title="Unread Alert" />
            ) : (
              <span className="flex h-2.5 w-2.5 rounded-full bg-muted-foreground/30" title="Read" />
            )}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <NotificationCategoryBadge category={notification.category} />
              <div className="flex items-center space-x-1 text-[11px] text-muted-foreground font-medium">
                <Clock className="h-3 w-3" />
                <span>{notification.createdAt}</span>
              </div>
            </div>

            <h4
              onClick={handleCardClick}
              className={`text-sm tracking-tight cursor-pointer hover:text-emerald-700 hover:underline ${
                !notification.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80"
              }`}
            >
              {notification.title}
            </h4>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {notification.description}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 shrink-0">
          <Link
            href={notification.targetRoute}
            onClick={() => {
              if (!notification.isRead) onMarkAsRead(notification.id);
            }}
            className="inline-flex items-center text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 hover:underline"
          >
            <span>{notification.actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>

          {!notification.isRead ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3 w-3 mr-1 text-emerald-600" />
              Mark as read
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsUnread(notification.id)}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Mark unread
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
