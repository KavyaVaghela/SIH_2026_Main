"use client";

import * as React from "react";
import { CooperativeIdentityCard } from "./cooperative-identity-card";
import { SummaryCardsGrid } from "./summary-cards-grid";
import { NewJobRequestsCard } from "./new-job-requests-card";
import { TodayScheduleCard } from "./today-schedule-card";
import { QuickActionsCard } from "./quick-actions-card";
import { CommunityUpdateCard } from "./community-update-card";
import { workerJobService } from "../services/worker-job-service";
import type { WorkerJobItem, WorkerScheduleItem, WorkerOverviewStats, WorkerIdentity } from "../types";

import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { createClient } from "@/lib/supabase/client";
import { getCachedProfileName, setCachedProfileName } from "@/lib/auth/session-user";

export function HomeOverviewView() {
  const [requests, setRequests] = React.useState<WorkerJobItem[]>([]);
  const [scheduleItems, setScheduleItems] = React.useState<WorkerScheduleItem[]>([]);
  const [stats, setStats] = React.useState<WorkerOverviewStats>({
    todaysJobs: 0,
    todaysEarnings: 0,
    overallRating: 0,
    completedJobs: 0,
  });
  const [isNameLoading, setIsNameLoading] = React.useState<boolean>(true);
  const [workerIdentity, setWorkerIdentity] = React.useState<WorkerIdentity>({
    name: "",
    trade: "Tradesperson",
    cooperativeName: "Cooperative Federation",
    cooperativeRole: "Member",
    federationName: "Cooperative Federation",
    location: "Gujarat, India",
    rating: 0,
    reviewsCount: 0,
    isVerified: false,
  });

  React.useEffect(() => {
    const cached = getCachedProfileName("WORKER");
    if (cached) {
      setWorkerIdentity((prev) => ({ ...prev, name: cached }));
      setIsNameLoading(false);
    }
  }, []);

  const [workerDbId, setWorkerDbId] = React.useState<string>("");
  // Monotonically increasing counter: only the latest fetch generation may commit state
  const fetchGenRef = React.useRef(0);

  const fetchWorkerDetails = React.useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return;

    try {
      // 1. Fetch Profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: prof } = await (supabase.from("profiles") as any)
        .select("full_name, email, phone, role, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      // 2. Fetch Worker Record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: wRec } = await (supabase.from("workers") as any)
        .select(`
          id,
          member_id,
          profession,
          hourly_rate,
          experience_years,
          verification_status,
          account_status,
          availability_status,
          date_of_birth,
          gender,
          federations (id, name, city, state, code)
        `)
        .eq("profile_id", user.id)
        .maybeSingle();

      if (wRec?.id) {
        setWorkerDbId(wRec.id);
      }

      // 3. Fetch Address
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: addr } = await (supabase.from("addresses") as any)
        .select("address_line1, address_line2, city, state, postal_code")
        .eq("profile_id", user.id)
        .order("is_default", { ascending: false })
        .limit(1)
        .maybeSingle();

      // 4. Fetch Skills
      let skillsList: string[] = [];
      if (wRec?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: wSkills } = await (supabase.from("worker_skills") as any)
          .select("skills(name)")
          .eq("worker_id", wRec.id);

        if (wSkills && wSkills.length > 0) {
          skillsList = wSkills.map((s: any) => s.skills?.name).filter(Boolean);
        }
      }

      // 5. Fetch Certifications
      let certsList: string[] = [];
      if (wRec?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: wCerts } = await (supabase.from("worker_certifications") as any)
          .select("certifications(title)")
          .eq("worker_id", wRec.id);

        if (wCerts && wCerts.length > 0) {
          certsList = wCerts.map((c: any) => c.certifications?.title).filter(Boolean);
        }
      }

      const formattedAddress = addr
        ? [addr.address_line1, addr.address_line2, addr.city, addr.postal_code].filter(Boolean).join(", ")
        : "";

      const locationStr = addr?.city
        ? `${addr.city}, ${addr.state || "Gujarat"}`
        : wRec?.federations?.city
        ? `${wRec.federations.city}, ${wRec.federations.state}`
        : "Gujarat";

      const fedName = wRec?.federations?.name || "Ahmedabad Skilled Workers Federation";
      const fullName = prof?.full_name?.trim() || "Ravi Patel";
      setCachedProfileName("WORKER", fullName);
      setIsNameLoading(false);

      setWorkerIdentity({
        name: fullName,
        email: prof?.email || user.email || "",
        phone: prof?.phone || "",
        address: formattedAddress,
        memberId: wRec?.member_id || undefined,
        trade: wRec?.profession || "Skilled Craftsman",
        cooperativeName: fedName,
        cooperativeRole: wRec?.verification_status === "verified" ? "Verified Member" : "Registered Member",
        federationName: fedName,
        location: locationStr,
        rating: 4.9,
        reviewsCount: 12,
        isVerified: wRec?.verification_status === "verified",
        avatarUrl: prof?.avatar_url || undefined,
        skills: skillsList,
        certifications: certsList,
        accountStatus: wRec?.account_status || "ACTIVE",
        availabilityStatus: wRec?.availability_status || "AVAILABLE",
      });
    } catch (err) {
      console.warn("Notice: Worker live overview fetch:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchWorkerDetails();
  }, [fetchWorkerDetails]);

  const refreshData = React.useCallback(() => {
    if (!workerDbId) return;
    const targetId = workerDbId;
    // Capture this fetch's generation number
    const thisGen = ++fetchGenRef.current;

    Promise.all([
      workerJobService.getJobRequests(targetId),
      workerJobService.getSchedule(targetId),
      workerJobService.getWorkerEarnings(targetId),
    ])
      .then(([liveRequests, schedule, earnings]) => {
        if (thisGen !== fetchGenRef.current) return;

        setRequests(liveRequests);

        const mapped: WorkerScheduleItem[] = (schedule?.today || []).map((j) => ({
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

        const jobsDone = Number(earnings?.summary?.completedJobsCount) || 0;
        setStats({
          todaysJobs: schedule?.today?.length || 0,
          todaysEarnings: Number(earnings?.summary?.todaysEarnings) || 0,
          overallRating: jobsDone > 0 ? Number((earnings?.summary as unknown as { rating?: number })?.rating) || 0 : 0,
          completedJobs: jobsDone,
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
  useRealtimeSubscription({
    table: "bookings",
    enabled: !!workerDbId,
    onPayload: () => {
      refreshData();
    },
  });

  // Subscribe to real-time changes on worker_estimates table for incoming multi-worker requests
  useRealtimeSubscription({
    table: "worker_estimates",
    enabled: !!workerDbId,
    onPayload: () => {
      refreshData();
    },
  });

  // Subscribe to real-time changes on job_requests table
  useRealtimeSubscription({
    table: "job_requests",
    enabled: !!workerDbId,
    onPayload: () => {
      refreshData();
    },
  });

  // Subscribe to real-time changes on workers table for status/availability updates
  useRealtimeSubscription({
    table: "workers",
    enabled: !!workerDbId,
    onPayload: () => {
      fetchWorkerDetails();
    },
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* 1. Worker & Cooperative Identity Hero with Live Auth Profile Data */}
      <CooperativeIdentityCard identity={workerIdentity} isNameLoading={isNameLoading} />

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
