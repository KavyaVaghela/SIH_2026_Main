"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  MapPin,
  QrCode,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
  FileCheck,
  Building,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

export interface EmergencyTrackingViewProps {
  incidentId: string;
}

export function EmergencyTrackingView({ incidentId }: EmergencyTrackingViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedCode, setCopiedCode] = React.useState<boolean>(false);
  const [showQrModal, setShowQrModal] = React.useState<boolean>(false);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchTracking = React.useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/emergency/incidents/${incidentId}`);
      if (!res.ok) {
        if (res.status === 403) {
          setError("You are not authorized to track this emergency incident.");
        } else if (res.status === 404) {
          setError("Emergency incident not found.");
        } else {
          setError("Failed to load emergency tracking details.");
        }
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      setError((err as Error)?.message || "Failed to load tracking data.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [incidentId]);

  React.useEffect(() => {
    fetchTracking(true);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [fetchTracking]);

  const handleRealtimeUpdate = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchTracking(false);
    }, 150);
  }, [fetchTracking]);

  // Realtime updates: debounced refresh on WAL updates to avoid redundant requests
  useRealtimeSubscription({
    table: "emergency_incidents",
    enabled: !!incidentId,
    onPayload: handleRealtimeUpdate,
  });

  useRealtimeSubscription({
    table: "emergency_incident_tasks",
    enabled: !!incidentId,
    onPayload: handleRealtimeUpdate,
  });

  useRealtimeSubscription({
    table: "emergency_response_teams",
    enabled: !!incidentId,
    onPayload: handleRealtimeUpdate,
  });

  const handleCopyCode = () => {
    const code = data?.verification?.verificationCode || data?.incident?.verificationCode;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Connecting to Emergency Command Link...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-4">
        <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Emergency Tracking Unavailable
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {error || "Unable to retrieve tracking records for this incident."}
          </p>
          <Link href="/customer">
            <Button variant="outline" size="sm">
              Return to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { incident, team, tasks, tracking, verification } = data;
  const safeStatus = tracking?.customerSafeStatus || incident?.customerSafeStatus || "Processing Emergency";
  const isVerified = incident?.isVerified || verification?.isVerified;
  const isResolvedOrClosed = incident?.status === "RESOLVED" || incident?.status === "CLOSED";

  // Step Calculation
  let activeStep = 1;
  if (incident.status === "CLOSED") activeStep = 5;
  else if (incident.status === "RESOLVED") activeStep = 4;
  else if (isVerified || team?.fieldStatus === "ON_SITE" || team?.fieldStatus === "WORK_IN_PROGRESS") activeStep = 3;
  else if (team || incident.status === "ACTIVE") activeStep = 2;

  // Derivation of customer progress percentage: Closed = 100%
  const progressPercentage =
    incident.status === "CLOSED"
      ? 100
      : (tracking?.progressPercentage ?? (activeStep * 20));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 md:px-0">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/customer"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Customer Portal
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-bold text-rose-600">Live Emergency Tracking</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {incident.emergencyId}
            </h1>
            <Badge
              className={
                isResolvedOrClosed
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-black"
                  : incident.status === "ACTIVE"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 font-black animate-pulse"
                  : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-black"
              }
            >
              {safeStatus}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTracking(true)}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* 1. Progress Timeline Stepper */}
      <Card className="p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Emergency Response Pipeline
          </span>
          <span className="text-xs font-bold font-mono text-rose-600">
            {progressPercentage}% Complete
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2.5 bg-slate-100 dark:bg-slate-800" />

        <div className="grid grid-cols-5 gap-2 pt-2 text-center">
          <div className="space-y-1">
            <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${activeStep >= 1 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>
              ✓
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Reported</p>
          </div>

          <div className="space-y-1">
            <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${activeStep >= 2 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>
              {activeStep >= 2 ? "✓" : "2"}
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Dispatched</p>
          </div>

          <div className="space-y-1">
            <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${activeStep >= 3 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>
              {activeStep >= 3 ? "✓" : "3"}
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">On Site</p>
          </div>

          <div className="space-y-1">
            <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${activeStep >= 4 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>
              {activeStep >= 4 ? "✓" : "4"}
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Resolution</p>
          </div>

          <div className="space-y-1">
            <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${activeStep >= 5 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>
              {activeStep >= 5 ? "✓" : "5"}
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Closed</p>
          </div>
        </div>
      </Card>

      {/* 2. One-Time Verification Section (QR & Code) */}
      <Card className="border-2 border-rose-500/80 dark:border-rose-600/80 bg-gradient-to-br from-white via-rose-50/20 to-amber-50/20 dark:from-slate-900 dark:via-rose-950/20 dark:to-slate-950 p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 dark:border-rose-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30 shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                One-Time Emergency Arrival Verification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Single verification token confirms arrival for all responding cooperative technicians.
              </p>
            </div>
          </div>

          {isVerified ? (
            <Badge className="bg-emerald-600 text-white font-extrabold px-3 py-1 gap-1.5 text-xs shrink-0 self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Arrival Verified on Scene
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 font-bold px-3 py-1 text-xs shrink-0 self-start sm:self-auto">
              <Clock className="w-3.5 h-3.5 mr-1 animate-spin" />
              Awaiting Responder Verification
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Alphanumeric Code Display */}
          <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Verification Code (Present to Team Lead)
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100 tracking-wider select-all">
                {verification?.verificationCode || incident?.verificationCode || "EMG-PEND"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-300"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span className="ml-1.5 font-bold">{copiedCode ? "Copied" : "Copy"}</span>
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              Show this code or the QR code to the lead responder upon arrival.
            </p>
          </div>

          {/* Quick QR Launch Action */}
          <div className="bg-rose-50/50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                Digital Pass QR Code
              </span>
              <span className="text-[11px] text-rose-700 dark:text-rose-300 block">
                One-tap scan for Team Lead phone
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => setShowQrModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              Show QR
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Incident Core & Location Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Incident Summary Card */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Hazard Parameters
            </h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{incident.categoryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Emergency Type:</span>
              <span className="font-black text-slate-900 dark:text-slate-100">{incident.emergencyType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Severity:</span>
              <Badge variant="outline" className="font-bold border-rose-300 text-rose-700 dark:text-rose-400">
                {incident.severity}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Affected Population:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">~{incident.approxPeopleAffected} people</span>
            </div>
            <div className="pt-1">
              <span className="text-slate-500 block mb-0.5">Location:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-rose-600" />
                {incident.location}
              </p>
            </div>
          </div>
        </Card>

        {/* Responding Team Card */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Cooperative Response Team
            </h3>
          </div>

          {team && Array.isArray(team.members) && team.members.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Assigned Technicians:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {team.members.length} Responders on scene
                </span>
              </div>

              <div className="space-y-2">
                {team.members.map((member: { id: string; role: string; isTeamLead: boolean; workerName: string }) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
                        {member.workerName.slice(0, 1)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {member.workerName}
                        </span>
                        <span className="text-[10px] text-slate-500">{member.role}</span>
                      </div>
                    </div>
                    {member.isTeamLead && (
                      <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-black">
                        Team Lead
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-2 text-xs text-slate-500">
              <Clock className="w-5 h-5 animate-spin mx-auto text-amber-500" />
              <p>Mobilizing certified emergency personnel from nearest cooperative hub...</p>
            </div>
          )}
        </Card>
      </div>

      {/* 4. Operational Tasks Summary */}
      {tasks && tasks.length > 0 && (
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                On-Scene Task Execution
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {tasks.filter((t: { status: string }) => t.status === "COMPLETED").length} of {tasks.length} Completed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tasks.map((task: { id: string; title: string; description: string; status: string }) => (
              <div
                key={task.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-start gap-2.5 text-xs"
              >
                {task.status === "COMPLETED" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : task.status === "IN_PROGRESS" ? (
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <span className={`font-bold block ${task.status === "COMPLETED" ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"}`}>
                    {task.title}
                  </span>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{task.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Resolution Summary (Displayed if RESOLVED or CLOSED) */}
      {isResolvedOrClosed && (
        <Card className="border-2 border-emerald-500/80 dark:border-emerald-600/80 bg-emerald-50/20 dark:bg-emerald-950/20 p-6 rounded-2xl shadow-md space-y-4">
          <div className="flex items-center gap-3 border-b border-emerald-200 dark:border-emerald-900/60 pb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Emergency Incident Resolved
              </h3>
              <p className="text-xs text-slate-500">
                Cooperative responders completed emergency containment and structural stabilization.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {incident.resolutionSummary && (
              <div className="space-y-1">
                <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider block">
                  Resolution Summary
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                  {incident.resolutionSummary}
                </p>
              </div>
            )}

            {incident.completedWork && (
              <div className="space-y-1">
                <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider block">
                  Completed Work Report
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                  {incident.completedWork}
                </p>
              </div>
            )}

            {Array.isArray(incident.resolutionEvidencePhotos) && incident.resolutionEvidencePhotos.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider block">
                  Resolution Photo Evidence ({incident.resolutionEvidencePhotos.length})
                </span>
                <div className="flex gap-3 overflow-x-auto py-1">
                  {incident.resolutionEvidencePhotos.map((url: string, i: number) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`Resolution evidence ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 6. Demo Payment / Assistance Protocol Banner */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {tracking?.paymentNotice || "Covered under Cooperative Disaster Assistance Protocol (₹0 Immediate Charge)"}
          </span>
        </div>
        <Badge variant="outline" className="font-bold border-emerald-300 text-emerald-700">
          Covered
        </Badge>
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Scan Emergency Pass
            </h3>
            <p className="text-xs text-slate-500">
              Present this QR to the arriving response team lead to authenticate response deployment.
            </p>

            {/* Generated QR representation */}
            <div className="w-48 h-48 mx-auto bg-slate-900 text-white rounded-xl p-4 flex flex-col items-center justify-center space-y-2 border-4 border-rose-500">
              <QrCode className="w-24 h-24 text-white" />
              <span className="font-mono text-xs font-black tracking-widest text-amber-300">
                {verification?.verificationCode || incident?.verificationCode || "EMG-2026"}
              </span>
            </div>

            <p className="text-[11px] font-mono text-slate-400 break-all select-all">
              Token: {(verification?.verificationToken || incident?.verificationToken || "token").slice(0, 20)}...
            </p>

            <Button
              className="w-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs"
              onClick={() => setShowQrModal(false)}
            >
              Close Pass
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
