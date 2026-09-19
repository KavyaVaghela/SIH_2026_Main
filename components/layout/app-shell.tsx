"use client";

import * as React from "react";
import { Home, Calendar, Users, FileText, Settings } from "lucide-react";
import { TopNavbar } from "@/components/navigation/top-navbar";
import { DesktopSidebar, type NavItem } from "@/components/navigation/desktop-sidebar";
import { MobileNavigation, type MobileNavItem } from "@/components/navigation/mobile-navigation";
import type { PlatformRole } from "@/config/navigation";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  mobileNavItems?: MobileNavItem[];
  userName?: string;
  userRole?: string;
  role?: PlatformRole;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { title: "Home Overview", href: "/", icon: <Home /> },
  { title: "Service Bookings", href: "/bookings", icon: <Calendar />, badge: 3 },
  { title: "Cooperative Members", href: "/members", icon: <Users /> },
  { title: "Invoices & Earnings", href: "/invoices", icon: <FileText /> },
  { title: "System Settings", href: "/settings", icon: <Settings /> },
];

const defaultMobileNavItems: MobileNavItem[] = [
  { title: "Home", href: "/", icon: <Home /> },
  { title: "Bookings", href: "/bookings", icon: <Calendar /> },
  { title: "Members", href: "/members", icon: <Users /> },
  { title: "Invoices", href: "/invoices", icon: <FileText /> },
];

export function AppShell({
  children,
  navItems = defaultNavItems,
  mobileNavItems = defaultMobileNavItems,
  userName = "Cooperative Member",
  userRole = "Platform Admin",
  role,
  className,
}: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopNavbar
        userName={userName}
        userRole={userRole}
        role={role}
        onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div className="flex-1 flex min-w-0">
        <DesktopSidebar items={navItems} />

        <main className={cn("flex-1 min-w-0 p-4 md:p-6 lg:p-8 mb-16 md:mb-0 w-full max-w-[1500px] mx-auto", className)}>
          {children}
        </main>
      </div>

      <MobileNavigation items={mobileNavItems} />
    </div>
  );
}
