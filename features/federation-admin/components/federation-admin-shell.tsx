"use client";

import * as React from "react";
import { TopNavbar } from "@/components/navigation/top-navbar";
import { FederationAdminSidebar } from "./federation-admin-sidebar";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FederationAdminShellProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
  className?: string;
}

export function FederationAdminShell({
  children,
  userName = "Federation Administrator",
  userRole = "ABC Labour Cooperative Federation",
  className,
}: FederationAdminShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Administrative Navbar */}
      <TopNavbar
        platformTitle="KaushalyaSetu"
        userName={userName}
        userRole={userRole}
        onToggleMobileMenu={() => setMobileDrawerOpen(!mobileDrawerOpen)}
      />

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-card shadow-2xl z-10">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Navigation Menu
              </span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <FederationAdminSidebar onNavigate={() => setMobileDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Shell Body */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:block shrink-0">
          <FederationAdminSidebar />
        </div>

        {/* Main Content Area */}
        <main
          className={cn(
            "flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden min-w-0",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
