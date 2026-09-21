"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSuperAdminOverview } from "./hooks/use-super-admin-overview";
import { KPIGrid } from "./components/kpi-grid";
import { BookingActivityChart } from "./components/booking-activity-chart";
import { DemandSummaryPanel } from "./components/demand-summary-panel";
import { CriticalAlertsPanel } from "./components/critical-alerts-panel";
import { createClient } from "@/lib/supabase/client";
import { getCachedProfileName, setCachedProfileName } from "@/lib/auth/session-user";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function SuperAdminDashboardView() {
  const { data, isLoading, timeframe, setTimeframe, refresh } = useSuperAdminOverview();

  // Deterministic initial state for SSR and client first render to avoid hydration mismatches
  const [adminName, setAdminName] = React.useState<string>("");
  const [isLoadingAdminName, setIsLoadingAdminName] = React.useState<boolean>(true);
  const [greeting, setGreeting] = React.useState<string>("Good Morning");

  React.useEffect(() => {
    // 1. Sync time-based greeting post-hydration to prevent timezone/daypart mismatches
    setGreeting(getGreeting());

    // 2. Read cached profile name post-hydration for instantaneous UI update without hydration mismatch
    const cached = getCachedProfileName("SUPER_ADMIN");
    if (cached) {
      setAdminName(cached);
      setIsLoadingAdminName(false);
    }

    // 3. Authoritative profile fetch from Supabase
    let isMounted = true;
    async function fetchAdminProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profile } = await (supabase.from("profiles") as any)
            .select("full_name, role")
            .eq("id", user.id)
            .maybeSingle();

          if (isMounted) {
            const resolvedName = profile?.full_name || "System Administrator";
            setCachedProfileName("SUPER_ADMIN", resolvedName);
            setAdminName(resolvedName);
          }
        } else if (isMounted && !cached) {
          setAdminName("System Administrator");
        }
      } catch (err) {
        console.error("Error loading super admin profile", err);
        if (isMounted && !cached) {
          setAdminName("System Administrator");
        }
      } finally {
        if (isMounted) setIsLoadingAdminName(false);
      }
    }
    fetchAdminProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayGreetingName = adminName || "System Administrator";

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {greeting},{" "}
            {isLoadingAdminName || !adminName ? (
              <span className="inline-block h-8 w-44 sm:w-56 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md align-middle" />
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">{displayGreetingName}</span>
            )}{" "}
            👋
          </span>
        }
        description="Platform-wide cooperative governance, workforce operations, service volume trends, and intelligence."
        breadcrumbs={[{ label: "Super Admin", href: "/super-admin" }, { label: "Overview" }]}
        actions={
          <div className="flex items-center space-x-3">
            {data?.lastUpdated && (
              <Badge variant="outline" className="hidden sm:inline-flex text-xs text-muted-foreground bg-card">
                Updated {data.lastUpdated}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="h-9 border-emerald-800/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        }
      />

      {/* Critical Platform Alerts */}
      <CriticalAlertsPanel alerts={data?.alerts} isLoading={isLoading} />

      {/* Platform-wide KPI Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Platform Governance Metrics
        </h3>
        <KPIGrid stats={data?.stats} isLoading={isLoading} />
      </div>

      {/* Analytics & Demand Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BookingActivityChart
            data={data?.activityTrends}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            isLoading={isLoading}
          />
        </div>
        <div>
          <DemandSummaryPanel
            categories={data?.topDemandCategories}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
