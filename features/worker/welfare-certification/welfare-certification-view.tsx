"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  HeartHandshake,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Wallet,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { workerWelfareService } from "./services/worker-welfare-service";
import type { WorkerWelfareDashboardData } from "./types";

export interface WelfareCertificationViewProps {
  workerId?: string;
  initialTab?: "overview" | "certifications" | "skills" | "benefits" | "safety";
}

export function WelfareCertificationView({ workerId, initialTab = "overview" }: WelfareCertificationViewProps) {
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "certifications" | "skills" | "benefits" | "safety"
  >(initialTab);
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<WorkerWelfareDashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await workerWelfareService.getWorkerWelfareOverview(workerId);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load worker welfare data:", err);
      setError(err?.message || "Failed to load worker welfare details.");
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6 w-full max-w-[1500px] mx-auto pb-16">
        <PageHeader
          title="Welfare & Development"
          description="Loading verified cooperative welfare standing, skills, and certifications..."
          breadcrumbs={[
            { label: "Worker Dashboard", href: "/worker" },
            { label: "Welfare & Development" },
          ]}
        />
        <Card className="p-12 text-center border-dashed">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">Fetching Welfare Dossier...</h3>
          <p className="text-xs text-muted-foreground mt-1">Connecting to authenticated cooperative federation database.</p>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 w-full max-w-[1500px] mx-auto pb-16">
        <PageHeader
          title="Welfare & Development"
          description="Cooperative growth, skills development, and statutory welfare support."
          breadcrumbs={[
            { label: "Worker Dashboard", href: "/worker" },
            { label: "Welfare & Development" },
          ]}
        />
        <Card className="p-8 text-center border-rose-300 dark:border-rose-900 bg-rose-50/20">
          <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-foreground">Could Not Load Welfare Data</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{error || "Unable to query worker welfare record."}</p>
          <Button size="sm" onClick={loadData} className="mt-4 text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-[1500px] mx-auto pb-16">
      {/* 1. Header with Breadcrumbs & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Welfare & Development"
          description={`Your cooperative growth, skills accreditation, and welfare center — ${data.workerName} (${data.profession}).`}
          breadcrumbs={[
            { label: "Worker Dashboard", href: "/worker" },
            { label: "Welfare & Development" },
          ]}
        />

        <div className="flex items-center gap-2 self-start md:self-center">
          <Link href="/worker/guidance?q=welfare">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <HelpCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Welfare Guidance
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs h-9">
            <RefreshCw className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Top-Level Section Filter / Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3 w-full">
        <Button
          size="sm"
          variant={activeTab === "overview" ? "default" : "outline"}
          onClick={() => setActiveTab("overview")}
          className="text-xs h-8"
        >
          <Award className="h-3.5 w-3.5 mr-1.5" />
          Overview
        </Button>
        <Button
          size="sm"
          variant={activeTab === "certifications" ? "default" : "outline"}
          onClick={() => setActiveTab("certifications")}
          className="text-xs h-8"
        >
          <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
          Certifications ({data.certifications.length})
        </Button>
        <Button
          size="sm"
          variant={activeTab === "skills" ? "default" : "outline"}
          onClick={() => setActiveTab("skills")}
          className="text-xs h-8"
        >
          <Wrench className="h-3.5 w-3.5 mr-1.5" />
          Skills & Training ({data.skills.length})
        </Button>
        <Button
          size="sm"
          variant={activeTab === "benefits" ? "default" : "outline"}
          onClick={() => setActiveTab("benefits")}
          className="text-xs h-8"
        >
          <HeartHandshake className="h-3.5 w-3.5 mr-1.5" />
          Benefits & Welfare ({data.welfareBenefits.length})
        </Button>
        <Button
          size="sm"
          variant={activeTab === "safety" ? "default" : "outline"}
          onClick={() => setActiveTab("safety")}
          className="text-xs h-8"
        >
          <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
          Safety & Support
        </Button>
      </div>

      {/* 3. Global Urgent Alert: Expiring Certifications Banner */}
      {data.expiringCertificationsCount > 0 && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                    Certification Renewal Notice
                  </h4>
                  <Badge variant="warning" className="text-[10px] font-bold">
                    {data.expiringCertificationsCount} Expiring Soon
                  </Badge>
                </div>
                <p className="text-xs text-amber-900/90 dark:text-amber-300 leading-relaxed">
                  {data.certifications.find((c) => c.status === "EXPIRING_SOON")?.title} expires in{" "}
                  <strong>{data.certifications.find((c) => c.status === "EXPIRING_SOON")?.daysRemaining} days</strong>.
                  Keep certifications current to avoid booking dispatch restrictions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-amber-500/40 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                onClick={() => setActiveTab("certifications")}
              >
                View Details
              </Button>
              <Link href="/worker/guidance?q=certification">
                <Button size="sm" className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
                  Renewal Guide →
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW                                                           */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-8 w-full">
          {/* Key Metric Highlights — 3 Column Desktop Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
            {/* KPI 1: Earnings This Month */}
            <Card className="p-5 border shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Earnings This Month
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                    ₹{data.earningsThisMonth.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> {data.completedJobsCount} completed jobs
                </span>
                <Link href="/worker/earnings" className="text-muted-foreground hover:text-foreground font-medium underline">
                  View Ledger →
                </Link>
              </div>
            </Card>

            {/* KPI 2: Certifications */}
            <Card className="p-5 border shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Trade Certifications
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                    {data.activeCertificationsCount} Active
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  <Award className="h-5 w-5" />
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                {data.expiringCertificationsCount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {data.expiringCertificationsCount} expiring soon
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> All credentials valid
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab("certifications")}
                  className="text-muted-foreground hover:text-foreground font-medium underline cursor-pointer"
                >
                  Manage →
                </button>
              </div>
            </Card>

            {/* KPI 3: Skill Level & Standing */}
            <Card className="p-5 border shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Cooperative Standing
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-foreground mt-1 tracking-tight truncate">
                    {data.skillLevelTitle}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  <UserCheck className="h-5 w-5" />
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {data.experienceYears} years experience
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("skills")}
                  className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  Skills ({data.skills.length}) →
                </button>
              </div>
            </Card>
          </div>

          {/* Section: Development Journey Visual Progression */}
          <Card className="border shadow-xs p-6 space-y-5 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-base font-bold text-foreground">
                    Worker Development Journey
                  </CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Your progression roadmap through the cooperative federation framework.
                </CardDescription>
              </div>

              <Link href="/worker/guidance" className="text-xs text-emerald-600 hover:underline font-semibold flex items-center">
                Explore Full Roadmap in Guidance <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {/* Journey Stages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 w-full">
              {data.journeyStages.map((stage) => {
                return (
                  <div
                    key={stage.stepNumber}
                    className={`p-3 rounded-xl border flex flex-col justify-between text-left space-y-2 transition-all ${
                      stage.isCompleted
                        ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : stage.isCurrent
                        ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-500"
                        : "border-border/60 bg-muted/20 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                          stage.isCompleted
                            ? "bg-emerald-600 text-white"
                            : stage.isCurrent
                            ? "bg-amber-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {stage.isCompleted ? "✓" : stage.stepNumber}
                      </span>
                      {stage.isCurrent && (
                        <Badge variant="warning" className="text-[8px] py-0 px-1">
                          Current
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-foreground leading-tight">{stage.title}</h5>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {stage.description}
                      </p>
                    </div>

                    {stage.completedDetail && (
                      <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 pt-1 border-t border-border/40">
                        {stage.completedDetail}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Two Block Section: Recommendations + Welfare Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
            {/* Left: Honest Recommendations */}
            <Card className="border shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-foreground">Recommended Development Pathways</h4>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-600/30">
                  Honest AI Advice
                </Badge>
              </div>

              <div className="space-y-3">
                {data.recommendations.map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-all space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider">
                          {rec.recommendationType}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40">
                          {rec.badge}
                        </Badge>
                      </div>
                    </div>
                    <h5 className="text-xs font-bold text-foreground leading-snug">{rec.title}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-muted-foreground italic">{rec.basedOn}</span>
                      <Link href={rec.guidanceHref} className="text-emerald-600 font-semibold hover:underline inline-flex items-center text-[11px]">
                        Guidance →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Right: Welfare & Safety Highlights */}
            <div className="space-y-6">
              {/* Cooperative Welfare Programs Card */}
              <Card className="border shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-foreground">Cooperative Welfare & Benefits</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("benefits")}
                    className="text-xs text-emerald-600 hover:underline font-semibold cursor-pointer"
                  >
                    View All ({data.welfareBenefits.length}) →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {data.welfareBenefits.slice(0, 2).map((wb) => (
                    <div key={wb.id} className="p-3 rounded-lg border bg-card space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground">{wb.title}</span>
                        <Badge variant="outline" className="text-[9px]">{wb.statusLabel}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{wb.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Safety & Federation Contact Card */}
              <Card className="border shadow-xs p-6 space-y-3 bg-gradient-to-br from-emerald-50/20 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-foreground">Safety & Emergency Support</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("safety")}
                    className="text-xs text-emerald-600 hover:underline font-semibold cursor-pointer"
                  >
                    Details →
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Direct statutory protection provided under <strong>{data.safetySupport.federationName}</strong>.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href="/worker/grievances/new">
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      <ShieldAlert className="h-3 w-3 mr-1 text-rose-600" />
                      Raise Safety Complaint
                    </Button>
                  </Link>
                  <Link href="/worker/guidance?q=safety">
                    <Button size="sm" variant="ghost" className="text-xs h-7 text-emerald-600 hover:underline">
                      Read Safety Protocol →
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CERTIFICATIONS                                                     */}
      {/* ========================================================================= */}
      {activeTab === "certifications" && (
        <div className="space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Verified Trade Certifications & Compliance
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authentic skill certifications registered in the state cooperative database for {data.workerName}.
              </p>
            </div>

            <Link href="/worker/guidance?q=certification">
              <Button size="sm" variant="outline" className="text-xs">
                <BookOpen className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                How Do Certifications Work?
              </Button>
            </Link>
          </div>

          {/* Certifications Card Grid — 3 Column Responsive Desktop */}
          {data.certifications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
              {data.certifications.map((cert) => (
                <Card
                  key={cert.id}
                  className={`border p-5 space-y-4 flex flex-col justify-between h-full w-full ${
                    cert.status === "EXPIRING_SOON"
                      ? "border-amber-500/60 bg-amber-50/15 dark:bg-amber-950/10 shadow-xs"
                      : cert.status === "EXPIRED"
                      ? "border-rose-300 dark:border-rose-900 bg-rose-50/10"
                      : "hover:border-emerald-500/40"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant={
                          cert.status === "ACTIVE"
                            ? "default"
                            : cert.status === "EXPIRING_SOON"
                            ? "warning"
                            : "destructive"
                        }
                        className="text-[10px] font-bold tracking-wide uppercase"
                      >
                        {cert.status === "ACTIVE" && "✓ ACTIVE"}
                        {cert.status === "EXPIRING_SOON" && `⚠ EXPIRING SOON (${cert.daysRemaining}d)`}
                        {cert.status === "EXPIRED" && "✕ EXPIRED"}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {cert.certificateNumber || "VERIFIED"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground leading-snug break-words">
                      {cert.title}
                    </h4>

                    <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span>Issuing Body:</span>
                        <strong className="text-foreground font-medium text-right truncate max-w-[180px]">
                          {cert.issuingBody}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Associated Trade:</span>
                        <span className="text-foreground font-medium">{cert.skillTrade}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Issued Date:</span>
                        <span>{cert.issueDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Expiry Date:</span>
                        <strong
                          className={
                            cert.status === "EXPIRING_SOON"
                              ? "text-amber-600 dark:text-amber-400 font-bold"
                              : cert.status === "EXPIRED"
                              ? "text-rose-600 font-bold"
                              : "text-foreground font-medium"
                          }
                        >
                          {cert.expiryDate || "Lifetime"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                    {cert.status === "EXPIRING_SOON" ? (
                      <Link href="/worker/guidance?q=certification" className="w-full">
                        <Button size="sm" className="w-full text-xs bg-amber-600 hover:bg-amber-700 text-white">
                          Renew Certification →
                        </Button>
                      </Link>
                    ) : cert.status === "EXPIRED" ? (
                      <Link href="/worker/guidance?q=certification" className="w-full">
                        <Button size="sm" variant="destructive" className="w-full text-xs">
                          Re-certify with Cooperative →
                        </Button>
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between w-full text-muted-foreground">
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Valid & Verified
                        </span>
                        <Link href="/worker/guidance?q=certification" className="text-xs hover:underline text-foreground">
                          Compliance Info
                        </Link>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Empty State for Workers With No Certifications */
            <Card className="p-10 text-center border-dashed space-y-3 w-full">
              <Award className="h-10 w-10 text-muted-foreground mx-auto" />
              <h4 className="text-base font-bold text-foreground">No certifications recorded yet</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Registered skill certificates establish customer trust, increase booking request matching, and qualify you for high-value cooperative contracts.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link href="/worker/guidance?q=certification">
                  <Button size="sm" className="text-xs">
                    How to Get Certified
                  </Button>
                </Link>
                <Link href="/worker/grievances/new">
                  <Button size="sm" variant="outline" className="text-xs">
                    Contact Federation Desk
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SKILLS & TRAINING                                                  */}
      {/* ========================================================================= */}
      {activeTab === "skills" && (
        <div className="space-y-8 w-full">
          {/* Section 1: Current Verified Skills */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-emerald-600" />
                  Verified Skills & Proficiency Levels
                </h3>
                <p className="text-xs text-muted-foreground">
                  Trade capabilities registered with your cooperative profile.
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-emerald-700">
                {data.skills.length} Skills
              </Badge>
            </div>

            {data.skills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                {data.skills.map((skill) => (
                  <Card key={skill.id} className="p-4 border shadow-xs space-y-3 flex flex-col justify-between h-full">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-bold text-foreground">{skill.name}</h4>
                        <Badge variant="secondary" className="text-[10px] uppercase font-mono font-bold">
                          {skill.proficiencyLevel}
                        </Badge>
                      </div>

                      {skill.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{skill.description}</p>
                      )}

                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Proficiency Index:</span>
                          <strong>{skill.proficiencyPercent}%</strong>
                        </div>
                        <Progress value={skill.proficiencyPercent} className="h-2" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Trade: {data.profession}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Active in Catalog ✓</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h4 className="text-sm font-bold text-foreground">No specific skill entries mapped</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Your profession is recorded as <strong>{data.profession}</strong>. Update your profile to map specific skills.
                </p>
                <Link href="/worker/profile" className="mt-3 inline-block">
                  <Button size="sm" variant="outline" className="text-xs">Update Profile Skills</Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Section 2: Intelligent Training Recommendations */}
          <div className="space-y-4 pt-4 border-t border-border/70">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Intelligent Development Recommendations
                </h3>
                <p className="text-xs text-muted-foreground">
                  Objective skill and certification suggestions based on your existing profile (labeled Recommended).
                </p>
              </div>
              <Link href="/worker/guidance?q=skills">
                <Button size="sm" variant="outline" className="text-xs">
                  <HelpCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  How Can I Improve My Skills?
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
              {data.recommendations.map((rec) => (
                <Card key={rec.id} className="p-5 border shadow-xs flex flex-col justify-between h-full space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-600/30">
                        {rec.recommendationType}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {rec.badge}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-bold text-foreground leading-snug break-words">
                      {rec.title}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed break-words">
                      {rec.reason}
                    </p>

                    <div className="p-2.5 rounded-lg bg-muted/40 text-[11px] text-foreground space-y-1">
                      <span className="font-semibold block text-muted-foreground text-[10px] uppercase tracking-wider">
                        Suggested Action:
                      </span>
                      <p>{rec.suggestedAction}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">
                      {rec.basedOn}
                    </span>
                    <Link href={rec.guidanceHref}>
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        Learn More →
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BENEFITS & WELFARE                                                 */}
      {/* ========================================================================= */}
      {activeTab === "benefits" && (
        <div className="space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-emerald-600" />
                Cooperative Welfare Programs & Statutory Resources
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cooperative mutual support programs maintained by {data.safetySupport.federationName}.
              </p>
            </div>

            <Link href="/worker/guidance?q=welfare">
              <Button size="sm" variant="outline" className="text-xs">
                <BookOpen className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                How Do Cooperative Welfare Programs Work?
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
            {data.welfareBenefits.map((benefit) => (
              <Card key={benefit.id} className="p-5 border shadow-xs flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-emerald-600/30 text-emerald-700">
                      {benefit.category}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {benefit.statusLabel}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-bold text-foreground leading-snug break-words">
                    {benefit.title}
                  </h4>

                  <p className="text-xs text-muted-foreground leading-relaxed break-words">
                    {benefit.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-foreground">
                    <span className="font-semibold block text-emerald-800 dark:text-emerald-300 text-[10px] uppercase">
                      Program Terms:
                    </span>
                    <p className="mt-0.5 leading-relaxed">{benefit.coverageNote}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <Link href={benefit.guidanceHref} className="w-full">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      Learn More in Guidance <ArrowRight className="h-3 w-3 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Legal / Statutory Compliance Note */}
          <div className="p-4 rounded-xl border bg-muted/20 text-xs text-muted-foreground space-y-1">
            <strong>Cooperative Statutory Disclosure:</strong> Welfare benefits and skill subsidies are administered directly under the Gujarat Cooperative Societies Framework. No arbitrary monetary claims are fabricated; all grant disbursements require active membership standing and cooperative executive committee approval.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SAFETY & SUPPORT                                                   */}
      {/* ========================================================================= */}
      {activeTab === "safety" && (
        <div className="space-y-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-emerald-600" />
                Worker Safety & Emergency Support
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Statutory field safety guidelines and direct contact channels for your cooperative federation.
              </p>
            </div>

            <Link href="/worker/guidance?q=safety">
              <Button size="sm" variant="outline" className="text-xs">
                <BookOpen className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Worker Safety Guide
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
            {/* Dynamic Federation Emergency Contact Card */}
            <Card className="p-6 border shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Federation Administration Desk</h4>
                  <p className="text-xs text-muted-foreground">Dynamic contact details from cooperative records.</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-card border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Federation Unit:
                  </span>
                  <p className="text-sm font-bold text-foreground">{data.safetySupport.federationName}</p>
                </div>

                {data.safetySupport.contactPhone ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                    <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Helpline / Phone:</span>
                      <a href={`tel:${data.safetySupport.contactPhone}`} className="text-sm font-bold text-foreground hover:underline">
                        {data.safetySupport.contactPhone}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-card border text-muted-foreground">
                    <span>Contact Phone: Contact your Federation Administrator via the Grievance Center.</span>
                  </div>
                )}

                {data.safetySupport.contactEmail && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                    <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Official Email:</span>
                      <a href={`mailto:${data.safetySupport.contactEmail}`} className="text-xs font-semibold text-foreground hover:underline">
                        {data.safetySupport.contactEmail}
                      </a>
                    </div>
                  </div>
                )}

                {data.safetySupport.officeAddress && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                    <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Registered Office:</span>
                      <span className="text-xs text-foreground leading-relaxed">{data.safetySupport.officeAddress}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <Link href={data.safetySupport.grievanceHref} className="w-full sm:w-auto">
                  <Button size="sm" variant="default" className="text-xs w-full sm:w-auto">
                    <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                    File Incident / Grievance
                  </Button>
                </Link>
                <Link href={data.safetySupport.safetyGuidanceHref} className="w-full sm:w-auto">
                  <Button size="sm" variant="outline" className="text-xs w-full sm:w-auto">
                    Safety Center Guidance
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Field Safety Reminders */}
            <Card className="p-6 border shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Mandatory Service Safety Reminders</h4>
                  <p className="text-xs text-muted-foreground">Standard field procedures for cooperative technicians.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {data.safetySupport.emergencyGuidelines.map((guide, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/60 text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-bold shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <p className="text-foreground leading-relaxed flex-1">{guide}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-300">
                <strong>Important:</strong> Under Gujarat Cooperative worker protection statutes, you are legally entitled to pause execution of any job that lacks basic electrical grounding or poses severe structural hazard without customer remediation.
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
