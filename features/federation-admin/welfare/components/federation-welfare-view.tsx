"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  Users,
  AlertTriangle,
  GraduationCap,
  Award,
  ChevronRight,
  ShieldCheck,
  LifeBuoy,
  CheckCircle2,
  UserPlus,
  FileText,
  Clock,
  Coins,
  Shield,
  Flame,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ExternalLink,
  BookOpen,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { federationWelfareService } from "../services/federation-welfare-service";
import type {
  FederationWelfareDashboardData,
  GovernmentSchemeCategory,
  GovernmentSchemeItem,
  TrainingProgramItem,
  WelfareRecentActivityItem,
} from "../types";

export interface FederationWelfareViewProps {
  federationId?: string;
}

function getSchemeCategoryBadge(category: GovernmentSchemeCategory) {
  switch (category) {
    case "Pension":
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium text-[11px] px-2 py-0.5">
          Pension
        </Badge>
      );
    case "Insurance":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-medium text-[11px] px-2 py-0.5">
          Insurance
        </Badge>
      );
    case "Social Welfare":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 font-medium text-[11px] px-2 py-0.5">
          Social Welfare
        </Badge>
      );
    case "Skill Development":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-medium text-[11px] px-2 py-0.5">
          Skill Development
        </Badge>
      );
    case "Health":
      return (
        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 font-medium text-[11px] px-2 py-0.5">
          Health
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[11px]">
          {category}
        </Badge>
      );
  }
}

function getSchemeIcon(iconName: string) {
  switch (iconName) {
    case "pension":
      return <Coins className="h-4 w-4 text-emerald-600" />;
    case "insurance":
      return <Shield className="h-4 w-4 text-blue-600" />;
    case "welfare":
      return <Flame className="h-4 w-4 text-purple-600" />;
    case "skill":
      return <Award className="h-4 w-4 text-amber-600" />;
    case "health":
      return <Activity className="h-4 w-4 text-rose-600" />;
    default:
      return <ShieldCheck className="h-4 w-4 text-emerald-600" />;
  }
}

export function FederationWelfareView({ federationId }: FederationWelfareViewProps) {
  const router = useRouter();
  const [timeframe, setTimeframe] = React.useState<string>("30d");
  const [loading, setLoading] = React.useState<boolean>(true);
  const [data, setData] = React.useState<FederationWelfareDashboardData | null>(null);

  // Modal Interactive States
  const [activeModal, setActiveModal] = React.useState<
    | null
    | "all-schemes"
    | "scheme-detail"
    | "all-training"
    | "training-detail"
    | "all-activity"
    | "safety-trainings"
    | "emergency-support"
    | "welfare-requests"
    | "pending-assistance"
    | "needing-assistance"
  >(null);

  const [selectedScheme, setSelectedScheme] = React.useState<GovernmentSchemeItem | null>(null);
  const [selectedProgram, setSelectedProgram] = React.useState<TrainingProgramItem | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await federationWelfareService.getWelfareDashboardData(
        federationId,
        timeframe
      );
      setData(result);
    } catch (err) {
      console.error("Failed to load federation welfare dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [federationId, timeframe]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !data) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-20 bg-muted/40 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-96 bg-muted/40 rounded-xl animate-pulse" />
          <div className="lg:col-span-5 h-96 bg-muted/40 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { kpis, schemes, trainingOverview, welfareSummary, safetySupport, recentActivities } = data;

  const handleOpenSchemeDetail = (scheme: GovernmentSchemeItem) => {
    setSelectedScheme(scheme);
    setActiveModal("scheme-detail");
  };

  const handleOpenProgramDetail = (program: TrainingProgramItem) => {
    setSelectedProgram(program);
    setActiveModal("training-detail");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0 mt-0.5">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Welfare & Development
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Monitor and manage worker welfare, training, certifications and development initiatives across your federation.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
          <Select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-[140px] h-9 text-xs font-medium border-border/80 bg-card"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </Select>
        </div>
      </div>

      {/* 2. Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Workers Covered */}
        <Card
          onClick={() => setActiveModal("all-schemes")}
          className="border border-border/70 shadow-xs hover:border-emerald-500/50 transition-all bg-card flex flex-col justify-between cursor-pointer group"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block leading-none group-hover:text-foreground transition-colors">
                    Workers Covered
                  </span>
                  <span className="text-[11px] text-muted-foreground/80 font-normal">
                    under Welfare Programs
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {kpis.workersCovered}
              </span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-[11px] px-2 py-0.5">
                <ArrowUpRight className="h-3 w-3 mr-0.5 text-emerald-600" /> {kpis.workersCoveredTrend}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span>{kpis.workersCoveredPercent}% of total workers ({kpis.totalWorkers})</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold group-hover:underline">View Schemes →</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Workers Needing Assistance */}
        <Card
          onClick={() => setActiveModal("needing-assistance")}
          className="border border-border/70 shadow-xs hover:border-amber-500/50 transition-all bg-card flex flex-col justify-between cursor-pointer group"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block leading-none group-hover:text-foreground transition-colors">
                    Workers Needing
                  </span>
                  <span className="text-[11px] text-muted-foreground/80 font-normal">
                    Assistance
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {kpis.workersNeedingAssistance}
              </span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-[11px] px-2 py-0.5">
                <ArrowDownRight className="h-3 w-3 mr-0.5 text-amber-600" /> {kpis.workersNeedingAssistanceTrend}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span>{kpis.workersNeedingAssistancePercent}% of total workers</span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold group-hover:underline">Review Triage →</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Active Training Programs */}
        <Card
          onClick={() => setActiveModal("all-training")}
          className="border border-border/70 shadow-xs hover:border-blue-500/50 transition-all bg-card flex flex-col justify-between cursor-pointer group"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block leading-none group-hover:text-foreground transition-colors">
                    Active Training Programs
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {kpis.activeTrainingProgramsCount}
              </span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-bold text-[11px] px-2 py-0.5">
                <ArrowUpRight className="h-3 w-3 mr-0.5 text-blue-600" /> {kpis.activeTrainingProgramsTrend}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span>Currently running</span>
              <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold group-hover:underline">View Courses →</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Welfare / Certification Coverage */}
        <Card
          onClick={() => setActiveModal("all-schemes")}
          className="border border-border/70 shadow-xs hover:border-purple-500/50 transition-all bg-card flex flex-col justify-between cursor-pointer group"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block leading-none group-hover:text-foreground transition-colors">
                    Welfare / Certification
                  </span>
                  <span className="text-[11px] text-muted-foreground/80 font-normal">
                    Coverage
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {kpis.welfareCoveragePercent}%
              </span>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 font-bold text-[11px] px-2 py-0.5">
                <ArrowUpRight className="h-3 w-3 mr-0.5 text-purple-600" /> {kpis.welfareCoverageTrend}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span>{kpis.welfareCoverageWorkersCount} / {kpis.totalWorkers} workers</span>
              <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold group-hover:underline">Audit Roster →</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Middle Section: Government Schemes (7 Cols) & Training/Certification (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Government Schemes & Welfare Programs Table */}
        <Card className="lg:col-span-7 border border-border/70 shadow-xs bg-card flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Government Schemes & Welfare Programs
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track worker coverage and manage scheme enrollment
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal("all-schemes")}
                className="text-xs font-semibold h-8 px-3 cursor-pointer"
              >
                View All
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                      <TableHead className="py-2.5 px-4">Scheme Name</TableHead>
                      <TableHead className="py-2.5 px-3">Category</TableHead>
                      <TableHead className="py-2.5 px-3 text-center">Eligible Workers</TableHead>
                      <TableHead className="py-2.5 px-3 text-center">Covered</TableHead>
                      <TableHead className="py-2.5 px-3">Status</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schemes.map((scheme) => (
                      <TableRow
                        key={scheme.id}
                        onClick={() => handleOpenSchemeDetail(scheme)}
                        className="hover:bg-muted/30 transition-colors border-b border-border/40 cursor-pointer group"
                      >
                        <TableCell className="py-3 px-4 font-medium text-xs text-foreground">
                          <div className="flex items-center space-x-2.5">
                            <div className="p-1.5 rounded-md bg-muted/60 text-foreground shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-colors">
                              {getSchemeIcon(scheme.iconName)}
                            </div>
                            <span className="font-semibold text-xs text-foreground leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {scheme.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          {getSchemeCategoryBadge(scheme.category)}
                        </TableCell>
                        <TableCell className="py-3 px-3 text-center text-xs font-semibold text-foreground">
                          {scheme.eligibleWorkers}
                        </TableCell>
                        <TableCell className="py-3 px-3 text-center text-xs font-bold text-foreground">
                          {scheme.coveredWorkers}
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          {scheme.status === "Active" ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold text-[10px] px-2 py-0.5">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-semibold text-[10px] px-2 py-0.5">
                              In Progress
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-3 text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground group-hover:text-emerald-600 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Training & Certification */}
        <Card className="lg:col-span-5 border border-border/70 shadow-xs bg-card flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Training & Certification
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Build skills, improve productivity, create better opportunities.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal("all-training")}
                className="text-xs font-semibold h-8 px-3 cursor-pointer"
              >
                View All
              </Button>
            </CardHeader>

            <CardContent className="p-4 space-y-5">
              {/* 4 Mini KPI Cards Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Mini KPI 1 */}
                <div
                  onClick={() => setActiveModal("all-training")}
                  className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1 cursor-pointer hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-300">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[11px] font-semibold leading-tight">
                      Active Training Programs
                    </span>
                  </div>
                  <span className="text-2xl font-extrabold text-foreground block tracking-tight pt-0.5">
                    {trainingOverview.activeProgramsCount}
                  </span>
                </div>

                {/* Mini KPI 2 */}
                <div
                  onClick={() => setActiveModal("all-training")}
                  className="p-3 rounded-xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 space-y-1 cursor-pointer hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center space-x-1.5 text-blue-700 dark:text-blue-300">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[11px] font-semibold leading-tight">
                      Workers Enrolled
                    </span>
                  </div>
                  <span className="text-2xl font-extrabold text-foreground block tracking-tight pt-0.5">
                    {trainingOverview.workersEnrolledCount}
                  </span>
                </div>

                {/* Mini KPI 3 */}
                <div
                  onClick={() => setActiveModal("all-training")}
                  className="p-3 rounded-xl border border-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20 space-y-1 cursor-pointer hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center space-x-1.5 text-purple-700 dark:text-purple-300">
                    <Award className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[11px] font-semibold leading-tight">
                      Certifications Completed
                    </span>
                  </div>
                  <span className="text-2xl font-extrabold text-foreground block tracking-tight pt-0.5">
                    {trainingOverview.certificationsCompletedCount}
                  </span>
                </div>

                {/* Mini KPI 4 */}
                <div
                  onClick={() => setActiveModal("all-training")}
                  className="p-3 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 space-y-1 cursor-pointer hover:border-amber-500/50 transition-all"
                >
                  <div className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-300">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[11px] font-semibold leading-tight">
                      Certifications Expiring <span className="text-[9px] text-muted-foreground">(Next 3M)</span>
                    </span>
                  </div>
                  <span className="text-2xl font-extrabold text-foreground block tracking-tight pt-0.5">
                    {trainingOverview.certificationsExpiringCount}
                  </span>
                </div>
              </div>

              {/* Top Training Programs List */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Top Training Programs</span>
                  <span className="text-[11px] text-muted-foreground font-medium">Enrolled Workers</span>
                </div>

                <div className="space-y-2.5">
                  {trainingOverview.topPrograms.map((program) => {
                    const percentage = Math.round((program.enrolledCount / program.maxCapacity) * 100);
                    return (
                      <div
                        key={program.id}
                        onClick={() => handleOpenProgramDetail(program)}
                        className="space-y-1 p-1.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="p-1 rounded bg-muted text-muted-foreground shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                              <GraduationCap className="h-3 w-3" />
                            </div>
                            <span className="font-semibold text-foreground truncate text-xs group-hover:text-blue-600 transition-colors">
                              {program.title}
                            </span>
                          </div>
                          <span className="font-bold text-foreground ml-2 shrink-0">
                            {program.enrolledCount}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2 bg-muted/60" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* 4. Bottom Section: Summary (Donut Chart), Safety & Support, Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Welfare & Development Summary */}
        <Card className="border border-border/70 shadow-xs bg-card flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold text-foreground">
              Welfare & Development Summary
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Overall progress in worker welfare, training and skill development
            </p>
          </CardHeader>

          <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
            {/* Donut Ring Visual */}
            <div className="flex flex-col items-center justify-center py-2 relative">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-muted/30"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Covered Segment (68%) - Emerald */}
                  <path
                    className="text-emerald-500"
                    strokeDasharray="68, 100"
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* In Progress Segment (21%) - Amber */}
                  <path
                    className="text-amber-500"
                    strokeDasharray="21, 100"
                    strokeDashoffset="-68"
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Not Covered Segment (11%) - Rose */}
                  <path
                    className="text-rose-500"
                    strokeDasharray="11, 100"
                    strokeDashoffset="-89"
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-foreground tracking-tight">
                    {welfareSummary.overallCoveragePercent}%
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Overall Coverage
                  </span>
                </div>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
              <div
                onClick={() => setActiveModal("all-schemes")}
                className="flex items-center justify-between p-1 rounded hover:bg-muted/30 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-foreground font-medium">Welfare Covered</span>
                </div>
                <span className="font-bold text-foreground">
                  {welfareSummary.coveredCount} ({welfareSummary.coveredPercent}%)
                </span>
              </div>

              <div
                onClick={() => setActiveModal("all-training")}
                className="flex items-center justify-between p-1 rounded hover:bg-muted/30 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-foreground font-medium">In Progress</span>
                </div>
                <span className="font-bold text-foreground">
                  {welfareSummary.inProgressCount} ({welfareSummary.inProgressPercent}%)
                </span>
              </div>

              <div
                onClick={() => setActiveModal("needing-assistance")}
                className="flex items-center justify-between p-1 rounded hover:bg-muted/30 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-foreground font-medium">Not Covered</span>
                </div>
                <span className="font-bold text-foreground">
                  {welfareSummary.notCoveredCount} ({welfareSummary.notCoveredPercent}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety & Worker Support */}
        <Card className="border border-border/70 shadow-xs bg-card flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold text-foreground">
              Safety & Worker Support
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ensuring a safe and secure work environment
            </p>
          </CardHeader>

          <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-3 my-auto">
              {/* Support Card 1 */}
              <div
                onClick={() => setActiveModal("safety-trainings")}
                className="p-3 rounded-xl border border-border/70 bg-card hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 hover:border-emerald-500/40 transition-all space-y-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-emerald-600">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Safety Trainings</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                </div>
                <span className="text-2xl font-extrabold text-foreground block tracking-tight pt-1">
                  {safetySupport.safetyTrainingsThisMonth}
                </span>
                <span className="text-[10px] text-muted-foreground block">This month</span>
              </div>

              {/* Support Card 2 */}
              <div
                onClick={() => router.push("/federation-admin/complaint-management")}
                className="p-3 rounded-xl border border-border/70 bg-card hover:bg-rose-50/40 dark:hover:bg-rose-950/20 hover:border-rose-500/40 transition-all space-y-1 relative group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-rose-600">
                    <LifeBuoy className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold text-foreground group-hover:text-rose-700 dark:group-hover:text-rose-400">Emergency Support</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-rose-600 transition-colors" />
                </div>
                <span className="text-2xl font-extrabold text-foreground block tracking-tight pt-1">
                  {safetySupport.emergencySupportRequests}
                </span>
                <span className="text-[10px] text-muted-foreground block">Requests</span>
              </div>

              {/* Support Card 3 */}
              <div
                onClick={() => setActiveModal("welfare-requests")}
                className="p-3 rounded-xl border border-border/70 bg-card hover:bg-blue-50/40 dark:hover:bg-blue-950/20 hover:border-blue-500/40 transition-all space-y-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-blue-600">
                    <HeartHandshake className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-400">Welfare Requests</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                </div>
                <span className="text-2xl font-extrabold text-foreground block tracking-tight pt-1">
                  {safetySupport.welfareRequestsThisMonth}
                </span>
                <span className="text-[10px] text-muted-foreground block">This month</span>
              </div>

              {/* Support Card 4 */}
              <div
                onClick={() => router.push("/federation-admin/worker-information")}
                className="p-3 rounded-xl border border-border/70 bg-card hover:bg-amber-50/40 dark:hover:bg-amber-950/20 hover:border-amber-500/40 transition-all space-y-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-amber-600">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400">Pending Assistance</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                </div>
                <span className="text-2xl font-extrabold text-foreground block tracking-tight pt-1">
                  {safetySupport.pendingAssistanceCount}
                </span>
                <span className="text-[10px] text-rose-600 font-semibold block">Requires action</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-border/70 shadow-xs bg-card flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground">
              Recent Activity
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("all-activity")}
              className="text-xs font-semibold h-7 px-2.5 cursor-pointer"
            >
              View All
            </Button>
          </CardHeader>

          <CardContent className="p-4 space-y-3 flex-1">
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => setActiveModal("all-activity")}
                  className="flex items-start space-x-3 pb-2.5 border-b border-border/40 last:border-0 last:pb-0 cursor-pointer hover:bg-muted/20 p-1 rounded transition-colors"
                >
                  <div className="p-1.5 rounded-full bg-muted/60 shrink-0 mt-0.5">
                    {act.type === "TRAINING_COMPLETED" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    {act.type === "WORKER_ENROLLED" && <UserPlus className="h-3.5 w-3.5 text-blue-600" />}
                    {act.type === "WELFARE_REQUEST" && <FileText className="h-3.5 w-3.5 text-amber-600" />}
                    {act.type === "CERTIFICATION_ISSUED" && <Award className="h-3.5 w-3.5 text-purple-600" />}
                    {act.type === "SCHEME_ELIGIBILITY" && <TrendingUp className="h-3.5 w-3.5 text-rose-600" />}
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground truncate block">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium shrink-0 ml-2">
                        {act.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE MODALS FOR ALL BUTTONS & CARDS */}
      {/* ========================================================================= */}

      {/* 1. Modal: All Government Schemes */}
      <Dialog open={activeModal === "all-schemes"} onClose={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Government Schemes & Welfare Programs Directory</span>
            </DialogTitle>
            <DialogDescription>
              Comprehensive overview of social security, health, and skill coverage across member workers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {schemes.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-muted/60 shrink-0">
                    {getSchemeIcon(s.iconName)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{s.name}</h4>
                    <span className="text-[11px] text-muted-foreground">
                      Covered: <strong className="text-foreground">{s.coveredWorkers}</strong> / {s.eligibleWorkers} eligible ({Math.round((s.coveredWorkers / s.eligibleWorkers) * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {getSchemeCategoryBadge(s.category)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenSchemeDetail(s)}
                    className="text-xs h-7"
                  >
                    Details <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Modal: Scheme Detail */}
      {selectedScheme && (
        <Dialog open={activeModal === "scheme-detail"} onClose={() => setActiveModal(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getSchemeIcon(selectedScheme.iconName)}
                <span>{selectedScheme.name}</span>
              </DialogTitle>
              <DialogDescription>
                Statutory Cooperative Guidance & Eligibility Breakdown
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Category</span>
                  <span className="font-semibold text-foreground">{selectedScheme.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Status</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-[10px] px-2 py-0">
                    {selectedScheme.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Eligible Workers</span>
                  <span className="font-semibold text-foreground">{selectedScheme.eligibleWorkers}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Enrolled / Covered</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{selectedScheme.coveredWorkers}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 space-y-1">
                <span className="font-bold flex items-center">
                  <Info className="h-3.5 w-3.5 mr-1" /> Guidance & Policy Disclaimer
                </span>
                <p className="text-[11px] leading-relaxed">
                  KaushalyaSetu acts as a federation tracking & verification bridge for statutory member enrolment under official Ministry portals. Direct benefit payouts are disbursed via Direct Benefit Transfer (DBT) to linked Aadhaar bank accounts.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-foreground block">Key Portal Access:</span>
                <Link
                  href="https://eshram.gov.in"
                  target="_blank"
                  className="inline-flex items-center text-emerald-600 hover:underline font-semibold"
                >
                  Official Ministry Enrollment Portal <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 3. Modal: All Training Programs */}
      <Dialog open={activeModal === "all-training"} onClose={() => setActiveModal(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <span>Federation Skill & Certification Programs</span>
            </DialogTitle>
            <DialogDescription>
              Active vocational courses, safety certifications, and digital literacy tracks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {trainingOverview.topPrograms.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl border border-border/70 bg-card space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">{p.title}</h4>
                  <Badge variant="outline" className="text-[10px]">
                    {p.enrolledCount} / {p.maxCapacity} Enrolled
                  </Badge>
                </div>
                <Progress value={(p.enrolledCount / p.maxCapacity) * 100} className="h-2 bg-muted/60" />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Modal: Training Program Detail */}
      {selectedProgram && (
        <Dialog open={activeModal === "training-detail"} onClose={() => setActiveModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>{selectedProgram.title}</span>
              </DialogTitle>
              <DialogDescription>
                Course Enrollment Roster & Capacity Metrics
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enrolled Workers:</span>
                  <span className="font-bold text-foreground">{selectedProgram.enrolledCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity Limit:</span>
                  <span className="font-bold text-foreground">{selectedProgram.maxCapacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Utilization:</span>
                  <span className="font-bold text-blue-600">{Math.round((selectedProgram.enrolledCount / selectedProgram.maxCapacity) * 100)}%</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Workforce candidates undergoing this module are verified for Skill India / IPSC certification upon course completion.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 5. Modal: Recent Operational Activity */}
      <Dialog open={activeModal === "all-activity"} onClose={() => setActiveModal(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <span>Complete Operational Activity Log</span>
            </DialogTitle>
            <DialogDescription>
              Timeline of trade training completions, scheme updates, and welfare dispatches.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start space-x-3 p-3 rounded-xl border border-border/70 bg-card">
                <div className="p-1.5 rounded-full bg-muted/60 shrink-0 mt-0.5">
                  {act.type === "TRAINING_COMPLETED" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  {act.type === "WORKER_ENROLLED" && <UserPlus className="h-4 w-4 text-blue-600" />}
                  {act.type === "WELFARE_REQUEST" && <FileText className="h-4 w-4 text-amber-600" />}
                  {act.type === "CERTIFICATION_ISSUED" && <Award className="h-4 w-4 text-purple-600" />}
                  {act.type === "SCHEME_ELIGIBILITY" && <TrendingUp className="h-4 w-4 text-rose-600" />}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">{act.title}</h4>
                    <span className="text-[10px] text-muted-foreground font-medium">{act.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{act.description}</p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Modal: Safety Trainings */}
      <Dialog open={activeModal === "safety-trainings"} onClose={() => setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Safety Training Sessions</span>
            </DialogTitle>
            <DialogDescription>
              Scheduled occupational hazard & first-aid workshops for this month.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <h5 className="font-bold text-foreground">1. High-Voltage Electrical Safety & PPE Protocol</h5>
              <span className="text-[11px] text-muted-foreground block">Completed • 24 Participants</span>
            </div>
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <h5 className="font-bold text-foreground">2. Hydraulic Pressure & Chemical Hazard Safety</h5>
              <span className="text-[11px] text-muted-foreground block">Active • 18 Participants</span>
            </div>
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <h5 className="font-bold text-foreground">3. Scaffold Structural Safety & Harness Anchor</h5>
              <span className="text-[11px] text-muted-foreground block">Upcoming • Oct 2, 2026</span>
            </div>
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <h5 className="font-bold text-foreground">4. Worksite Emergency Resuscitation & Heat Stress</h5>
              <span className="text-[11px] text-muted-foreground block">Upcoming • Oct 10, 2026</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Modal: Welfare Requests Log */}
      <Dialog open={activeModal === "welfare-requests"} onClose={() => setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <HeartHandshake className="h-5 w-5 text-blue-600" />
              <span>Welfare Support Requests</span>
            </DialogTitle>
            <DialogDescription>
              Worker welfare assistance submissions recorded this month.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-foreground">ID: WR-104 — Medical Reimbursement</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px]">Approved</Badge>
              </div>
              <span className="text-[11px] text-muted-foreground block">Submitted by Ramesh Patel • 5h ago</span>
            </div>
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-foreground">ID: WR-103 — Tool Insurance Claim</span>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px]">Under Review</Badge>
              </div>
              <span className="text-[11px] text-muted-foreground block">Submitted by Amit Shah • 1d ago</span>
            </div>
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-foreground">ID: WR-102 — Educational Allowance</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px]">Approved</Badge>
              </div>
              <span className="text-[11px] text-muted-foreground block">Submitted by Priya Solanki • 2d ago</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. Modal: Workers Needing Assistance */}
      <Dialog open={activeModal === "needing-assistance"} onClose={() => setActiveModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>Workers Needing Assistance (18 Workers)</span>
            </DialogTitle>
            <DialogDescription>
              Roster of cooperative members requiring welfare scheme onboarding or certificate renewals.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-xs max-h-[50vh] overflow-y-auto">
            <p className="text-[11px] text-muted-foreground pb-1">
              18 workers (13% of total workforce) currently require scheme renewal, insurance proof, or trade re-certification.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setActiveModal(null);
                router.push("/federation-admin/worker-information");
              }}
              className="w-full text-xs"
            >
              Open Worker Roster →
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
