"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Receipt,
  Briefcase,
  Calendar,
  User,
  Building,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { GrievanceCase } from "@/types/complaints/v2";

interface WorkerJob {
  id: string;
  bookingNumber: string;
  serviceTitle: string;
  customerName: string;
  customerPhone?: string;
  scheduledDate: string;
  federationId?: string;
  federationName?: string;
  totalAmount?: number;
  status: string;
}

const WORKER_CATEGORIES = [
  "Non-Payment or Underpayment",
  "Client Conduct or Harassment",
  "Unsafe Working Conditions",
  "Unreasonable Demands / Scope Creep",
  "Cancellation Dispute",
  "Other Job Issue",
];

export default function NewWorkerGrievancePage() {
  const router = useRouter();

  const [workerId, setWorkerId] = React.useState<string>("59eca4ff-a589-4363-ad76-24a4ff5b6e2e");
  const [workerName, setWorkerName] = React.useState<string>("Ravi Patel");
  const [jobs, setJobs] = React.useState<WorkerJob[]>([]);
  const [loadingJobs, setLoadingJobs] = React.useState(true);

  // Form Fields
  const [selectedJobId, setSelectedJobId] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>(WORKER_CATEGORIES[0]);
  const [subject, setSubject] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [file, setFile] = React.useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submittedCase, setSubmittedCase] = React.useState<GrievanceCase | null>(null);

  // Fetch logged-in worker's jobs
  React.useEffect(() => {
    async function loadWorkerJobs() {
      setLoadingJobs(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const id = user?.id || "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
        const name = user?.user_metadata?.full_name || "Ravi Patel";
        setWorkerId(id);
        setWorkerName(name);

        const res = await fetch(`/api/bookings?workerId=${id}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.bookings)) {
            interface ApiBookingItem {
              id: string;
              bookingNumber?: string;
              booking_number?: string;
              serviceTitle?: string;
              service?: { title?: string };
              customerName?: string;
              customer?: { full_name?: string; phone?: string };
              customerPhone?: string;
              scheduledDate?: string;
              scheduled_start_at?: string;
              created_at?: string;
              federationId?: string;
              federation_id?: string;
              federationName?: string;
              federation?: { name?: string };
              totalAmount?: number;
              total_amount?: number;
              status?: string;
            }
            const mapped: WorkerJob[] = (json.bookings as ApiBookingItem[]).map((b) => ({
              id: b.id,
              bookingNumber: b.bookingNumber || b.booking_number || b.id.slice(0, 8),
              serviceTitle: b.serviceTitle || b.service?.title || "Trade Service",
              customerName: b.customerName || b.customer?.full_name || "Customer",
              customerPhone: b.customerPhone || b.customer?.phone,
              scheduledDate: b.scheduledDate || b.scheduled_start_at || b.created_at || new Date().toISOString(),
              federationId: b.federationId || b.federation_id,
              federationName: b.federationName || b.federation?.name || "Ahmedabad Labour Cooperative Federation",
              totalAmount: b.totalAmount || b.total_amount,
              status: b.status || "CONFIRMED",
            }));
            setJobs(mapped);
            if (mapped.length > 0) {
              setSelectedJobId(mapped[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load worker jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    }

    loadWorkerJobs();
  }, []);

  const selectedJob = React.useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) {
      setSubmitError("Please select the job related to this complaint.");
      return;
    }
    if (!subject.trim() || !description.trim()) {
      setSubmitError("Please provide both a subject summary and detailed description.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const evidenceUrls: string[] = [];

      // If user selected an evidence file, upload it
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("complaintId", crypto.randomUUID());
        const upRes = await fetch("/api/complaints/evidence", {
          method: "POST",
          body: formData,
        });
        if (upRes.ok) {
          const upJson = await upRes.json();
          if (upJson.url) evidenceUrls.push(upJson.url);
        }
      }

      const payload = {
        raisedBy: workerId,
        raisedByRole: "WORKER",
        raisedByName: workerName,
        bookingId: selectedJobId,
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority: "MEDIUM",
        evidenceUrls,
      };

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to submit complaint.");
      }

      setSubmittedCase(data.complaint);
    } catch (err: unknown) {
      setSubmitError((err as Error).message || "Failed to submit complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Confirmation Screen
  if (submittedCase) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Worker Complaint Submitted Successfully
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your complaint has been filed with the Federation. A conciliation officer will review the job records and follow up with you.
          </p>
        </div>

        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Tracking Reference</span>
              <span className="font-mono text-base font-extrabold text-emerald-800 dark:text-emerald-400">
                {submittedCase.complaintNumber}
              </span>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-xs">
              {submittedCase.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Category</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{submittedCase.category}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{submittedCase.targetName || "Customer"}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Subject</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{submittedCase.subject}</span>
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-3 pt-2">
          <Button
            onClick={() => router.push("/worker/grievances")}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
          >
            View My Complaints
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/worker/grievances")}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            Raise a Worker Complaint
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Report unpaid dues, customer misconduct, or hazardous conditions on your assigned jobs.
          </p>
        </div>
      </div>

      {loadingJobs ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading your service jobs...</div>
      ) : jobs.length === 0 ? (
        /* Empty state when worker has 0 jobs */
        <Card className="p-10 text-center border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              No Service Jobs Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              You must have an assigned or completed job to file a service complaint. Once you accept jobs and perform work, they will appear here.
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => router.push("/worker/schedule")}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              View Available Jobs / Schedule
            </Button>
          </div>
        </Card>
      ) : (
        /* Complaint Creation Form */
        <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Job Selector Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Select Job <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 font-medium shadow-sm"
              required
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  #{job.bookingNumber} — {job.serviceTitle} ({job.customerName}, {new Date(job.scheduledDate).toLocaleDateString("en-IN")})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Job Context Card */}
          {selectedJob && (
            <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900 pb-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  Booking #{selectedJob.bookingNumber}
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] font-semibold">
                  Status: {selectedJob.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Service</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedJob.serviceTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {selectedJob.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Job Date</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {new Date(selectedJob.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Federation</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    {selectedJob.federationName || "Ahmedabad Federation"}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Category Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Complaint Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 font-medium shadow-sm"
              required
            >
              {WORKER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Subject / Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Issue Summary / Subject <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="E.g., Customer refused agreed payment balance upon job completion"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-xs h-10 rounded-xl"
              required
            />
          </div>

          {/* Problem Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={5}
              placeholder="Provide complete facts: times, materials used, conversations, or reasons given by the customer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs rounded-xl resize-none"
              required
            />
            <p className="text-[11px] text-slate-400">
              Clear facts and accurate details will help the Federation conciliation officer expedite your resolution.
            </p>
          </div>

          {/* Optional Evidence File Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Attach Photo / Document (Optional)
            </label>
            <div className="flex items-center gap-2">
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>{file ? file.name : "Select JPG or PNG (Photos of work, receipts, or notes)"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                  }}
                />
              </label>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-rose-600 hover:text-rose-700 px-2"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/worker/grievances")}
              className="text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !selectedJobId || !subject.trim() || !description.trim()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 shadow-sm"
            >
              {isSubmitting ? "Submitting Complaint..." : "Submit Complaint to Federation"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
