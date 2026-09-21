"use client";

import * as React from "react";
import { WelfareHeader } from "./welfare-header";
import { WelfareKpiGrid } from "./welfare-kpi-grid";
import { WelfareProgramsTable } from "./welfare-programs-table";
import { FederationCoverageList } from "./federation-coverage-list";
import { TrainingCertificationPanel } from "./training-certification-panel";
import { WorkerAssistancePanel } from "./worker-assistance-panel";
import { WelfareCoverageDonutChart } from "./welfare-coverage-donut-chart";
import { CoverageByCategoryCard } from "./coverage-by-category-card";
import { SafetyWorkerSupportCard } from "./safety-worker-support-card";
import { RecentActivityTimeline } from "./recent-activity-timeline";

// Standard Modals
import { AddProgramModal } from "./add-program-modal";
import { ViewEditProgramModal } from "./view-edit-program-modal";
import { CreateTrainingModal } from "./create-training-modal";
import { AssistanceDetailsModal } from "./assistance-details-modal";
import { FederationDetailsModal } from "./federation-details-modal";

// View All Modals
import {
  ViewAllProgramsModal,
  ViewAllFederationsModal,
  ViewAllTrainingsModal,
  ViewAllAssistanceModal,
  ViewAllActivitiesModal,
} from "./view-all-modals";

// Data & Service
import { welfareService } from "../services/welfare-service";
import {
  INITIAL_WELFARE_PROGRAMS,
  INITIAL_FEDERATION_COVERAGE,
  INITIAL_TRAINING_STATS,
  INITIAL_TRAINING_PROGRAMS,
  INITIAL_ASSISTANCE_STATS,
  INITIAL_WORKER_ASSISTANCE_REQUESTS,
  RECENT_WELFARE_ACTIVITIES,
} from "../data/welfare-mock-data";

import type {
  WelfareProgramItem,
  FederationCoverageItem,
  TrainingProgramItem,
  WorkerAssistanceItem,
  AssistanceStatus,
} from "../types";

export function WelfareDashboardView() {
  // State management
  const [federationFilter, setFederationFilter] = React.useState("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [dateFilter, setDateFilter] = React.useState("30_DAYS");

  // Datasets
  const [programs, setPrograms] = React.useState<WelfareProgramItem[]>(INITIAL_WELFARE_PROGRAMS);
  const [federations, setFederations] = React.useState<FederationCoverageItem[]>(INITIAL_FEDERATION_COVERAGE);
  const [trainingPrograms, setTrainingPrograms] = React.useState<TrainingProgramItem[]>(INITIAL_TRAINING_PROGRAMS);
  const [assistanceRequests, setAssistanceRequests] = React.useState<WorkerAssistanceItem[]>(INITIAL_WORKER_ASSISTANCE_REQUESTS);

  // Standard Modal Visibility States
  const [isAddProgramOpen, setIsAddProgramOpen] = React.useState(false);
  const [selectedProgram, setSelectedProgram] = React.useState<WelfareProgramItem | null>(null);
  const [isViewProgramOpen, setIsViewProgramOpen] = React.useState(false);
  const [isCreateTrainingOpen, setIsCreateTrainingOpen] = React.useState(false);
  const [selectedAssistance, setSelectedAssistance] = React.useState<WorkerAssistanceItem | null>(null);
  const [isAssistanceOpen, setIsAssistanceOpen] = React.useState(false);
  const [selectedFederation, setSelectedFederation] = React.useState<FederationCoverageItem | null>(null);
  const [isFederationOpen, setIsFederationOpen] = React.useState(false);

  // View All Modal Visibility States
  const [isViewAllProgramsOpen, setIsViewAllProgramsOpen] = React.useState(false);
  const [isViewAllFederationsOpen, setIsViewAllFederationsOpen] = React.useState(false);
  const [isViewAllTrainingsOpen, setIsViewAllTrainingsOpen] = React.useState(false);
  const [isViewAllAssistanceOpen, setIsViewAllAssistanceOpen] = React.useState(false);
  const [isViewAllActivitiesOpen, setIsViewAllActivitiesOpen] = React.useState(false);

  // Toast Banner State
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Attempt to fetch Supabase backend data if available, without breaking mock fallback
  React.useEffect(() => {
    welfareService
      .getWelfareData()
      .then((res) => {
        if (res.societies && res.societies.length > 0) {
          const mappedFeds: FederationCoverageItem[] = res.societies.map((soc, idx) => ({
            id: soc.id,
            name: soc.name,
            coveredWorkers: 100 + idx * 35,
            totalWorkers: 150 + idx * 45,
            coveragePercentage: Math.round(((100 + idx * 35) / (150 + idx * 45)) * 100),
          }));
          setFederations((prev) => (mappedFeds.length > 3 ? mappedFeds : prev));
        }
      })
      .catch(() => {
        // Retain fallback data gracefully
      });
  }, []);

  // Compute duration/datewise stats reactively
  const durationMultiplier = React.useMemo(() => {
    switch (dateFilter) {
      case "7_DAYS":
        return 0.25;
      case "30_DAYS":
        return 1.0;
      case "90_DAYS":
        return 2.5;
      case "ALL":
        return 5.0;
      default:
        return 1.0;
    }
  }, [dateFilter]);

  const trainingStats = React.useMemo(() => {
    return {
      activePrograms: Math.round(INITIAL_TRAINING_STATS.activePrograms * (durationMultiplier === 0.25 ? 0.4 : durationMultiplier === 2.5 ? 1.4 : 1.0)),
      workersEnrolled: Math.round(INITIAL_TRAINING_STATS.workersEnrolled * durationMultiplier),
      completedTraining: Math.round(INITIAL_TRAINING_STATS.completedTraining * durationMultiplier),
      certificationsIssued: Math.round(INITIAL_TRAINING_STATS.certificationsIssued * durationMultiplier),
      expiringNext3Months: Math.round(INITIAL_TRAINING_STATS.expiringNext3Months * (durationMultiplier === 0.25 ? 0.3 : 1.0)),
    };
  }, [durationMultiplier]);

  const assistanceStats = React.useMemo(() => {
    return {
      pending: Math.round(INITIAL_ASSISTANCE_STATS.pending * (durationMultiplier === 0.25 ? 0.2 : durationMultiplier === 2.5 ? 1.8 : 1.0)),
      underReview: Math.round(INITIAL_ASSISTANCE_STATS.underReview * (durationMultiplier === 0.25 ? 0.3 : 1.0)),
      approved: Math.round(INITIAL_ASSISTANCE_STATS.approved * durationMultiplier),
      resolved: Math.round(INITIAL_ASSISTANCE_STATS.resolved * durationMultiplier),
    };
  }, [durationMultiplier]);

  // Filter handlers
  const filteredPrograms = React.useMemo(() => {
    return programs.filter((p) => {
      const matchCat = categoryFilter === "ALL" || p.category === categoryFilter;
      const matchFed =
        federationFilter === "ALL" ||
        p.applicableFederations?.includes("All Federations") ||
        p.applicableFederations?.includes(federationFilter);
      return matchCat && matchFed;
    });
  }, [programs, categoryFilter, federationFilter]);

  const filteredFederations = React.useMemo(() => {
    const list = federations.filter((f) => {
      return federationFilter === "ALL" || f.name === federationFilter;
    });
    return list.slice(0, 5);
  }, [federations, federationFilter]);

  const filteredAssistance = React.useMemo(() => {
    return assistanceRequests.filter((a) => {
      return federationFilter === "ALL" || a.federationName === federationFilter;
    });
  }, [assistanceRequests, federationFilter]);

  // Program Handlers
  const handleAddProgram = (newProg: WelfareProgramItem) => {
    setPrograms((prev) => [newProg, ...prev]);
    showToast(`Welfare program "${newProg.name}" created successfully!`);
  };

  const handleUpdateProgram = (updated: WelfareProgramItem) => {
    setPrograms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Program "${updated.name}" updated successfully.`);
  };

  const handleDeactivateProgram = (id: string) => {
    setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, status: "Inactive" } : p)));
    showToast("Welfare program deactivated.");
  };

  // Training Handler
  const handleCreateTraining = (newTrg: TrainingProgramItem) => {
    setTrainingPrograms((prev) => [newTrg, ...prev]);
    showToast(`Training program "${newTrg.name}" created successfully!`);
  };

  // Assistance Status Handler
  const handleAssistanceStatusChange = (id: string, newStatus: AssistanceStatus) => {
    setAssistanceRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    showToast(`Assistance request status updated to "${newStatus}".`);
  };

  // Export Report Handler
  const handleExportReport = () => {
    showToast("Welfare & Social Protection Report generated and downloaded.");
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3 px-4 bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-lg border border-emerald-500 animate-in fade-in-0 slide-in-from-top-2 flex items-center gap-2">
          <span>✓</span> {toastMessage}
        </div>
      )}

      {/* 1. Header & Controls */}
      <WelfareHeader
        federationFilter={federationFilter}
        setFederationFilter={setFederationFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onExportReport={handleExportReport}
        federationOptions={federations.map((f) => ({ id: f.id, name: f.name }))}
      />

      {/* 2. Top 6-KPI Metric Cards Row */}
      <WelfareKpiGrid dateFilter={dateFilter} />

      {/* 3. Main Grid Row 1: Programs Table (Col 8) + Federation Coverage (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-w-0 max-w-full">
        <div className="lg:col-span-8 min-w-0 max-w-full">
          <WelfareProgramsTable
            programs={filteredPrograms}
            onAddProgram={() => setIsAddProgramOpen(true)}
            onViewProgram={(prog) => {
              setSelectedProgram(prog);
              setIsViewProgramOpen(true);
            }}
            onViewAll={() => setIsViewAllProgramsOpen(true)}
          />
        </div>

        <div className="lg:col-span-4 min-w-0 max-w-full">
          <FederationCoverageList
            federations={filteredFederations}
            onViewFederation={(fed) => {
              setSelectedFederation(fed);
              setIsFederationOpen(true);
            }}
            onViewAll={() => setIsViewAllFederationsOpen(true)}
          />
        </div>
      </div>

      {/* 4. Main Grid Row 2: Training & Certification (Col 7) + Worker Assistance (Col 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-w-0 max-w-full">
        <div className="lg:col-span-7 min-w-0 max-w-full">
          <TrainingCertificationPanel
            stats={trainingStats}
            programs={trainingPrograms}
            onCreateTraining={() => setIsCreateTrainingOpen(true)}
            onViewAll={() => setIsViewAllTrainingsOpen(true)}
          />
        </div>

        <div className="lg:col-span-5 min-w-0 max-w-full">
          <WorkerAssistancePanel
            stats={assistanceStats}
            requests={filteredAssistance}
            onRequestClick={(req) => {
              setSelectedAssistance(req);
              setIsAssistanceOpen(true);
            }}
            onViewAll={() => setIsViewAllAssistanceOpen(true)}
          />
        </div>
      </div>

      {/* 5. Bottom Grid Row 3: 4 Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch min-w-0 max-w-full">
        <WelfareCoverageDonutChart />
        <CoverageByCategoryCard />
        <SafetyWorkerSupportCard dateFilter={dateFilter} />
        <RecentActivityTimeline onViewAll={() => setIsViewAllActivitiesOpen(true)} />
      </div>

      {/* Standard Modals */}
      <AddProgramModal
        isOpen={isAddProgramOpen}
        onClose={() => setIsAddProgramOpen(false)}
        onSave={handleAddProgram}
      />

      <ViewEditProgramModal
        program={selectedProgram}
        isOpen={isViewProgramOpen}
        onClose={() => setIsViewProgramOpen(false)}
        onUpdate={handleUpdateProgram}
        onDeactivate={handleDeactivateProgram}
      />

      <CreateTrainingModal
        isOpen={isCreateTrainingOpen}
        onClose={() => setIsCreateTrainingOpen(false)}
        onCreate={handleCreateTraining}
      />

      <AssistanceDetailsModal
        request={selectedAssistance}
        isOpen={isAssistanceOpen}
        onClose={() => setIsAssistanceOpen(false)}
        onStatusChange={handleAssistanceStatusChange}
      />

      <FederationDetailsModal
        federation={selectedFederation}
        isOpen={isFederationOpen}
        onClose={() => setIsFederationOpen(false)}
      />

      {/* View All Modals */}
      <ViewAllProgramsModal
        isOpen={isViewAllProgramsOpen}
        onClose={() => setIsViewAllProgramsOpen(false)}
        programs={programs}
        onSelectProgram={(prog) => {
          setSelectedProgram(prog);
          setIsViewProgramOpen(true);
        }}
      />

      <ViewAllFederationsModal
        isOpen={isViewAllFederationsOpen}
        onClose={() => setIsViewAllFederationsOpen(false)}
        federations={federations}
        onSelectFederation={(fed) => {
          setSelectedFederation(fed);
          setIsFederationOpen(true);
        }}
      />

      <ViewAllTrainingsModal
        isOpen={isViewAllTrainingsOpen}
        onClose={() => setIsViewAllTrainingsOpen(false)}
        trainings={trainingPrograms}
      />

      <ViewAllAssistanceModal
        isOpen={isViewAllAssistanceOpen}
        onClose={() => setIsViewAllAssistanceOpen(false)}
        requests={assistanceRequests}
        onSelectRequest={(req) => {
          setSelectedAssistance(req);
          setIsAssistanceOpen(true);
        }}
      />

      <ViewAllActivitiesModal
        isOpen={isViewAllActivitiesOpen}
        onClose={() => setIsViewAllActivitiesOpen(false)}
        activities={RECENT_WELFARE_ACTIVITIES}
      />
    </div>
  );
}
