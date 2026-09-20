"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gift,
  ShieldCheck,
  Wallet,
  GraduationCap,
  Landmark,
  BookOpen,
  Award,
  Info,
  Bell,
  FileText,
  AlertTriangle,
  MessageSquare,
  Headphones,
  ArrowRight,
  ChevronRight,
  Search,
  X,
  CheckCircle2,
  Clock,
  PhoneCall,
  ExternalLink,
  ShieldAlert,
  Upload,
  HeartHandshake,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type {
  WelfareScheme,
  SchemeCategory,
  WelfareRequestItem,
  TrainingOpportunity,
  WelfareCertificationItem,
} from "../types";
import { WELFARE_SCHEMES_DATA } from "../data/welfare-schemes";
import { INITIAL_WELFARE_REQUESTS } from "../data/welfare-requests";
import { TRAINING_OPPORTUNITIES_DATA } from "../data/training-opportunities";
import { WORKER_CERTIFICATIONS_DATA } from "../data/certifications";
import { SAFETY_GUIDELINES_DATA } from "../data/safety-guidelines";
import { INSURANCE_PROGRAMS_DATA } from "../data/insurance-protection";
import { FINANCIAL_ASSISTANCE_DATA } from "../data/financial-assistance";

export function WelfareSupportView() {
  const router = useRouter();

  // State management
  const [requestsList, setRequestsList] = React.useState<WelfareRequestItem[]>(INITIAL_WELFARE_REQUESTS);
  const [activeModal, setActiveModal] = React.useState<
    | null
    | "SCHEMES"
    | "CERTIFICATIONS"
    | "TRAINING"
    | "GOV_GUIDANCE"
    | "INSURANCE"
    | "FINANCIAL"
    | "EMERGENCY"
    | "GUIDELINES"
    | "REPORT_UNSAFE"
    | "CONTACT_SUPPORT"
  >(null);

  // Modal sub-states
  const [selectedScheme, setSelectedScheme] = React.useState<WelfareScheme | null>(null);
  const [selectedRequest, setSelectedRequest] = React.useState<WelfareRequestItem | null>(null);
  const [schemeSearch, setSchemeSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<SchemeCategory>("ALL");

  // Form states
  const [reportForm, setReportForm] = React.useState({
    location: "",
    issueType: "Structural Hazard",
    urgency: "High",
    description: "",
  });
  const [reportSubmitted, setReportSubmitted] = React.useState(false);

  const [supportForm, setSupportForm] = React.useState({
    category: "Welfare Schemes",
    message: "",
  });
  const [supportSubmitted, setSupportSubmitted] = React.useState(false);

  // Keyboard accessibility (Escape key closes modals)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedScheme) {
          setSelectedScheme(null);
        } else if (selectedRequest) {
          setSelectedRequest(null);
        } else {
          setActiveModal(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedScheme, selectedRequest]);

  // Filter schemes
  const filteredSchemes = React.useMemo(() => {
    return WELFARE_SCHEMES_DATA.filter((scheme) => {
      const matchesCategory = selectedCategory === "ALL" || scheme.category === selectedCategory;
      const matchesSearch =
        scheme.name.toLowerCase().includes(schemeSearch.toLowerCase()) ||
        scheme.description.toLowerCase().includes(schemeSearch.toLowerCase()) ||
        scheme.category.toLowerCase().includes(schemeSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, schemeSearch]);

  // Handle Unsafe Condition Report Submission
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.description.trim()) return;

    const newRequest: WelfareRequestItem = {
      id: `req-${Date.now()}`,
      referenceId: `KS-SAF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      requestType: "Unsafe Condition Report",
      date: "19 Sep 2026",
      status: "Under Review",
      description: `[${reportForm.issueType}] ${reportForm.description} - Location: ${reportForm.location || "On-Site Customer Address"}`,
      timelineStep: "Received & Assigned to District Safety Desk",
      nextStep: "Conciliation officer site audit scheduled within 24 hours.",
    };

    setRequestsList([newRequest, ...requestsList]);
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setActiveModal(null);
      setReportForm({ location: "", issueType: "Structural Hazard", urgency: "High", description: "" });
    }, 1800);
  };

  // Handle Contact Support Submission
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.message.trim()) return;

    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportSubmitted(false);
      setActiveModal(null);
      setSupportForm({ category: "Welfare Schemes", message: "" });
    }, 1800);
  };

  return (
    <div className="space-y-8 w-full max-w-[1500px] mx-auto pb-16 px-4 sm:px-6">
      {/* ========================================================================= */}
      {/* PAGE HEADER                                                               */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 uppercase">
          WELFARE & SUPPORT
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Support for a Secure and Brighter Tomorrow
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Explore government and cooperative welfare programs, training opportunities, protection schemes and support services — all in one place.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* TOP SUMMARY CARDS (4 Columns)                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
        {/* CARD 1: Welfare Schemes */}
        <Card
          onClick={() => setActiveModal("SCHEMES")}
          className="p-5 border shadow-xs hover:border-emerald-500/50 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-sm font-bold text-foreground">Welfare Schemes</h3>
            <div className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              6 Opportunities
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              Explore government and cooperative welfare programs.
            </p>
          </div>
        </Card>

        {/* CARD 2: Insurance & Protection */}
        <Card
          onClick={() => setActiveModal("INSURANCE")}
          className="p-5 border shadow-xs hover:border-emerald-500/50 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-blue-100/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-sm font-bold text-foreground">Insurance & Protection</h3>
            <div className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              Active Programs
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              View worker insurance and protection schemes.
            </p>
          </div>
        </Card>

        {/* CARD 3: Financial Assistance */}
        <Card
          onClick={() => setActiveModal("FINANCIAL")}
          className="p-5 border shadow-xs hover:border-emerald-500/50 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-sm font-bold text-foreground">Financial Assistance</h3>
            <div className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              Available Support
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              Explore eligible financial assistance programs.
            </p>
          </div>
        </Card>

        {/* CARD 4: Training Opportunities */}
        <Card
          onClick={() => setActiveModal("TRAINING")}
          className="p-5 border shadow-xs hover:border-emerald-500/50 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-purple-100/70 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-sm font-bold text-foreground">Training Opportunities</h3>
            <div className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              3 Available
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              Find relevant skill-development and training programs.
            </p>
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* MIDDLE SECTION: TWO LARGE CARDS (GOV & SAFETY)                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-stretch">
        {/* LEFT BOX: Government & Cooperative Opportunities */}
        <Card className="border shadow-xs p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Government & Cooperative Opportunities
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal("SCHEMES")}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 2x2 Inner Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Welfare Scheme Discovery */}
              <div className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-blue-100/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 w-fit">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    Welfare Scheme Discovery
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Explore government welfare schemes based on your occupation and eligibility.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal("SCHEMES")}
                  className="text-xs h-8 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 w-fit"
                >
                  Explore Schemes <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {/* Card 2: Certification Support */}
              <div className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-amber-100/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 w-fit">
                    <Award className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    Certification Support
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    View certifications relevant to your occupation and cooperative work.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal("CERTIFICATIONS")}
                  className="text-xs h-8 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 w-fit"
                >
                  View Certifications <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {/* Card 3: Training & Skill Development */}
              <div className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 w-fit">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    Training & Skill Development
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Discover skill training programs offered by cooperatives and government initiatives.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal("TRAINING")}
                  className="text-xs h-8 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 w-fit"
                >
                  Explore Training <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {/* Card 4: Government Services Guidance */}
              <div className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-blue-100/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 w-fit">
                    <Info className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    Government Services Guidance
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Get information about various government services, benefits and support channels.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal("GOV_GUIDANCE")}
                  className="text-xs h-8 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 w-fit"
                >
                  View Guidance <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* RIGHT BOX: Worker Safety & Emergency Support */}
        <Card className="border shadow-xs p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-1">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Worker Safety & Emergency Support
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Access safety resources, emergency support and worker protection information.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal("GUIDELINES")}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 shrink-0 self-start sm:self-center cursor-pointer"
              >
                Learn More <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 2x2 Inner Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Emergency Support */}
              <div className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-rose-100/70 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 w-fit">
                    <Bell className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    Emergency Support
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Get immediate help in case of accidents or emergency.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal("EMERGENCY")}
                  className="text-xs h-8 text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 w-fit"
                >
                  Get Help <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {/* Card 2: Safety Guidelines */}
              <div className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 w-fit">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    Safety Guidelines
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Learn about workplace safety practices and precautions.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal("GUIDELINES")}
                  className="text-xs h-8 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 w-fit"
                >
                  View Guidelines <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {/* Card 3: Report Unsafe Conditions */}
              <div className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-rose-100/70 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 w-fit">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    Report Unsafe Conditions
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Report unsafe working conditions at customer locations.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModal("REPORT_UNSAFE")}
                  className="text-xs h-8 text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 w-fit"
                >
                  Raise Report <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {/* Card 4: Safety Complaint */}
              <div className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-purple-100/70 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 w-fit">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    Safety Complaint
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Raise a safety-related complaint or concern.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/worker/grievances")}
                  className="text-xs h-8 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 w-fit"
                >
                  Go to Grievances <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: REQUESTS TABLE & NEED HELP                                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch">
        {/* LEFT 2 COLUMNS: My Welfare / Support Requests */}
        <Card className="lg:col-span-2 border shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  My Welfare / Support Requests
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal("SCHEMES")}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Requests Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Request Type</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {requestsList.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground">
                        {req.requestType}
                        <div className="text-[10px] text-muted-foreground font-normal font-mono">
                          {req.referenceId}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{req.date}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold py-0.5 px-2 ${req.status === "Under Review"
                              ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                              : req.status === "Information Provided"
                                ? "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300"
                                : req.status === "In Progress"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300"
                            }`}
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center text-xs cursor-pointer"
                        >
                          View <ArrowRight className="h-3 w-3 ml-0.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* RIGHT 1 COLUMN: Need Help? */}
        <Card className="border shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-3">
              <Headphones className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">Need Help?</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get the support you need to navigate welfare schemes, training opportunities, certification requirements, financial assistance, and workplace safety resources. Explore relevant programs, understand eligibility and application requirements, access learning and certification guidance, and find information about worker protection and emergency support. Whether you need help discovering a suitable welfare program, improving your professional skills, renewing a certification, reporting unsafe working conditions, or understanding available assistance, KaushalyaSetu provides clear guidance and connects you with the appropriate support channels. Information is provided for guidance, while final eligibility, approval, and benefits are determined by the respective government, cooperative, or authorized program administrator.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={() => setActiveModal("CONTACT_SUPPORT")}
              className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white h-10 shadow-xs"
            >
              Contact Support <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/worker/guidance")}
              className="w-full text-xs font-semibold h-10 border-border/80"
            >
              View Help & Guidance <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: WELFARE SCHEMES DISCOVERY (6 DUMMY SCHEMES)                      */}
      {/* ========================================================================= */}
      {activeModal === "SCHEMES" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-background border rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4 gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Gift className="h-5 w-5 text-emerald-600" />
                  Welfare Schemes
                </h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Explore programs that may be relevant to workers. Eligibility and approval are determined by the respective authority.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setSelectedScheme(null);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* If a scheme is selected -> Scheme Detail View */}
            {selectedScheme ? (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setSelectedScheme(null)}
                  className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Back to All Schemes
                </button>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase mb-1">
                        {selectedScheme.category}
                      </Badge>
                      <h3 className="text-lg font-bold text-foreground">{selectedScheme.name}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-300">
                      Informational / Guidance Data
                    </Badge>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <div>
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                        Description
                      </h4>
                      <p className="mt-1 text-foreground leading-relaxed">{selectedScheme.description}</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                        Eligibility
                      </h4>
                      <p className="mt-1 text-foreground">{selectedScheme.eligibility}</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                        Required Documents
                      </h4>
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-muted-foreground">
                        {selectedScheme.requiredDocuments.map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                        How to Proceed
                      </h4>
                      <ol className="list-decimal pl-4 mt-1 space-y-1 text-muted-foreground">
                        {selectedScheme.howToProceed.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Source: {selectedScheme.informationSource}</span>
                    </div>

                    {/* Official Product Disclaimer */}
                    <div className="p-3 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed space-y-1">
                      <strong>Important Disclaimer:</strong> Information shown is for guidance only. Eligibility, availability and approval are determined exclusively by the respective government authority, cooperative or program administrator. KaushalyaSetu does not directly issue government benefits.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Scheme List View with Filter & Search */
              <div className="space-y-5">
                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={schemeSearch}
                      onChange={(e) => setSchemeSearch(e.target.value)}
                      placeholder="Search schemes..."
                      className="pl-9 h-9 text-xs"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    {(
                      [
                        "ALL",
                        "Worker Protection",
                        "Health & Welfare",
                        "Training",
                        "Housing",
                        "Financial Support",
                        "Social Security",
                      ] as SchemeCategory[]
                    ).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${selectedCategory === cat
                            ? "bg-emerald-600 text-white"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6 Dummy Schemes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredSchemes.map((scheme) => (
                    <div
                      key={scheme.id}
                      className="p-4 rounded-xl border bg-card hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase">
                            {scheme.category}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Information / Guidance
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                          {scheme.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {scheme.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground italic">
                          Eligibility: {scheme.eligibility}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedScheme(scheme)}
                        className="text-xs h-8 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-50 w-full"
                      >
                        View Details →
                      </Button>
                    </div>
                  ))}
                </div>

                {filteredSchemes.length === 0 && (
                  <div className="text-center py-12 text-xs text-muted-foreground">
                    No welfare schemes match your search or filter criteria.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CERTIFICATION SUPPORT                                            */}
      {/* ========================================================================= */}
      {activeModal === "CERTIFICATIONS" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-foreground">Certification Support</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              View verified trade certifications relevant to your occupation. Keep certifications current to ensure priority dispatch and customer trust.
            </p>

            <div className="space-y-3">
              {WORKER_CERTIFICATIONS_DATA.map((cert) => (
                <div key={cert.id} className="p-4 rounded-xl border bg-card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{cert.title}</h4>
                      <p className="text-[11px] text-muted-foreground">Issued by {cert.issuingAuthority}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        cert.status === "Active"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }
                    >
                      {cert.status}
                    </Badge>
                  </div>
                  {cert.renewalNotice && (
                    <div className="p-2.5 rounded-lg bg-amber-50 text-[11px] text-amber-900 border border-amber-200 leading-relaxed">
                      💡 {cert.renewalNotice}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setActiveModal(null)} className="text-xs bg-emerald-600 text-white">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TRAINING & SKILL DEVELOPMENT                                     */}
      {/* ========================================================================= */}
      {activeModal === "TRAINING" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-xl w-full max-w-3xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-foreground">Training & Skill Development Opportunities</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {TRAINING_OPPORTUNITIES_DATA.map((train) => (
                <div key={train.id} className="p-4 rounded-xl border bg-card space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[9px] uppercase font-bold">
                          {train.category}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          {train.duration} • {train.mode}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground mt-1">{train.title}</h4>
                    </div>
                    {train.enrolledStatus ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300">
                        ✓ Enrolled
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          alert(`Enrolled in ${train.title}! Progress added to KaushalGrow dashboard.`);
                          setActiveModal(null);
                        }}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-7"
                      >
                        Enroll Now
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{train.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: GOVERNMENT SERVICES GUIDANCE                                     */}
      {/* ========================================================================= */}
      {activeModal === "GOV_GUIDANCE" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-foreground">Government Services Guidance</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200 leading-relaxed">
              <strong>Notice:</strong> KaushalyaSetu is an independent digital service platform. We provide informational discovery and guidance for government initiatives. Official registrations take place on respective statutory portals.
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl border bg-card space-y-1">
                <h4 className="font-bold text-foreground text-sm">e-Shram Portal Discovery & Awareness</h4>
                <p className="text-muted-foreground">
                  e-Shram is a national database created by the Ministry of Labour & Employment for unorganized workers. Workers can register independently on the official government portal to obtain a 12-digit Universal Account Number (UAN).
                </p>
              </div>

              <div className="p-3.5 rounded-xl border bg-card space-y-1">
                <h4 className="font-bold text-foreground text-sm">BOCW Construction Worker Welfare Board</h4>
                <p className="text-muted-foreground">
                  Building and Other Construction Workers (BOCW) welfare boards offer state-specific assistance for maternity, disability, and children&apos;s education.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setActiveModal(null)} className="text-xs bg-emerald-600 text-white">
                Close Guidance
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: INSURANCE & PROTECTION                                           */}
      {/* ========================================================================= */}
      {activeModal === "INSURANCE" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-foreground">Insurance & Protection Programs</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {INSURANCE_PROGRAMS_DATA.map((ins) => (
                <div key={ins.id} className="p-4 rounded-xl border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">{ins.title}</h4>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300">
                      Coverage: {ins.coverageAmount}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ins.description}</p>
                  <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5 pt-1">
                    {ins.benefits.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: FINANCIAL ASSISTANCE                                             */}
      {/* ========================================================================= */}
      {activeModal === "FINANCIAL" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-foreground">Eligible Financial Assistance</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {FINANCIAL_ASSISTANCE_DATA.map((fin) => (
                <div key={fin.id} className="p-4 rounded-xl border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">{fin.title}</h4>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300">
                      Up to {fin.maxAmount}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{fin.description}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold">{fin.interestRate}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: EMERGENCY SUPPORT                                                */}
      {/* ========================================================================= */}
      {activeModal === "EMERGENCY" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto w-fit">
              <Bell className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Worker Emergency Assistance</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                If you are experiencing an immediate safety threat or medical emergency on a job site:
              </p>
            </div>

            <div className="space-y-2 text-left text-xs">
              <div className="p-3 rounded-xl border bg-rose-50/50 dark:bg-rose-950/20 space-y-1">
                <span className="font-bold text-rose-800 dark:text-rose-300">Cooperative Emergency Support Helpline</span>
                <div className="text-sm font-extrabold text-rose-700">1800-419-KS-HELP (24x7)</div>
              </div>

              <div className="p-3 rounded-xl border bg-muted/40 space-y-1">
                <span className="font-semibold text-foreground">National Emergency Contacts (Placeholder)</span>
                <div className="text-muted-foreground">Police: 100 • Ambulance: 108 • Disaster Helpline: 112</div>
              </div>
            </div>

            <Button
              onClick={() => {
                alert("Cooperative emergency desk notified. A representative will call your registered number immediately.");
                setActiveModal(null);
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-10"
            >
              <PhoneCall className="h-4 w-4 mr-2" /> Trigger Emergency Alert
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: SAFETY GUIDELINES                                                */}
      {/* ========================================================================= */}
      {activeModal === "GUIDELINES" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-foreground">Workplace Safety Guidelines</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {SAFETY_GUIDELINES_DATA.map((sg) => (
                <div key={sg.id} className="p-4 rounded-xl border bg-card space-y-2">
                  <Badge variant="secondary" className="text-[9px] uppercase font-bold">
                    {sg.category}
                  </Badge>
                  <h4 className="text-xs font-bold text-foreground">{sg.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{sg.summary}</p>
                  <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1 pt-1">
                    {sg.keyInstructions.map((inst, idx) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: REPORT UNSAFE CONDITIONS FORM                                    */}
      {/* ========================================================================= */}
      {activeModal === "REPORT_UNSAFE" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h2 className="text-lg font-bold text-foreground">Report Unsafe Working Conditions</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 w-fit mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Report Submitted Successfully</h3>
                <p className="text-xs text-muted-foreground">
                  Your safety report has been logged and forwarded to the regional cooperative conciliation desk.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-foreground block mb-1">Work Location / Site Address</label>
                  <Input
                    value={reportForm.location}
                    onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                    placeholder="e.g., Customer premise at Sector 4, Gandhinagar"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-foreground block mb-1">Hazard / Issue Type</label>
                    <select
                      value={reportForm.issueType}
                      onChange={(e) => setReportForm({ ...reportForm, issueType: e.target.value })}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="Structural Hazard">Structural Hazard</option>
                      <option value="Electrical Risk">Electrical Risk</option>
                      <option value="Hazardous Materials">Hazardous Materials</option>
                      <option value="Hostile Customer Conduct">Hostile Customer Conduct</option>
                      <option value="Sanitation / Biohazard">Sanitation / Biohazard</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-foreground block mb-1">Urgency</label>
                    <select
                      value={reportForm.urgency}
                      onChange={(e) => setReportForm({ ...reportForm, urgency: e.target.value })}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="Urgent / Emergency">Urgent / Emergency</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Detailed Description</label>
                  <textarea
                    rows={3}
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    placeholder="Describe the unsafe condition, exposed wiring, gas leak, or safety violation..."
                    className="w-full p-2.5 rounded-md border border-input bg-background text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Optional Photo Evidence Placeholder</label>
                  <div className="border border-dashed rounded-lg p-3 text-center text-muted-foreground hover:bg-muted/30 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <span>Click to attach photo or site documentation</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveModal(null)} className="text-xs h-9">
                    Cancel
                  </Button>
                  <Button type="submit" className="text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white">
                    Submit Safety Report
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 10: REQUEST DETAILS VIEW                                            */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <Badge variant="outline" className="text-[10px] font-mono mb-1">
                  {selectedRequest.referenceId}
                </Badge>
                <h2 className="text-base font-bold text-foreground">{selectedRequest.requestType}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Submission Date:</span>
                <span className="font-semibold text-foreground">{selectedRequest.date}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Status:</span>
                <Badge variant="secondary" className="font-semibold text-[10px]">
                  {selectedRequest.status}
                </Badge>
              </div>

              <div>
                <h4 className="font-bold text-foreground uppercase text-[10px] text-muted-foreground tracking-wider mb-1">
                  Request Description
                </h4>
                <p className="p-3 rounded-xl bg-muted/40 text-foreground">{selectedRequest.description}</p>
              </div>

              {selectedRequest.timelineStep && (
                <div>
                  <h4 className="font-bold text-foreground uppercase text-[10px] text-muted-foreground tracking-wider mb-1">
                    Timeline Progress
                  </h4>
                  <p className="text-emerald-700 dark:text-emerald-400 font-semibold">{selectedRequest.timelineStep}</p>
                </div>
              )}

              {selectedRequest.nextStep && (
                <div>
                  <h4 className="font-bold text-foreground uppercase text-[10px] text-muted-foreground tracking-wider mb-1">
                    Next Recommended Action
                  </h4>
                  <p className="text-muted-foreground">{selectedRequest.nextStep}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setSelectedRequest(null)} className="text-xs bg-emerald-600 text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 11: CONTACT SUPPORT FORM                                            */}
      {/* ========================================================================= */}
      {activeModal === "CONTACT_SUPPORT" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-foreground">Contact Welfare Support Desk</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {supportSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 w-fit mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Message Dispatched</h3>
                <p className="text-xs text-muted-foreground">
                  Our cooperative support team will contact you within 4 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-foreground block mb-1">Support Category</label>
                  <select
                    value={supportForm.category}
                    onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="Welfare Schemes">Welfare Schemes Inquiry</option>
                    <option value="Training & Certifications">Training & Skill Certifications</option>
                    <option value="Insurance Claim">Insurance Claim Assistance</option>
                    <option value="Financial Support">Financial Micro-Credit Support</option>
                    <option value="Other">General Support Query</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Your Message / Request</label>
                  <textarea
                    rows={4}
                    value={supportForm.message}
                    onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                    placeholder="Describe how we can assist you..."
                    className="w-full p-2.5 rounded-md border border-input bg-background text-xs"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveModal(null)} className="text-xs h-9">
                    Cancel
                  </Button>
                  <Button type="submit" className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                    Send Message
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
