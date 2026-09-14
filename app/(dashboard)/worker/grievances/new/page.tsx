"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  WORKER_COMPLAINT_CATEGORIES,
  type GrievanceCase,
} from "@/types/complaints/v2";
import { computeSmartTriage } from "@/features/complaints/services/complaint-service";

export default function NewWorkerGrievancePage() {
  const router = useRouter();

  // Form Fields
  const [category, setCategory] = React.useState<string>(WORKER_COMPLAINT_CATEGORIES[0]);
  const [subcategory, setSubcategory] = React.useState<string>("");
  const [subject, setSubject] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [evidenceUrlInput, setEvidenceUrlInput] = React.useState<string>("");
  const [evidenceUrls, setEvidenceUrls] = React.useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submittedCase, setSubmittedCase] = React.useState<GrievanceCase | null>(null);

  // Live Smart Triage calculation
  const triage = React.useMemo(() => {
    return computeSmartTriage(category, subcategory, description);
  }, [category, subcategory, description]);

  const handleAddEvidence = () => {
    if (evidenceUrlInput.trim() && !evidenceUrls.includes(evidenceUrlInput.trim())) {
      setEvidenceUrls((prev) => [...prev, evidenceUrlInput.trim()]);
      setEvidenceUrlInput("");
    }
  };

  const handleRemoveEvidence = (idx: number) => {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setSubmitError("Please provide a subject and detailed grievance statement.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const workerId = user?.id || "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
      const workerName = user?.user_metadata?.full_name || "Ravi Patel";

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raisedBy: workerId,
          raisedByRole: "WORKER",
          raisedByName: workerName,
          targetRole: "CUSTOMER",
          targetName: "Household Customer",
          federationId: "b765df3b-c418-4a15-b79f-3cbc09e475dc",
          category,
          subcategory: subcategory.trim() || undefined,
          subject: subject.trim(),
          description: description.trim(),
          priority: triage.suggestedPriority,
          evidenceUrls,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to submit grievance.");
      }

      setSubmittedCase(data.complaint);
    } catch (err: unknown) {
      setSubmitError((err as Error).message || "Failed to submit grievance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedCase) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Worker Grievance Registered
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your grievance report has been securely registered with Ahmedabad Labour Cooperative Federation.
          </p>
        </div>

        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Grievance Reference</span>
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
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Priority Level</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{submittedCase.priority}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Queue</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {submittedCase.suggestedQueue || "Federation Grievance Conciliation"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Expected Action</span>
              <span className="text-slate-600 dark:text-slate-400">
                Cooperative officer will contact you within 24 hours.
              </span>
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => router.push("/worker/grievances")}
            className="text-xs font-semibold"
          >
            Back to Grievances
          </Button>
          <Button
            onClick={() => router.push(`/worker/grievances/${submittedCase.id}`)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
          >
            View Grievance File
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Raise a Worker Grievance
          </h1>
          <p className="text-xs text-slate-500">
            Submit a formal dispute or report workplace safety, unfair reviews, or non-payment.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Grievance Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-medium"
              >
                {WORKER_COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Subcategory (Optional)
              </label>
              <Input
                placeholder="e.g. Unsafe wiring on site, abusive customer..."
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="text-xs h-10"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject Summary *
            </label>
            <Input
              placeholder="e.g. Customer refused to pay agreed materials invoice..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-xs h-10 font-semibold"
              required
            />
          </div>

          {/* Statement */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Detailed Statement *
            </label>
            <Textarea
              placeholder="State what occurred, work completed, customer interactions, or hazardous conditions encountered..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="text-xs leading-relaxed"
              required
            />
          </div>

          {/* Smart Triage */}
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                Cooperative Protection Evaluation:
              </span>
              <Badge className="bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-extrabold text-[10px]">
                Priority: {triage.suggestedPriority}
              </Badge>
            </div>
            <p className="text-blue-800 dark:text-blue-300 text-[11px]">
              {triage.triageReason} Queue: <strong>{triage.suggestedQueue}</strong>
            </p>
          </div>

          {/* Evidence Attachments */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Supporting Photos / Work Site Evidence
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter image/document URL..."
                value={evidenceUrlInput}
                onChange={(e) => setEvidenceUrlInput(e.target.value)}
                className="text-xs h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEvidence}
                className="text-xs font-semibold shrink-0"
              >
                Add File
              </Button>
            </div>

            {evidenceUrls.length > 0 && (
              <div className="space-y-1 pt-1">
                {evidenceUrls.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <span className="truncate max-w-sm font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {url}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(i)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 shadow-sm"
          >
            {isSubmitting ? "Submitting..." : "Submit Grievance"}
          </Button>
        </div>
      </form>
    </div>
  );
}
