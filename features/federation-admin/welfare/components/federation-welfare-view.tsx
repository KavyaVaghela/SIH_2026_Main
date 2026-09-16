"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Phone,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { federationWelfareService } from "../services/federation-welfare-service";
import type { FederationWelfareMetrics } from "@/features/worker/welfare-certification/types";

export interface FederationWelfareViewProps {
  federationId?: string;
}

export function FederationWelfareView({ federationId }: FederationWelfareViewProps) {
  const [loading, setLoading] = React.useState(true);
  const [metrics, setMetrics] = React.useState<FederationWelfareMetrics | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [viewTab, setViewTab] = React.useState<"attention" | "training" | "skills">("attention");
  const [remindedWorkers, setRemindedWorkers] = React.useState<Record<string, boolean>>({});

  const loadMetrics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await federationWelfareService.getFederationWelfareMetrics(federationId);
      setMetrics(data);
    } catch (err: any) {
      console.error("Failed to load federation welfare metrics:", err);
      setError(err?.message || "Failed to load federation welfare data.");
    } finally {
      setLoading(false);
    }
  }, [federationId]);

  React.useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleSendReminder = (workerId: string) => {
    setRemindedWorkers((prev) => ({ ...prev, [workerId]: true }));
  };

  if (loading) {
    return (
      <div className="space-y-6 w-full max-w-[1500px] mx-auto pb-16">
        <PageHeader
          title="Workforce Welfare & Development"
          description="Loading aggregate workforce compliance, welfare programs, and training metrics..."
          breadcrumbs={[
            { label: "Federation Hub", href: "/federation-admin" },
            { label: "Welfare & Development" },
          ]}
        />
        <Card className="p-12 text-center border-dashed">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">Querying Federation Workforce...</h3>
          <p className="text-xs text-muted-foreground mt-1">Filtering active workers, certifications, and development needs.</p>
        </Card>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="space-y-6 w-full max-w-[1500px] mx-auto pb-16">
        <PageHeader
          title="Workforce Welfare & Development"
          description="Federation-scoped welfare monitoring and skill progression."
          breadcrumbs={[
            { label: "Federation Hub", href: "/federation-admin" },
            { label: "Welfare & Development" },
          ]}
        />
        <Card className="p-8 text-center border-rose-300 dark:border-rose-900 bg-rose-50/20">
          <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-foreground">Could Not Load Welfare Data</h3>
          <p className="text-xs text-muted-foreground mt-1">{error || "Failed to query federation workforce metrics."}</p>
          <Button size="sm" onClick={loadMetrics} className="mt-4 text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-[1500px] mx-auto pb-16">
      {/* 1. Header with Federation Scope Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Workforce Welfare & Development"
          description={`Aggregate welfare oversight, trade certification tracking, and skill progression for ${metrics.federationName}.`}
          breadcrumbs={[
            { label: "Federation Hub", href: "/federation-admin" },
            { label: "Welfare & Development" },
          ]}
        />

        <div className="flex items-center gap-2 self-start md:self-center">
          <Badge variant="outline" className="text-xs border-emerald-600/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1">
            Federation-Scoped ✓
          </Badge>
          <Link href="/federation-admin/guidance">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <BookOpen className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Federation Guidance
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={loadMetrics} className="text-xs h-9">
            <RefreshCw className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Top-Level Metric Cards — 4 Column Responsive Desktop Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* KPI 1: Active Workers */}
        <Card className="p-4 border shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Workers
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                {metrics.totalActiveWorkers}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Cooperative Members</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Registered ✓</span>
          </div>
        </Card>

        {/* KPI 2: Certifications Requiring Attention */}
        <Card className="p-4 border shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Certifications Expiring
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 tracking-tight">
                {metrics.totalExpiringCertifications + metrics.totalExpiredCertifications}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>{metrics.totalExpiringCertifications} within 30d, {metrics.totalExpiredCertifications} expired</span>
            <button
              type="button"
              onClick={() => setViewTab("attention")}
              className="text-amber-600 hover:underline font-bold cursor-pointer"
            >
              Action →
            </button>
          </div>
        </Card>

        {/* KPI 3: Profiles Incomplete */}
        <Card className="p-4 border shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Profiles Incomplete
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                {metrics.incompleteProfilesCount}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Awaiting bank/ID proof</span>
            <Link href="/federation-admin/worker-information" className="text-emerald-600 hover:underline font-semibold">
              Review →
            </Link>
          </div>
        </Card>

        {/* KPI 4: Training Candidates */}
        <Card className="p-4 border shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Training Candidates
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                {metrics.trainingCandidatesCount}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Eligible for accreditation</span>
            <button
              type="button"
              onClick={() => setViewTab("training")}
              className="text-emerald-600 hover:underline font-semibold cursor-pointer"
            >
              Candidates →
            </button>
          </div>
        </Card>
      </div>

      {/* 3. Actionable Lists & Tabs */}
      <div className="space-y-4 w-full">
        <div className="flex flex-wrap items-center gap-2 border-b pb-2">
          <Button
            size="sm"
            variant={viewTab === "attention" ? "default" : "outline"}
            onClick={() => setViewTab("attention")}
            className="text-xs h-8"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Certifications Needing Attention ({metrics.attentionList.length})
          </Button>
          <Button
            size="sm"
            variant={viewTab === "training" ? "default" : "outline"}
            onClick={() => setViewTab("training")}
            className="text-xs h-8"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Workforce Development Needs ({metrics.developmentNeedsList.length})
          </Button>
          <Button
            size="sm"
            variant={viewTab === "skills" ? "default" : "outline"}
            onClick={() => setViewTab("skills")}
            className="text-xs h-8"
          >
            <Award className="h-3.5 w-3.5 mr-1.5" />
            Trade & Skill Distribution ({metrics.skillDistribution.length})
          </Button>
        </div>

        {/* VIEW 1: ATTENTION LIST (Expiring / Expired Certifications) */}
        {viewTab === "attention" && (
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {metrics.attentionList.length} Certifications Require Attention
                </h3>
                <p className="text-xs text-muted-foreground">
                  Federation workers with credentials expired or due to expire within 30 days.
                </p>
              </div>
            </div>

            {metrics.attentionList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {metrics.attentionList.map((item) => {
                  const isReminded = remindedWorkers[item.workerId];

                  return (
                    <Card
                      key={`${item.workerId}-${item.certName}`}
                      className={`p-4 border space-y-3 flex flex-col justify-between h-full ${
                        item.issue === "EXPIRING_SOON"
                          ? "border-amber-500/50 bg-amber-50/15 dark:bg-amber-950/10"
                          : "border-rose-400 dark:border-rose-900 bg-rose-50/15"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            variant={item.issue === "EXPIRING_SOON" ? "warning" : "destructive"}
                            className="text-[9px] uppercase font-bold"
                          >
                            {item.issue === "EXPIRING_SOON"
                              ? `Expires in ${item.daysRemaining} days`
                              : "Expired"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {item.profession}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-foreground leading-snug">
                          {item.workerName}
                        </h4>

                        <div className="p-2.5 rounded-lg bg-card border text-xs space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                            Certificate:
                          </span>
                          <p className="font-medium text-foreground">{item.certName}</p>
                          <span className="text-[10px] text-muted-foreground block pt-1">
                            Expiry Date: <strong>{item.expiryDate}</strong>
                          </span>
                        </div>

                        {item.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 text-emerald-600" />
                            <span>{item.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                        <Button
                          size="sm"
                          variant={isReminded ? "secondary" : "default"}
                          disabled={isReminded}
                          onClick={() => handleSendReminder(item.workerId)}
                          className="w-full text-xs"
                        >
                          {isReminded ? "Reminder Sent ✓" : "Send Renewal Notice"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-foreground">No certifications requiring immediate attention</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  All active workforce credentials in this cooperative federation are currently valid.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* VIEW 2: DEVELOPMENT CANDIDATES */}
        {viewTab === "training" && (
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {metrics.developmentNeedsList.length} Workforce Development Candidates
                </h3>
                <p className="text-xs text-muted-foreground">
                  Experienced workers who would benefit from advanced trade certification or safety accreditation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {metrics.developmentNeedsList.map((item) => (
                <Card key={item.workerId} className="p-4 border space-y-3 flex flex-col justify-between h-full">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{item.workerName}</h4>
                        <span className="text-xs text-muted-foreground">{item.profession} ({item.experienceYears} yrs exp)</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {item.certificationsCount} Certs
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/30 border text-xs space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Recommended Next Step:
                      </span>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-400">
                        {item.suggestedDevelopment}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      {item.skillsCount} skills mapped
                    </span>
                    <Link href={`/federation-admin/worker-information?workerId=${item.workerId}`}>
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        View Worker Dossier →
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: TRADE & SKILL DISTRIBUTION */}
        {viewTab === "skills" && (
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Federation Trade & Skill Distribution
                </h3>
                <p className="text-xs text-muted-foreground">
                  Breakdown of active workers by trade across {metrics.federationName}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 w-full">
              {metrics.skillDistribution.map((sd) => (
                <Card key={sd.profession} className="p-3 border text-center space-y-1">
                  <span className="text-xl font-extrabold text-foreground">{sd.count}</span>
                  <p className="text-xs font-semibold text-foreground truncate">{sd.profession}</p>
                  <span className="text-[10px] text-muted-foreground block">
                    {Math.round((sd.count / metrics.totalActiveWorkers) * 100)}% of workforce
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Statutory Federation Jurisdiction Footer */}
      <div className="p-4 rounded-xl border bg-muted/20 text-xs text-muted-foreground space-y-1">
        <strong>Statutory Federation Boundary:</strong> All metrics displayed above are strictly filtered for <strong>{metrics.federationName}</strong>. Member cooperatives in other regional federations are isolated under statutory cooperative confidentiality guidelines.
      </div>
    </div>
  );
}
