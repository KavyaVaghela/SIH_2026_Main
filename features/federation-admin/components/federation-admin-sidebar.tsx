"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  AlertTriangle,
  ShieldCheck,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface FederationNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

interface FederationAdminSidebarProps {
  className?: string;
  pendingComplaintsCount?: number;
  onNavigate?: () => void;
}

export function FederationAdminSidebar({
  className,
  pendingComplaintsCount,
  onNavigate,
}: FederationAdminSidebarProps) {
  const pathname = usePathname();

  // Exactly 5 sections per Section 5 guidelines
  const navItems: FederationNavItem[] = [
    {
      title: "Dashboard",
      href: "/federation-admin",
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    {
      title: "Federation Information",
      href: "/federation-admin/federation-information",
      icon: <Building2 className="h-4 w-4 shrink-0" />,
    },
    {
      title: "Worker Information",
      href: "/federation-admin/worker-information",
      icon: <Users className="h-4 w-4 shrink-0" />,
    },
    {
      title: "Workforce Management",
      href: "/federation-admin/workforce-management",
      icon: <Briefcase className="h-4 w-4 shrink-0" />,
    },
    {
      title: "Complaint Management",
      href: "/federation-admin/complaint-management",
      icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
      badge: pendingComplaintsCount && pendingComplaintsCount > 0 ? pendingComplaintsCount : undefined,
      badgeVariant: "destructive",
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col w-64 border-r border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 p-4 space-y-6 min-h-[calc(100vh-4rem)]",
        className
      )}
    >
      {/* Federation Cooperative Header Card */}
      <div className="rounded-lg border border-border/80 bg-muted/40 p-3 space-y-2">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-800 text-white shadow-xs">
            <Building className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground truncate">
              ABC Labour Coop
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              Ahmedabad Federation
            </span>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-[10px] border-t border-border/60">
          <span className="text-muted-foreground">Jurisdiction</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-600/30 text-emerald-800 dark:text-emerald-300 font-medium">
            Ahmedabad Urban
          </Badge>
        </div>
      </div>

      {/* Primary Navigation Menu */}
      <div className="space-y-1.5 flex-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Federation Administration
        </p>

        <nav className="space-y-1">
          {navItems.map((item) => {
            // Precise active matching
            const isActive =
              item.href === "/federation-admin"
                ? pathname === "/federation-admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors group",
                  isActive
                    ? "bg-emerald-800 text-white font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span
                    className={cn(
                      "transition-colors",
                      isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.title}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-bold shrink-0 ml-1.5",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
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

      {/* Cooperative Federation Administration Trust Footer */}
      <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1.5 text-[11px] text-muted-foreground">
        <div className="flex items-center space-x-1.5 font-semibold text-foreground text-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Statutory Governance</span>
        </div>
        <p className="text-[10px] leading-relaxed">
          Operational records authenticated under Gujarat Cooperative Societies Framework.
        </p>
        <div className="text-[9px] font-mono text-muted-foreground/80 pt-1 border-t border-border/40">
          Module: Stage 1 (Performance)
        </div>
      </div>
    </aside>
  );
}
