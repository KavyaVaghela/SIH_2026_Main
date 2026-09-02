"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export interface DesktopSidebarProps {
  items: NavItem[];
  className?: string;
}

export function DesktopSidebar({ items, className }: DesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("hidden md:flex flex-col w-64 border-r bg-card p-4 space-y-6 min-h-[calc(100vh-4rem)]", className)}>
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Platform Navigation
        </p>
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="h-4 w-4 shrink-0">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
