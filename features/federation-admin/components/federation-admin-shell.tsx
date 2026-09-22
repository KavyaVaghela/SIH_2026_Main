"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { TopNavbar } from "@/components/navigation/top-navbar";
import { FederationAdminSidebar } from "./federation-admin-sidebar";
import { Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  getCachedProfileName,
  setCachedProfileName,
  getCachedProfileAvatar,
  setCachedProfileAvatar,
} from "@/lib/auth/session-user";

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
    userName !== "Federation Administrator" ? userName : "Vikram Shah"
  );
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const cachedName = getCachedProfileName("FEDERATION_ADMIN");
    if (cachedName) {
      setDisplayName(cachedName);
    }
    const cachedAvatar = getCachedProfileAvatar("FEDERATION_ADMIN");
    if (cachedAvatar) {
      setAvatarUrl(cachedAvatar);
    }
  }, []);

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
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

          if (isMounted && profile?.full_name) {
            setCachedProfileName("FEDERATION_ADMIN", profile.full_name);
            setDisplayName(profile.full_name);
          }
          if (isMounted && profile?.avatar_url) {
            setCachedProfileAvatar("FEDERATION_ADMIN", profile.avatar_url);
            setAvatarUrl(profile.avatar_url);
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
        avatarUrl={avatarUrl}
        onToggleMobileMenu={() => setMobileDrawerOpen(!mobileDrawerOpen)}
      />

      {/* Mobile Drawer Overlay / Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden",
          mobileDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Slide-out Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
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
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <FederationAdminSidebar
            onNavigate={() => setMobileDrawerOpen(false)}
            className="flex w-full border-r-0 static top-0 h-auto p-4 space-y-6"
          />
        </div>
      </div>

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
