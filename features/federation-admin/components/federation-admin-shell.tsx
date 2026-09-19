"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { TopNavbar } from "@/components/navigation/top-navbar";
import { FederationAdminSidebar } from "./federation-admin-sidebar";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getCachedProfileName, setCachedProfileName } from "@/lib/auth/session-user";

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
  const pathname = usePathname();
  const [displayName, setDisplayName] = React.useState<string>(
    () => getCachedProfileName("FEDERATION_ADMIN") || (userName !== "Federation Administrator" ? userName : "Vikram Shah")
  );

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Handle Escape key to close mobile drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  // Lock body scroll while mobile drawer is active
  React.useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  React.useEffect(() => {
    let isMounted = true;
    async function loadAdminIdentity() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profile } = await (supabase.from("profiles") as any)
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          if (isMounted && profile?.full_name) {
            setCachedProfileName("FEDERATION_ADMIN", profile.full_name);
            setDisplayName(profile.full_name);
          }
        }
      } catch (err) {
        console.error("Error loading federation admin identity in shell", err);
      }
    }
    loadAdminIdentity();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Administrative Navbar */}
      <TopNavbar
        platformTitle="KaushalyaSetu"
        userName={displayName}
        userRole={userRole}
        role="FEDERATION_ADMIN"
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
              <FederationAdminSidebar onNavigate={() => setMobileDrawerOpen(false)} className="w-full border-r-0 static top-0 h-full p-4 space-y-6" />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Shell Body */}
      <div className="flex-1 flex min-w-0">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:block shrink-0">
          <FederationAdminSidebar />
        </div>

        {/* Main Content Area */}
        <main
          className={cn(
            "flex-1 p-4 md:p-6 lg:p-8 max-w-[1500px] w-full mx-auto overflow-x-hidden min-w-0",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
