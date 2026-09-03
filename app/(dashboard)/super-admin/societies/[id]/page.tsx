"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Building2, Users, Calendar, BarChart2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSocietyDetail } from "@/features/super-admin/cooperative-societies/hooks/use-society-detail";
import { SocietyOverviewTab } from "@/features/super-admin/cooperative-societies/components/society-overview-tab";
import { SocietyWorkersTab } from "@/features/super-admin/cooperative-societies/components/society-workers-tab";
import { SocietyBookingsTab } from "@/features/super-admin/cooperative-societies/components/society-bookings-tab";
import { SocietyPerformanceTab } from "@/features/super-admin/cooperative-societies/components/society-performance-tab";

export default function SocietyDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = (params?.id as string) || "";
  const initialTab = searchParams?.get("tab") || "overview";

  const { society, workers, bookings, performance, isLoading, error } = useSocietyDetail(id);

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

  if (error || !society) {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-rose-600" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Cooperative Society Not Found</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          The requested society record could not be found or has been removed.
        </p>
        <Link
          href="/super-admin/societies"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Societies List
        </Link>
      </div>
    );
  }

  const tabItems = [
    {
      id: "overview",
      label: "Overview",
      icon: <Building2 className="h-4 w-4" />,
      content: <SocietyOverviewTab society={society} />,
    },
    {
      id: "workers",
      label: `Workers (${workers.length})`,
      icon: <Users className="h-4 w-4" />,
      content: <SocietyWorkersTab workers={workers} />,
    },
    {
      id: "bookings",
      label: `Bookings (${bookings.length})`,
      icon: <Calendar className="h-4 w-4" />,
      content: <SocietyBookingsTab bookings={bookings} />,
    },
    {
      id: "performance",
      label: "Performance Benchmark",
      icon: <BarChart2 className="h-4 w-4" />,
      content: <SocietyPerformanceTab performance={performance} />,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={society.name}
        description={`Code: ${society.code} | Registration No: ${society.registrationNumber} | Region: ${society.location}`}
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Cooperative Societies", href: "/super-admin/societies" },
          { label: society.name },
        ]}
        actions={
          <Link
            href="/super-admin/societies"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-emerald-800/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
            )}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Societies List
          </Link>
        }
      />

      {/* Interactive Tabs Layout */}
      <Tabs tabs={tabItems} activeTab={initialTab} />
    </div>
  );
}
