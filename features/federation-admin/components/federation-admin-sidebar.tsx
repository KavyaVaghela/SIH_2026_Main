"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Building2,
  Users,
  Briefcase,
  AlertTriangle,
  ShieldAlert,
  Building,
  HeartHandshake,
  HelpCircle,
  Settings,
  ShieldCheck,
  Key,
  Bell,
  CheckCircle2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface FederationNavItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  onClick?: () => void;
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

  // Modal State
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = React.useState<string | null>(null);

  // Settings State
  const [settingsData, setSettingsData] = React.useState({
    emailAlerts: true,
    smsEmergencyAlerts: true,
    weeklyWelfareDigest: true,
    twoFactorAuth: true,
    sessionTimeoutMinutes: "15",
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccessMessage("Account security & preference settings saved.");
    setTimeout(() => setSavedSuccessMessage(null), 3000);
  };

  const mainNavItems: FederationNavItem[] = [
    {
      title: "Dashboard",
      href: "/federation-admin",
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    {
      title: "Earnings & Revenue",
      href: "/federation-admin/earnings",
      icon: <Wallet className="h-4 w-4 shrink-0" />,
    },
    {
      title: "Emergency Control",
      href: "/federation-admin/emergency",
      icon: <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />,
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
      title: "Large Projects",
      href: "/federation-admin/projects",
      icon: <Building2 className="h-4 w-4 shrink-0" />,
    },
    {
      title: "Welfare & Development",
      href: "/federation-admin/welfare",
      icon: <HeartHandshake className="h-4 w-4 shrink-0" />,
    },
    {
      title: "Complaint Management",
      href: "/federation-admin/complaint-management",
      icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
      badge: pendingComplaintsCount && pendingComplaintsCount > 0 ? pendingComplaintsCount : undefined,
      badgeVariant: "destructive",
    },
    {
      title: "Help & Guidance",
      href: "/federation-admin/guidance",
      icon: <HelpCircle className="h-4 w-4 shrink-0" />,
    },
    {
      title: "Account Settings",
      onClick: () => setIsSettingsOpen(true),
      icon: <Settings className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <>
      <aside
        className={cn(
          "flex flex-col w-64 border-r border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 p-4 space-y-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shrink-0 justify-between",
          className
        )}
      >
        <div className="space-y-6">
          {/* Federation Cooperative Header Card */}
          <div className="rounded-lg border border-border/80 bg-muted/40 p-3 space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
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
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Federation Administration
            </p>

            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive =
                  item.href === "/federation-admin"
                    ? pathname === "/federation-admin"
                    : item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`));

                if (item.onClick) {
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => {
                        item.onClick?.();
                        if (onNavigate) onNavigate();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors group text-left",
                        "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                      )}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                          {item.icon}
                        </span>
                        <span className="truncate">{item.title}</span>
                      </div>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.title}
                    href={item.href || "#"}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors group",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
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
        </div>
      </aside>

      {/* ACCOUNT SETTINGS MODAL */}
      <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <span>Account Settings & Security Preferences</span>
            </DialogTitle>
            <DialogDescription>
              Configure notification protocols, security options, and session auto-logout.
            </DialogDescription>
          </DialogHeader>

          {savedSuccessMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{savedSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {/* Section 1: Security & Authentication */}
            <div className="space-y-3 border-b pb-4">
              <h4 className="font-bold text-foreground flex items-center">
                <Key className="h-4 w-4 mr-1.5 text-blue-600" /> Security & Authentication
              </h4>

              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <div>
                  <span className="font-semibold text-foreground block">Two-Factor Authentication (2FA)</span>
                  <span className="text-[11px] text-muted-foreground">Require OTP verification on login</span>
                </div>
                <Switch
                  checked={settingsData.twoFactorAuth}
                  onCheckedChange={(checked) => setSettingsData({ ...settingsData, twoFactorAuth: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <div>
                  <span className="font-semibold text-foreground block">Inactivity Auto-Logout</span>
                  <span className="text-[11px] text-muted-foreground">Automatic session timeout for security</span>
                </div>
                <select
                  value={settingsData.sessionTimeoutMinutes}
                  onChange={(e) => setSettingsData({ ...settingsData, sessionTimeoutMinutes: e.target.value })}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>
            </div>

            {/* Section 2: Notifications */}
            <div className="space-y-3">
              <h4 className="font-bold text-foreground flex items-center">
                <Bell className="h-4 w-4 mr-1.5 text-emerald-600" /> Operational Notifications
              </h4>

              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <div>
                  <span className="font-semibold text-foreground block">Email Escalations</span>
                  <span className="text-[11px] text-muted-foreground">Receive complaint & compliance alerts</span>
                </div>
                <Switch
                  checked={settingsData.emailAlerts}
                  onCheckedChange={(checked) => setSettingsData({ ...settingsData, emailAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <div>
                  <span className="font-semibold text-foreground block">SMS Emergency Alerts</span>
                  <span className="text-[11px] text-muted-foreground">Instant SMS for emergency worker dispatch</span>
                </div>
                <Switch
                  checked={settingsData.smsEmergencyAlerts}
                  onCheckedChange={(checked) => setSettingsData({ ...settingsData, smsEmergencyAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <div>
                  <span className="font-semibold text-foreground block">Weekly Welfare Digest</span>
                  <span className="text-[11px] text-muted-foreground">Automated weekly training & scheme report</span>
                </div>
                <Switch
                  checked={settingsData.weeklyWelfareDigest}
                  onCheckedChange={(checked) => setSettingsData({ ...settingsData, weeklyWelfareDigest: checked })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsSettingsOpen(false)}>
                Close
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Preferences
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
