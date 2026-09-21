"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { NotificationCenter } from "./notification-center";
import { UserMenu } from "./user-menu";
import type { PlatformRole } from "@/config/navigation";
import { cn } from "@/lib/utils";

export interface TopNavbarProps {
  platformTitle?: string;
  userName?: string;
  userRole?: string;
  role?: PlatformRole;
  avatarUrl?: string;
  onToggleMobileMenu?: () => void;
  className?: string;
}

export function TopNavbar({
  userName,
  userRole,
  role,
  avatarUrl,
  onToggleMobileMenu,
  className,
}: TopNavbarProps) {
  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0", className)}>
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </button>
          )}

          <Logo href="/" showTagline size="md" />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <NotificationCenter role={role} />
          <UserMenu userName={userName} userRole={userRole} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  );
}
