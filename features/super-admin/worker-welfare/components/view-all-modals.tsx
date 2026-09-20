"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronRight, Search, Building2, Users2, GraduationCap, LifeBuoy, Clock } from "lucide-react";
import type {
  WelfareProgramItem,
  FederationCoverageItem,
  TrainingProgramItem,
  WorkerAssistanceItem,
  RecentWelfareActivityItem,
  AssistanceStatus,
} from "../types";

// 1. View All Welfare Programs Modal
export interface ViewAllProgramsModalProps {
  isOpen: boolean;
  onClose: () => void;
  programs: WelfareProgramItem[];
  onSelectProgram: (prog: WelfareProgramItem) => void;
}

export function ViewAllProgramsModal({
  isOpen,
  onClose,
  programs,
  onSelectProgram,
}: ViewAllProgramsModalProps) {
  const [search, setSearch] = React.useState("");

  const filtered = programs.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto p-1">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <DialogTitle className="text-lg font-bold text-foreground">
              All Welfare Programs & Schemes ({programs.length})
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Complete registry of worker welfare protection schemes across all federations.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scheme by name or category..."
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="overflow-x-auto border border-border/60 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 font-semibold border-b border-border/60">
                <tr>
                  <th className="p-2.5 font-semibold">Scheme</th>
                  <th className="p-2.5 font-semibold">Category</th>
                  <th className="p-2.5 font-semibold">Federations</th>
                  <th className="p-2.5 font-semibold">Covered / Eligible</th>
                  <th className="p-2.5 font-semibold">Status</th>
                  <th className="p-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      onSelectProgram(item);
                      onClose();
                    }}
                    className="hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="p-2.5 font-semibold text-foreground">{item.name}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-2.5 font-medium">{item.federationsCount}</td>
                    <td className="p-2.5 font-medium">
                      {item.coveredWorkers.toLocaleString()} / {item.eligibleWorkers.toLocaleString()}
                    </td>
                    <td className="p-2.5">
                      <Badge variant="outline" className="text-[10px]">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-2.5 text-right">
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-emerald-600">
                        View &rarr;
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
            Close
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}

// 2. View All Federations Coverage Modal
export interface ViewAllFederationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  federations: FederationCoverageItem[];
  onSelectFederation: (fed: FederationCoverageItem) => void;
}

export function ViewAllFederationsModal({
  isOpen,
  onClose,
  federations,
  onSelectFederation,
}: ViewAllFederationsModalProps) {
  const [search, setSearch] = React.useState("");

  const filtered = federations.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto p-1">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-emerald-600" />
            <DialogTitle className="text-lg font-bold text-foreground">
              All Federation Welfare Coverage ({federations.length})
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Compare welfare coverage rates across all regional labour cooperatives.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search federation by name..."
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filtered.map((fed) => (
              <div
                key={fed.id}
                onClick={() => {
                  onSelectFederation(fed);
                  onClose();
                }}
                className="p-3 rounded-lg border border-border/60 hover:border-emerald-500/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">{fed.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {fed.coveredWorkers} / {fed.totalWorkers}
                    </span>
                    <span className="font-bold text-emerald-600">{fed.coveragePercentage}%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${fed.coveragePercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
            Close
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}

// 3. View All Training Programs Modal
export interface ViewAllTrainingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainings: TrainingProgramItem[];
}

export function ViewAllTrainingsModal({
  isOpen,
  onClose,
  trainings,
}: ViewAllTrainingsModalProps) {
  const [search, setSearch] = React.useState("");

  const filtered = trainings.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto p-1">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            <DialogTitle className="text-lg font-bold text-foreground">
              All Skill & Safety Training Programs ({trainings.length})
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Complete list of active skills, safety certifications, and trade workshops.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search training program or trade..."
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="overflow-x-auto border border-border/60 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 font-semibold border-b border-border/60">
                <tr>
                  <th className="p-2.5 font-semibold">Training Program</th>
                  <th className="p-2.5 font-semibold">Category</th>
                  <th className="p-2.5 font-semibold">Duration</th>
                  <th className="p-2.5 font-semibold">Instructor</th>
                  <th className="p-2.5 font-semibold">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="p-2.5 font-semibold text-foreground">{item.name}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-muted-foreground">{item.duration || "4 Weeks"}</td>
                    <td className="p-2.5 font-medium">{item.instructor || "Master Trainer"}</td>
                    <td className="p-2.5 font-bold text-emerald-600">{item.enrolledWorkers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
            Close
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}

// 4. View All Worker Assistance Requests Modal
export interface ViewAllAssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: WorkerAssistanceItem[];
  onSelectRequest: (req: WorkerAssistanceItem) => void;
}

export function ViewAllAssistanceModal({
  isOpen,
  onClose,
  requests,
  onSelectRequest,
}: ViewAllAssistanceModalProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const filtered = requests.filter((r) => {
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchSearch =
      r.workerName.toLowerCase().includes(search.toLowerCase()) ||
      r.federationName.toLowerCase().includes(search.toLowerCase()) ||
      r.requestType.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto p-1">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-emerald-600" />
            <DialogTitle className="text-lg font-bold text-foreground">
              All Worker Assistance Requests ({requests.length})
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Inspect, review, and manage worker welfare assistance applications.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search worker or federation..."
                className="pl-9 text-xs h-9"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 text-xs border border-border/80 rounded-md px-3 bg-background font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-border/60 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 font-semibold border-b border-border/60">
                <tr>
                  <th className="p-2.5 font-semibold">Worker</th>
                  <th className="p-2.5 font-semibold">Federation</th>
                  <th className="p-2.5 font-semibold">Request Type</th>
                  <th className="p-2.5 font-semibold">Submitted</th>
                  <th className="p-2.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      onSelectRequest(item);
                      onClose();
                    }}
                    className="hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="p-2.5 font-semibold text-foreground">{item.workerName}</td>
                    <td className="p-2.5 text-muted-foreground">{item.federationName}</td>
                    <td className="p-2.5 font-medium">{item.requestType}</td>
                    <td className="p-2.5 text-muted-foreground">{item.submittedAt}</td>
                    <td className="p-2.5 text-right">
                      <Badge variant="outline" className="text-[10px]">
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
            Close
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}

// 5. View All Recent Activities Modal
export interface ViewAllActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: RecentWelfareActivityItem[];
}

export function ViewAllActivitiesModal({
  isOpen,
  onClose,
  activities,
}: ViewAllActivitiesModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto p-1">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            <DialogTitle className="text-lg font-bold text-foreground">
              Welfare Activity Log ({activities.length})
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Complete audit record of welfare program updates and certifications.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 space-y-3">
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {activities.map((act) => (
              <div key={act.id} className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-foreground block">{act.title}</span>
                  <span className="text-muted-foreground text-[11px]">{act.subtitle}</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold shrink-0">{act.timeAgo}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
            Close
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
