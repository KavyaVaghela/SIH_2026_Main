"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  Plus,
  Clock,
  Briefcase,
  FileText,
} from "lucide-react";

export interface ProjectRequest {
  id: string;
  projectNumber: string;
  title: string;
  categoryName: string;
  description: string;
  workforceNeeded: number;
  location: string;
  expectedStartDate: string;
  durationDays: number;
  status: "SUBMITTED" | "UNDER_REVIEW" | "PROPOSAL_READY" | "ALLOCATED";
  createdAt: string;
}

const LOCAL_STORAGE_PROJECTS_KEY = "kaushalyasetu_project_requests_db";

const DEFAULT_PROJECTS: ProjectRequest[] = [
  {
    id: "proj-1",
    projectNumber: "PRJ-2026-104",
    title: "Shivam Society Common Area Repainting",
    categoryName: "Painting & Waterproofing",
    description: "Exterior and lobby repainting for 4 residential blocks including waterproofing coating.",
    workforceNeeded: 6,
    location: "Satellite, Ahmedabad",
    expectedStartDate: "2026-09-15",
    durationDays: 12,
    status: "UNDER_REVIEW",
    createdAt: new Date().toISOString(),
  },
];

export function ProjectRequestView() {
  const router = useRouter();

  const [projects, setProjects] = React.useState<ProjectRequest[]>([]);
  const [showForm, setShowForm] = React.useState<boolean>(false);

  // Form Fields
  const [title, setTitle] = React.useState("");
  const [categoryName, setCategoryName] = React.useState("Painting & Waterproofing");
  const [description, setDescription] = React.useState("");
  const [workforceNeeded, setWorkforceNeeded] = React.useState<number>(4);
  const [location, setLocation] = React.useState("Satellite, Ahmedabad");
  const [expectedStartDate, setExpectedStartDate] = React.useState("2026-09-20");
  const [durationDays, setDurationDays] = React.useState<number>(7);
  const [submitting, setSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const loadProjects = React.useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
      if (stored) {
        setProjects(JSON.parse(stored));
      } else {
        setProjects(DEFAULT_PROJECTS);
        localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(DEFAULT_PROJECTS));
      }
    } catch {
      setProjects(DEFAULT_PROJECTS);
    }
  }, []);

  React.useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    const newProj: ProjectRequest = {
      id: `proj-${Date.now()}`,
      projectNumber: `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`,
      title,
      categoryName,
      description,
      workforceNeeded,
      location,
      expectedStartDate,
      durationDays,
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    };

    const updated = [newProj, ...projects];
    setProjects(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updated));
    }

    setSubmitting(false);
    setShowForm(false);
    setSuccessMessage("Your project request has been submitted and is awaiting cooperative review.");
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setWorkforceNeeded(4);
    setLocation("Satellite, Ahmedabad");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Hire Cooperative Workforce for Large Projects"
        description="Deploy multi-artisan teams for residential society renovations, commercial painting, bulk electrical work, large cleaning contracts, and institutional maintenance."
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Project Workforce" },
        ]}
        actions={
          !showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 shadow-md gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Submit New Project Requirement
            </Button>
          ) : undefined
        }
      />

      {/* Success Notification */}
      {successMessage && (
        <Card className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </Card>
      )}

      {/* Project Request Form */}
      {showForm && (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-900 dark:text-white">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Project & Multi-Worker Requirement Form</span>
            </div>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">✕ Cancel</button>
          </div>

          <form onSubmit={handleSubmitProject} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Shivam Society Exterior Painting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Primary Trade Category</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                >
                  <option value="Painting & Waterproofing">Painting & Waterproofing</option>
                  <option value="Carpentry & Furniture">Carpentry & Structural Woodwork</option>
                  <option value="Plumbing & Drainage">Plumbing & Water Systems</option>
                  <option value="Electrical Services">Bulk Electrical & Wiring</option>
                  <option value="Cleaning & Sanitation">Deep Commercial Cleaning</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Detailed Project Scope & Requirements</label>
              <textarea
                rows={3}
                required
                placeholder="Describe scope, block count, total square feet, special materials needed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Artisans Needed</label>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={workforceNeeded}
                  onChange={(e) => setWorkforceNeeded(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Expected Start Date</label>
                <input
                  type="date"
                  value={expectedStartDate}
                  onChange={(e) => setExpectedStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Duration (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} size="sm" className="bg-emerald-700 text-white font-bold text-xs px-5">
                Submit Project Request
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Submitted Projects List */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Submitted Project Requests ({projects.length})
        </h3>

        {projects.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 space-y-2">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No project requests submitted yet.</p>
          </Card>
        ) : (
          projects.map((proj) => (
            <Card
              key={proj.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">
                    {proj.projectNumber}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {proj.title}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                    {proj.categoryName}
                  </p>
                </div>

                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs">
                  {proj.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {proj.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Team Size</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" /> {proj.workforceNeeded} Artisans
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Start Date</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {proj.expectedStartDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Duration</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> {proj.durationDays} Days
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Location</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {proj.location}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
