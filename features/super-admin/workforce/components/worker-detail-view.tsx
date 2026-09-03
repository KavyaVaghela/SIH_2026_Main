"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Wrench, Calendar, BarChart2, HeartHandshake, Award } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useWorkerDetail } from "../hooks/use-worker-detail";
import { WorkerOverviewTab } from "./worker-overview-tab";
import { WorkerSkillsTab } from "./worker-skills-tab";
import { WorkerBookingsTab } from "./worker-bookings-tab";
import { WorkerPerformanceTab } from "./worker-performance-tab";
import { WorkerWelfareTab } from "./worker-welfare-tab";

export function WorkerDetailView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const initialTab = searchParams?.get("tab") || "overview";

  const {
    worker,
    skills,
    certifications,
    bookings,
    performance,
    welfare,
    isLoading,
    error,
  } = useWorkerDetail(id);

  const handleTabChange = (tabId: string) => {
    router.replace(`/super-admin/workforce/${id}?tab=${tabId}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-80" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
          <User className="h-6 w-6 text-rose-600" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Worker Profile Not Found</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {error || "The requested worker record could not be found or has been removed."}
        </p>
        <Link
          href="/super-admin/workforce"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Workforce Directory
        </Link>
      </div>
    );
  }

  const tabItems = [
    {
      id: "overview",
      label: "Overview",
      icon: <User className="h-4 w-4" />,
      content: <WorkerOverviewTab worker={worker} />,
    },
    {
      id: "skills",
      label: `Skills & Certifications (${skills.length + certifications.length})`,
      icon: <Award className="h-4 w-4" />,
      content: <WorkerSkillsTab skills={skills} certifications={certifications} />,
    },
    {
      id: "bookings",
      label: `Bookings (${bookings.length})`,
      icon: <Calendar className="h-4 w-4" />,
      content: <WorkerBookingsTab bookings={bookings} />,
    },
    {
      id: "performance",
      label: "Performance Benchmark",
      icon: <BarChart2 className="h-4 w-4" />,
      content: <WorkerPerformanceTab performance={performance} />,
    },
    {
      id: "welfare",
      label: "Welfare & Insurance",
      icon: <HeartHandshake className="h-4 w-4" />,
      content: <WorkerWelfareTab welfare={welfare} />,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={worker.fullName}
        description={`Craft: ${worker.profession} | Society: ${worker.societyName} | Experience: ${worker.experienceYears} Years`}
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Workforce", href: "/super-admin/workforce" },
          { label: worker.fullName },
        ]}
        actions={
          <Link
            href="/super-admin/workforce"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-emerald-800/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
            )}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workforce Directory
          </Link>
        }
      />

      {/* Interactive Tabs Layout */}
      <Tabs tabs={tabItems} activeTab={initialTab} onTabChange={handleTabChange} />
    </div>
  );
}
