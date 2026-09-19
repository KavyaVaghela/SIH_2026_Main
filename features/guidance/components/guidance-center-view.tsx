"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  BookOpen,
  HelpCircle,
  Wrench,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CreditCard,
  Wallet,
  ShieldAlert,
  User,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { guidanceService } from "../services/guidance-service";
import { VisualJourneyMap } from "./visual-journey-map";
import { OnboardingChecklistCard } from "./onboarding-checklist-card";
import { TroubleshootingAccordion } from "./troubleshooting-accordion";
import { StatusExplainerModal } from "./status-explainer-modal";
import type { PlatformRole } from "@/config/navigation";
import type { GuidanceArticle, SearchGuidanceResult, StatusExplainerItem } from "../types";

export interface GuidanceCenterViewProps {
  role: PlatformRole;
  userName?: string;
}

function GuidanceCenterViewContent({ role, userName }: GuidanceCenterViewProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [activeTab, setActiveTab] = React.useState<"ALL" | "HOW_TO" | "STATUS" | "FAQ" | "TROUBLE">("ALL");
  const [selectedStatusCode, setSelectedStatusCode] = React.useState<string | null>(null);

  // Synchronize search params if query changes in URL
  React.useEffect(() => {
    if (initialQuery && initialQuery !== searchQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  // Execute role-aware search query
  const searchResults: SearchGuidanceResult = React.useMemo(() => {
    return guidanceService.searchGuidance(role, searchQuery);
  }, [role, searchQuery]);

  // Role-specific quick actions
  const quickActions = React.useMemo(() => {
    if (role === "CUSTOMER") {
      return [
        { label: "Book a Worker", href: "/customer/find-worker", icon: <Calendar className="h-4 w-4 text-emerald-600" /> },
        { label: "My Bookings", href: "/customer/bookings", icon: <Compass className="h-4 w-4 text-emerald-600" /> },
        { label: "Payments & Bills", href: "/customer/payments", icon: <CreditCard className="h-4 w-4 text-emerald-600" /> },
        { label: "Grievances", href: "/customer/complaints", icon: <ShieldAlert className="h-4 w-4 text-emerald-600" /> },
        { label: "Household Profile", href: "/customer/profile", icon: <User className="h-4 w-4 text-emerald-600" /> },
      ];
    }
    if (role === "WORKER") {
      return [
        { label: "Schedule & Jobs", href: "/worker/schedule", icon: <Calendar className="h-4 w-4 text-emerald-600" /> },
        { label: "Wallet & Earnings", href: "/worker/earnings", icon: <Wallet className="h-4 w-4 text-emerald-600" /> },
        { label: "Welfare & Certs", href: "/worker/welfare", icon: <ShieldCheck className="h-4 w-4 text-emerald-600" /> },
        { label: "My Grievances", href: "/worker/grievances", icon: <ShieldAlert className="h-4 w-4 text-emerald-600" /> },
        { label: "Worker Profile", href: "/worker/profile", icon: <User className="h-4 w-4 text-emerald-600" /> },
      ];
    }
    if (role === "FEDERATION_ADMIN") {
      return [
        { label: "Workforce", href: "/federation-admin/workforce-management", icon: <User className="h-4 w-4 text-emerald-600" /> },
        { label: "Complaints", href: "/federation-admin/complaint-management", icon: <ShieldAlert className="h-4 w-4 text-emerald-600" /> },
        { label: "Federation Info", href: "/federation-admin/federation-information", icon: <ShieldCheck className="h-4 w-4 text-emerald-600" /> },
      ];
    }
    return [
      { label: "Complaints Queue", href: "/super-admin/complaints", icon: <ShieldAlert className="h-4 w-4 text-emerald-600" /> },
      { label: "Cooperative Societies", href: "/super-admin/societies", icon: <ShieldCheck className="h-4 w-4 text-emerald-600" /> },
      { label: "Demand Intelligence", href: "/super-admin/demand", icon: <Compass className="h-4 w-4 text-emerald-600" /> },
    ];
  }, [role]);

  const [categoryFilter, setCategoryFilter] = React.useState<
    "ALL" | "HOW_TO" | "STATUS" | "FAQ" | "TROUBLE" | "JOURNEY"
  >("ALL");

  return (
    <div className="space-y-8 w-full pb-16">
      {/* 1. Header & Intro */}
      <PageHeader
        title="KaushalyaSetu Guidance Center"
        description={`Contextual instructions, visual journey maps, status explainers, and troubleshooting tailored for ${
          userName ? `${userName} (${role.replace(/_/g, " ")})` : role.replace(/_/g, " ")
        }.`}
      />

      {/* 2. Hero Search Bar — Full Desktop Width */}
      <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-900/10 via-emerald-600/5 to-transparent p-6 sm:p-8 space-y-4 w-full">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Smart Guidance & In-Product Help
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            What do you need help with today?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Search answers on estimates, payments, OTP verification, grievance filing, and booking workflows.
          </p>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              role === "CUSTOMER"
                ? "Search e.g. payment, estimate, OTP, bill, grievance, smartserve..."
                : role === "WORKER"
                ? "Search e.g. payment, estimate, OTP, bill, grievance, kaushalgrow..."
                : "Search e.g. payment, estimate, OTP, bill, grievance..."
            }
            className="pl-10 h-10 text-sm bg-background border-border/80 focus-visible:ring-emerald-600 w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground bg-muted px-1.5 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Popular:</span>
          {(role === "CUSTOMER"
            ? ["payment", "estimate", "OTP", "bill", "grievance", "smartserve"]
            : role === "WORKER"
            ? ["payment", "estimate", "OTP", "bill", "grievance", "kaushalgrow"]
            : ["payment", "estimate", "OTP", "bill", "grievance"]
          ).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchQuery(tag)}
              className="px-2.5 py-0.5 rounded-full text-xs bg-card hover:bg-muted border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </Card>

      {/* 3. Quick Action Shortcuts */}
      {role !== "CUSTOMER" && role !== "WORKER" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full">
          {quickActions.map((qa) => (
            <Link
              key={qa.label}
              href={qa.href}
              className="flex items-center gap-2.5 p-3 rounded-xl border bg-card hover:bg-muted/40 hover:border-emerald-500/40 transition-all text-xs font-semibold text-foreground group"
            >
              <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 group-hover:bg-emerald-100 transition-colors shrink-0">
                {qa.icon}
              </div>
              <span className="truncate">{qa.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* 4. Onboarding Checklist (Collapsible) */}
      {role !== "CUSTOMER" && role !== "WORKER" && <OnboardingChecklistCard role={role} />}

      {/* 5. Desktop Category / Filter Tabs Bar */}
      {!searchQuery.trim() && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3 w-full">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Guidance Views
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={categoryFilter === "ALL" ? "default" : "outline"}
              onClick={() => setCategoryFilter("ALL")}
              className="text-xs h-8"
            >
              All Guidance
            </Button>
            <Button
              size="sm"
              variant={categoryFilter === "HOW_TO" ? "default" : "outline"}
              onClick={() => setCategoryFilter("HOW_TO")}
              className="text-xs h-8"
            >
              How-To ({searchResults.howTo.length})
            </Button>
            <Button
              size="sm"
              variant={categoryFilter === "STATUS" ? "default" : "outline"}
              onClick={() => setCategoryFilter("STATUS")}
              className="text-xs h-8"
            >
              Statuses ({searchResults.statusExplanations.length})
            </Button>
            <Button
              size="sm"
              variant={categoryFilter === "FAQ" ? "default" : "outline"}
              onClick={() => setCategoryFilter("FAQ")}
              className="text-xs h-8"
            >
              Questions ({searchResults.commonQuestions.length})
            </Button>
            <Button
              size="sm"
              variant={categoryFilter === "TROUBLE" ? "default" : "outline"}
              onClick={() => setCategoryFilter("TROUBLE")}
              className="text-xs h-8"
            >
              Troubleshooting ({searchResults.troubleshooting.length})
            </Button>
            <Button
              size="sm"
              variant={categoryFilter === "JOURNEY" ? "default" : "outline"}
              onClick={() => setCategoryFilter("JOURNEY")}
              className="text-xs h-8"
            >
              Journey Map
            </Button>
          </div>
        </div>
      )}

      {/* 6. Active Search Results OR Categorized Desktop Layout */}
      {searchQuery.trim() ? (
        <div className="space-y-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Search Results for &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-xs text-muted-foreground">
                Found {searchResults.totalMatches} relevant guides for your role ({role.replace(/_/g, " ")})
              </p>
            </div>

            {/* Result Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={activeTab === "ALL" ? "default" : "outline"}
                onClick={() => setActiveTab("ALL")}
                className="text-xs h-7"
              >
                All ({searchResults.totalMatches})
              </Button>
              <Button
                size="sm"
                variant={activeTab === "HOW_TO" ? "default" : "outline"}
                onClick={() => setActiveTab("HOW_TO")}
                className="text-xs h-7"
              >
                How-To ({searchResults.howTo.length})
              </Button>
              <Button
                size="sm"
                variant={activeTab === "STATUS" ? "default" : "outline"}
                onClick={() => setActiveTab("STATUS")}
                className="text-xs h-7"
              >
                Statuses ({searchResults.statusExplanations.length})
              </Button>
              <Button
                size="sm"
                variant={activeTab === "FAQ" ? "default" : "outline"}
                onClick={() => setActiveTab("FAQ")}
                className="text-xs h-7"
              >
                FAQ ({searchResults.commonQuestions.length})
              </Button>
              <Button
                size="sm"
                variant={activeTab === "TROUBLE" ? "default" : "outline"}
                onClick={() => setActiveTab("TROUBLE")}
                className="text-xs h-7"
              >
                Troubleshooting ({searchResults.troubleshooting.length})
              </Button>
            </div>
          </div>

          {/* 6a. How-To Section */}
          {(activeTab === "ALL" || activeTab === "HOW_TO") && searchResults.howTo.length > 0 && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                  How-To Guides ({searchResults.howTo.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                {searchResults.howTo.map((art) => (
                  <ArticlePreviewCard key={art.id} article={art} />
                ))}
              </div>
            </div>
          )}

          {/* 6b. Status Explanations */}
          {(activeTab === "ALL" || activeTab === "STATUS") && searchResults.statusExplanations.length > 0 && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-emerald-600" />
                  Status Explanations ({searchResults.statusExplanations.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {searchResults.statusExplanations.map((item) => (
                  <button
                    key={item.statusCode}
                    type="button"
                    onClick={() => setSelectedStatusCode(item.statusCode)}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/40 hover:border-emerald-500/40 text-left transition-all cursor-pointer space-y-2 block w-full h-full"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-foreground leading-snug">{item.displayTitle}</span>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">{item.statusCode}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.meaning}
                    </p>
                    <div className="pt-2 border-t border-border/40 text-[11px] flex items-center justify-between">
                      <span className="text-muted-foreground">Action:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        {item.whoActsNext} →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6c. Common Questions Section */}
          {(activeTab === "ALL" || activeTab === "FAQ") && searchResults.commonQuestions.length > 0 && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                  Common Questions ({searchResults.commonQuestions.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                {searchResults.commonQuestions.map((art) => (
                  <ArticlePreviewCard key={art.id} article={art} />
                ))}
              </div>
            </div>
          )}

          {/* 6d. Troubleshooting Section */}
          {(activeTab === "ALL" || activeTab === "TROUBLE") && searchResults.troubleshooting.length > 0 && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-emerald-600" />
                  Troubleshooting & Diagnostics ({searchResults.troubleshooting.length})
                </h4>
              </div>
              <TroubleshootingAccordion items={searchResults.troubleshooting} />
            </div>
          )}

          {/* Zero Search Results Fallback */}
          {searchResults.totalMatches === 0 && (
            <Card className="p-8 text-center border-dashed space-y-2 w-full">
              <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto" />
              <h4 className="text-sm font-bold text-foreground">No matching guidance articles found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                We couldn&apos;t find guides matching &ldquo;{searchQuery}&rdquo; for your role. Try searching with broader keywords like &ldquo;booking&rdquo;, &ldquo;payment&rdquo;, or &ldquo;estimate&rdquo;.
              </p>
              <Button size="sm" variant="outline" onClick={() => setSearchQuery("")} className="text-xs mt-2">
                View All Guides
              </Button>
            </Card>
          )}
        </div>
      ) : (
        /* Categorized Desktop-First View Spanning Full Content Area */
        <div className="space-y-10 w-full">
          {/* VIEW: ALL GUIDANCE (FULL-WIDTH 3-COLUMN DESKTOP ARCHITECTURE) */}
          {categoryFilter === "ALL" && (
            <>
              {/* SECTION 1: HOW-TO & ACTION GUIDES */}
              {searchResults.howTo.length > 0 && (
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-600" />
                      How-To & Action Guides
                    </h3>
                    <Badge variant="outline" className="text-xs text-emerald-700 dark:text-emerald-400">
                      {searchResults.howTo.length} Guides
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                    {searchResults.howTo.map((art) => (
                      <ArticlePreviewCard key={art.id} article={art} />
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 2: STATUS & LIFECYCLE MEANINGS */}
              {searchResults.statusExplanations.length > 0 && (
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Compass className="h-4 w-4 text-emerald-600" />
                      Status & Lifecycle Meanings
                    </h3>
                    <Badge variant="outline" className="text-xs text-emerald-700 dark:text-emerald-400">
                      {searchResults.statusExplanations.length} Statuses
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click any status card to view who acts next, expected resolution timeline, and recovery workflows:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {searchResults.statusExplanations.map((item) => (
                      <button
                        key={item.statusCode}
                        type="button"
                        onClick={() => setSelectedStatusCode(item.statusCode)}
                        className="p-4 rounded-xl border bg-card hover:bg-muted/40 hover:border-emerald-500/40 text-left transition-all cursor-pointer space-y-2 block w-full h-full"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-sm text-foreground leading-snug">{item.displayTitle}</span>
                          <Badge variant="outline" className="text-[10px] font-mono shrink-0">{item.statusCode}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.meaning}
                        </p>
                        <div className="pt-2 border-t border-border/40 text-[11px] flex items-center justify-between">
                          <span className="text-muted-foreground">Action:</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            {item.whoActsNext} →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: FREQUENTLY ASKED QUESTIONS */}
              {searchResults.commonQuestions.length > 0 && (
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-emerald-600" />
                      Frequently Asked Questions
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {searchResults.commonQuestions.length} Questions
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                    {searchResults.commonQuestions.map((art) => (
                      <ArticlePreviewCard key={art.id} article={art} />
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: TROUBLESHOOTING & DIAGNOSTIC RECOVERY */}
              {searchResults.troubleshooting.length > 0 && (
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-emerald-600" />
                      Troubleshooting & Diagnostic Recovery
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {searchResults.troubleshooting.length} Solutions
                    </Badge>
                  </div>
                  <TroubleshootingAccordion items={searchResults.troubleshooting} />
                </div>
              )}

              {/* SECTION 5: FULL WIDTH VISUAL JOURNEY ROADMAP */}
              <div className="space-y-4 w-full pt-4 border-t border-border/70">
                <VisualJourneyMap role={role} />
              </div>
            </>
          )}

          {/* VIEW: HOW_TO ONLY */}
          {categoryFilter === "HOW_TO" && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  All How-To & Action Guides for {role.replace(/_/g, " ")}
                </h3>
                <Badge variant="outline">{searchResults.howTo.length} Total</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                {searchResults.howTo.map((art) => (
                  <ArticlePreviewCard key={art.id} article={art} />
                ))}
              </div>
            </div>
          )}

          {/* VIEW: STATUS ONLY */}
          {categoryFilter === "STATUS" && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Compass className="h-4 w-4 text-emerald-600" />
                  Status Explanations & Workflow Lifecycle
                </h3>
                <Badge variant="outline">{searchResults.statusExplanations.length} Statuses</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {searchResults.statusExplanations.map((item) => (
                  <button
                    key={item.statusCode}
                    type="button"
                    onClick={() => setSelectedStatusCode(item.statusCode)}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/40 hover:border-emerald-500/40 text-left transition-all cursor-pointer space-y-2 block w-full h-full"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-foreground leading-snug">{item.displayTitle}</span>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">{item.statusCode}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.meaning}
                    </p>
                    <div className="pt-2 border-t border-border/40 text-[11px] flex items-center justify-between">
                      <span className="text-muted-foreground">Action:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        {item.whoActsNext} →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: FAQ ONLY */}
          {categoryFilter === "FAQ" && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-600" />
                  Frequently Asked Questions
                </h3>
                <Badge variant="outline">{searchResults.commonQuestions.length} Questions</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                {searchResults.commonQuestions.map((art) => (
                  <ArticlePreviewCard key={art.id} article={art} />
                ))}
              </div>
            </div>
          )}

          {/* VIEW: TROUBLE ONLY */}
          {categoryFilter === "TROUBLE" && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-emerald-600" />
                  Troubleshooting & Diagnostic Recovery
                </h3>
                <Badge variant="outline">{searchResults.troubleshooting.length} Guides</Badge>
              </div>
              <TroubleshootingAccordion items={searchResults.troubleshooting} />
            </div>
          )}

          {/* VIEW: JOURNEY ONLY */}
          {categoryFilter === "JOURNEY" && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Compass className="h-4 w-4 text-emerald-600" />
                  Interactive Process Journey Map
                </h3>
              </div>
              <VisualJourneyMap role={role} />
            </div>
          )}
        </div>
      )}

      {/* Status Explainer Modal (when clicked from search or grid) */}
      <StatusExplainerModal
        statusCode={selectedStatusCode}
        role={role}
        isOpen={Boolean(selectedStatusCode)}
        onClose={() => setSelectedStatusCode(null)}
      />
    </div>
  );
}

export function GuidanceCenterView(props: GuidanceCenterViewProps) {
  return (
    <React.Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading guidance center...</div>}>
      <GuidanceCenterViewContent {...props} />
    </React.Suspense>
  );
}

// Sub-component: Article Preview Card
function ArticlePreviewCard({ article }: { article: GuidanceArticle }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card className="border shadow-xs hover:border-emerald-500/40 transition-all p-4 space-y-3 flex flex-col justify-between h-full w-full">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="text-[10px] border-emerald-600/30 text-emerald-700 dark:text-emerald-400">
            {article.category.replace(/_/g, " ")}
          </Badge>
          <span className="text-[10px] text-muted-foreground uppercase font-mono">
            {article.type.replace(/_/g, " ")}
          </span>
        </div>

        <h4 className="text-sm font-bold text-foreground leading-snug break-words">
          {article.title}
        </h4>

        <p className="text-xs text-muted-foreground leading-relaxed break-words">
          {article.summary}
        </p>

        {expanded && (
          <div className="pt-2 border-t border-border/60 space-y-3 text-xs">
            <div className="text-foreground leading-relaxed whitespace-pre-line bg-muted/20 p-2.5 rounded-md">
              {article.content}
            </div>

            {article.steps && article.steps.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Detailed Steps ({article.steps.length}):
                </span>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {article.steps.map((st) => (
                    <div key={st.stepNumber} className="flex items-start gap-2 p-2 rounded border bg-card text-xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700 font-bold shrink-0 text-[10px]">
                        {st.stepNumber}
                      </span>
                      <div className="flex-1">
                        <strong className="text-foreground block">{st.title}</strong>
                        <span className="text-muted-foreground leading-normal">{st.description}</span>
                        {st.action && (
                          <div className="mt-1">
                            <Link href={st.action.href} className="text-[11px] text-emerald-600 hover:underline font-semibold inline-flex items-center">
                              {st.action.label} <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
        >
          {expanded ? "Show Less" : "Read Full Guide →"}
        </button>

        {article.relatedAction && (
          <Link href={article.relatedAction.href}>
            <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
              {article.relatedAction.label}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
