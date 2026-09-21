"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Users, FileText, Settings, Building2, X } from "lucide-react";
import { TopNavbar } from "@/components/navigation/top-navbar";
import { DesktopSidebar, type NavItem } from "@/components/navigation/desktop-sidebar";
import type { MobileNavItem } from "@/components/navigation/mobile-navigation";
import type { PlatformRole } from "@/config/navigation";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  mobileNavItems?: MobileNavItem[];
  userName?: string;
  userRole?: string;
  role?: PlatformRole;
  avatarUrl?: string;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { title: "Home Overview", href: "/", icon: <Home /> },
  { title: "Service Bookings", href: "/bookings", icon: <Calendar />, badge: 3 },
  { title: "Cooperative Members", href: "/members", icon: <Users /> },
  { title: "Invoices & Earnings", href: "/invoices", icon: <FileText /> },
  { title: "System Settings", href: "/settings", icon: <Settings /> },
];

export function AppShell({
  children,
  navItems = defaultNavItems,
  userName = "Cooperative Member",
  userRole = "Platform Admin",
  role,
  avatarUrl,
  className,
}: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Handle Escape key to close mobile drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSidebarOpen]);

  // Lock body scroll while mobile drawer is active
  React.useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopNavbar
        userName={userName}
        userRole={userRole}
        role={role}
        avatarUrl={avatarUrl}
        onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Mobile Drawer Overlay / Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden",
          mobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Slide-out Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* Drawer Header with Title and Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-foreground truncate">
                KaushalyaSetu
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {userRole}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Platform Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" &&
                  item.href !== "/customer" &&
                  item.href !== "/worker" &&
                  item.href !== "/super-admin" &&
                  item.href !== "/federation-admin" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="h-4 w-4 shrink-0">{item.icon}</span>
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-foreground"
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
      </div>

      <div className="flex-1 flex min-w-0">
        <DesktopSidebar items={navItems} />

        <main className={cn("flex-1 min-w-0 p-4 md:p-6 lg:p-8 w-full max-w-[1500px] mx-auto", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}

