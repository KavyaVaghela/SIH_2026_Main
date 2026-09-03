"use client";

import * as React from "react";
import { CooperativeIdentityCard } from "./cooperative-identity-card";
import { SummaryCardsGrid } from "./summary-cards-grid";
import { NewJobRequestsCard } from "./new-job-requests-card";
import { TodayScheduleCard } from "./today-schedule-card";
import { QuickActionsCard } from "./quick-actions-card";
import { CommunityUpdateCard } from "./community-update-card";
import {
  DEMO_WORKER_IDENTITY,
  DEMO_WORKER_OVERVIEW_STATS,
} from "../services/worker-mock-data";
import { workerJobService } from "../services/worker-job-service";
import type { WorkerJobItem, WorkerScheduleItem, WorkerOverviewStats } from "../types";

export function HomeOverviewView() {
  const [requests, setRequests] = React.useState<WorkerJobItem[]>([]);
  const [scheduleItems, setScheduleItems] = React.useState<WorkerScheduleItem[]>([]);
  const [stats, setStats] = React.useState<WorkerOverviewStats>(DEMO_WORKER_OVERVIEW_STATS);

  React.useEffect(() => {
    Promise.all([
      workerJobService.getJobRequests("w-1"),
      workerJobService.getSchedule("w-1"),
      workerJobService.getWorkerEarnings("w-1"),
    ])
      .then(([liveRequests, schedule, earnings]) => {
        setRequests(liveRequests);

        const mapped: WorkerScheduleItem[] = schedule.today.map((j) => ({
          id: j.id,
          time: j.scheduledTime,
          serviceTitle: j.serviceTitle,
          status: j.status === "BOOKING_CONFIRMED" || j.status === "WORKER_ACCEPTED" ? "Confirmed" : "Upcoming",
          customerName: j.customerName,
          customerArea: j.customerArea,
          estimatedDuration: "1.5 hours",
          notes: j.problemDescription,
          jobId: j.id,
        }));
        setScheduleItems(mapped);

        setStats({
          todaysJobs: schedule.today.length,
          todaysEarnings: earnings.summary.todaysEarnings,
          overallRating: 4.9,
          completedJobs: earnings.summary.completedJobsCount,
        });
      })
      .catch((err) => {
        console.warn("HomeOverview live data sync note:", err);
      });
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* 1. Worker & Cooperative Identity Hero */}
      <CooperativeIdentityCard identity={DEMO_WORKER_IDENTITY} />

      {/* 2. Key Performance & Financial Metrics */}
      <SummaryCardsGrid stats={stats} />

      {/* 3. Core Operational Feeds: Job Requests & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <NewJobRequestsCard requests={requests} />
        <TodayScheduleCard scheduleItems={scheduleItems} />
      </div>

      {/* 4. Quick Actions for Fast Navigation */}
      <QuickActionsCard />

      {/* 5. Cooperative Community & Welfare Announcement */}
      <CommunityUpdateCard />
    </div>
  );
}
