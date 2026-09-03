"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Inbox, Calendar, Activity, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { JobRequestsTab } from "./job-requests-tab";
import { MyScheduleTab } from "./my-schedule-tab";
import { ActiveJobsTab } from "./active-jobs-tab";
import { CompletedJobsTab } from "./completed-jobs-tab";
import { WorkerAvailabilityBadge } from "./components/worker-availability-badge";
import { workerJobService } from "../services/worker-job-service";
import type { WorkerJobItem } from "../types";
import type { WorkerAvailabilityStatus } from "@/supabase/types/database.types";

export function ScheduleJobsView() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");

  const [requests, setRequests] = React.useState<WorkerJobItem[]>([]);
  const [todaySchedule, setTodaySchedule] = React.useState<WorkerJobItem[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = React.useState<WorkerJobItem[]>([]);
  const [activeJobs, setActiveJobs] = React.useState<WorkerJobItem[]>([]);
  const [completedJobs, setCompletedJobs] = React.useState<WorkerJobItem[]>([]);
  const [availability, setAvailability] = React.useState<WorkerAvailabilityStatus>("AVAILABLE");

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAllData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqList, sched, actList, compList, avail] = await Promise.all([
        workerJobService.getJobRequests("w-1"),
        workerJobService.getSchedule("w-1"),
        workerJobService.getActiveJobs("w-1"),
        workerJobService.getCompletedJobs("w-1"),
        workerJobService.getWorkerAvailability("w-1"),
      ]);

      setRequests(reqList);
      setTodaySchedule(sched.today);
      setUpcomingSchedule(sched.upcoming);
      setActiveJobs(actList);
      setCompletedJobs(compList);
      setAvailability(avail);
    } catch (err) {
      console.error("Error loading worker schedule data", err);
      setError("We couldn't load your jobs right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const getInitialTabId = () => {
    if (requestedTab === "requests") return "tab-requests";
    if (requestedTab === "schedule") return "tab-schedule";
    if (requestedTab === "active") return "tab-active";
    if (requestedTab === "completed") return "tab-completed";
    return "tab-requests";
  };

  const tabs: TabItem[] = [
    {
      id: "tab-requests",
      label: (
        <span className="flex items-center gap-1.5">
          <span>Job Requests</span>
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-bold">
            {requests.length}
          </span>
        </span>
      ),
      icon: <Inbox className="h-4 w-4" />,
      content: (
        <JobRequestsTab
          requests={requests}
          loading={loading}
          error={error}
          onRefresh={fetchAllData}
        />
      ),
    },
    {
      id: "tab-schedule",
      label: (
        <span className="flex items-center gap-1.5">
          <span>My Schedule</span>
          <span className="rounded-full bg-muted-foreground/20 text-foreground px-1.5 py-0.2 text-[10px] font-bold">
            {todaySchedule.length}
          </span>
        </span>
      ),
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <MyScheduleTab
          todaySchedule={todaySchedule}
          upcomingSchedule={upcomingSchedule}
          loading={loading}
          error={error}
          onRefresh={fetchAllData}
        />
      ),
    },
    {
      id: "tab-active",
      label: (
        <span className="flex items-center gap-1.5">
          <span>Active Jobs</span>
          {activeJobs.length > 0 && (
            <span className="rounded-full bg-emerald-700 text-white px-1.5 py-0.2 text-[10px] font-bold animate-pulse">
              {activeJobs.length}
            </span>
          )}
        </span>
      ),
      icon: <Activity className="h-4 w-4" />,
      content: (
        <ActiveJobsTab
          activeJobs={activeJobs}
          loading={loading}
          error={error}
        />
      ),
    },
    {
      id: "tab-completed",
      label: (
        <span className="flex items-center gap-1.5">
          <span>Completed</span>
          <span className="rounded-full bg-muted-foreground/20 text-foreground px-1.5 py-0.2 text-[10px] font-bold">
            {completedJobs.length}
          </span>
        </span>
      ),
      icon: <CheckCircle2 className="h-4 w-4" />,
      content: (
        <CompletedJobsTab
          completedJobs={completedJobs}
          loading={loading}
          error={error}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="My Schedule & Jobs"
        description="Cooperative service request queues, daily schedule itinerary, and completed assignment records."
        breadcrumbs={[
          { label: "Worker Portal", href: "/worker" },
          { label: "Schedule & Jobs" },
        ]}
        actions={<WorkerAvailabilityBadge status={availability} />}
      />

      <Tabs tabs={tabs} activeTab={getInitialTabId()} className="w-full" />
    </div>
  );
}
