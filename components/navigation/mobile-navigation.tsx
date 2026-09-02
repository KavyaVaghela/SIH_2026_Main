"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface MobileNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export interface MobileNavigationProps {
  items: MobileNavItem[];
  className?: string;
}

export function MobileNavigation({ items, className }: MobileNavigationProps) {
  const pathname = usePathname();

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bg-background/95 backdrop-blur shadow-lg", className)}>
      <nav className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 text-[11px] font-medium transition-colors",
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn("h-5 w-5", isActive && "scale-110 transition-transform")}>
                {item.icon}
              </div>
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
