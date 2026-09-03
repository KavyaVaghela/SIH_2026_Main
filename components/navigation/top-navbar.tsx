"use client";

import * as React from "react";
import { Building2, Menu } from "lucide-react";
import { NotificationCenter } from "./notification-center";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";

export interface TopNavbarProps {
  platformTitle?: string;
  userName?: string;
  userRole?: string;
  onToggleMobileMenu?: () => void;
  className?: string;
}

export function TopNavbar({
  platformTitle = "KaushalyaSetu",
  userName,
  userRole,
  onToggleMobileMenu,
  className,
}: TopNavbarProps) {
  return (
    <header className={cn("sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
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

          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight text-foreground">{platformTitle}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Community Owned Digital Marketplace
              </span>
            </div>
          </div>
        </div>

        {/* Global Search Bar removed per Customer Task 7 guidelines */}

        <div className="flex items-center space-x-2 sm:space-x-3">
          <NotificationCenter />
          <UserMenu userName={userName} userRole={userRole} />
        </div>
      </div>
    </header>
  );
}
