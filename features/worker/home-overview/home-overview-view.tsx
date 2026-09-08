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

import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

import { createClient } from "@/lib/supabase/client";
import type { WorkerIdentity } from "../types";

export function HomeOverviewView() {
  const [requests, setRequests] = React.useState<WorkerJobItem[]>([]);
  const [scheduleItems, setScheduleItems] = React.useState<WorkerScheduleItem[]>([]);
  const [stats, setStats] = React.useState<WorkerOverviewStats>(DEMO_WORKER_OVERVIEW_STATS);
  const [workerIdentity, setWorkerIdentity] = React.useState<WorkerIdentity>(DEMO_WORKER_IDENTITY);

  const [workerDbId, setWorkerDbId] = React.useState<string>("59eca4ff-a589-4363-ad76-24a4ff5b6e2e");
  // Monotonically increasing counter: only the latest fetch generation may commit state
  const fetchGenRef = React.useRef(0);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("profiles") as any)
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data: prof }: { data: { full_name?: string } | null }) => {
            if (prof?.full_name) {
              const fullName = prof.full_name;
              setWorkerIdentity((prev) => ({ ...prev, name: fullName }));
            }
          });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("workers") as any)
          .select("id, profession, verification_status, federations(name, city, state)")
          .eq("profile_id", user.id)
          .maybeSingle()
          .then(({ data: wRec }: { data: any }) => {
            if (wRec) {
              if (wRec.id) setWorkerDbId(wRec.id);
              setWorkerIdentity((prev) => ({
                ...prev,
                trade: wRec.profession || "Plumber",
                federationName: wRec.federations?.name || "Ahmedabad Skilled Workers Federation",
                location: wRec.federations?.city ? `${wRec.federations.city}, ${wRec.federations.state}` : "Ahmedabad, Gujarat",
                isVerified: wRec.verification_status === "verified",
              }));
            }
          });
      }
    });
  }, []);

  const refreshData = React.useCallback(() => {
    const targetId = workerDbId || "w-1";
    // Capture this fetch's generation number
    const thisGen = ++fetchGenRef.current;

    Promise.all([
      workerJobService.getJobRequests(targetId),
      workerJobService.getSchedule(targetId),
      workerJobService.getWorkerEarnings(targetId),
    ])
      .then(([liveRequests, schedule, earnings]) => {
        // Discard stale responses — only the newest fetch may update state
        if (thisGen !== fetchGenRef.current) return;

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
  }, [workerDbId]);

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Subscribe to real-time changes on bookings table for Worker Dashboard
  // Only subscribe once workerDbId is resolved so we don't fire stale refetches
  useRealtimeSubscription({
    table: "bookings",
    enabled: !!workerDbId,
    onPayload: () => {
      refreshData();
    },
  });


  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* 1. Worker & Cooperative Identity Hero */}
      <CooperativeIdentityCard identity={workerIdentity} />

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
