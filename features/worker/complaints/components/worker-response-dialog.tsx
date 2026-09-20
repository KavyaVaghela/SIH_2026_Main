"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, AlertCircle, Upload, CheckCircle2 } from "lucide-react";
import type { GrievanceCase } from "@/types/complaints/v2";

interface WorkerResponseDialogProps {
  complaint: GrievanceCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerId: string;
  workerName: string;
  onSuccess: () => void;
}

export function WorkerResponseDialog({
  complaint,
  open,
  onOpenChange,
  workerId,
  workerName,
  onSuccess,
}: WorkerResponseDialogProps) {
  const [statement, setStatement] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setStatement("");
      setFile(null);
      setError(null);
    }
  }, [open]);

  if (!complaint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) {
      setError("Please write your statement explaining what occurred.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let evidenceUrls: string[] = [];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("complaintId", complaint.id);
        const upRes = await fetch("/api/complaints/evidence", {
          method: "POST",
          body: formData,
        });
        if (upRes.ok) {
          const upJson = await upRes.json();
          if (upJson.url) evidenceUrls.push(upJson.url);
        }
      }

      const res = await fetch(`/api/complaints/${complaint.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RESPONSE_SUBMISSION",
          message: statement.trim(),
          evidenceUrls,
          actorId: workerId,
          actorRole: "WORKER",
          actorName: workerName || "Worker",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to submit response.");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to submit response.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Submit Official Worker Response
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Complaint Ref: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{complaint.complaintNumber}</span>
          </DialogDescription>
        </DialogHeader>

        {complaint.responseRequests?.prompt && (
          <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-xs space-y-1">
            <span className="font-bold text-purple-900 dark:text-purple-200 block">
              Federation Inquiry Prompt:
            </span>
            <p className="text-purple-800 dark:text-purple-300 italic">
              &ldquo;{complaint.responseRequests.prompt}&rdquo;
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Your Perspective / Explanation <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={4}
              placeholder="Explain what happened during this service job, the work completed, or any client interactions..."
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className="text-xs resize-none"
              required
            />
            <p className="text-[11px] text-slate-400">
              Note: You receive one official response opportunity. Your statement will be preserved permanently for Federation arbitration.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Supporting Photo / Evidence (Optional)
            </label>
            <div className="flex items-center gap-2">
              <label className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>{file ? file.name : "Select JPG or PNG photo (Max 10MB)"}</span>
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

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !statement.trim()}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? "Submitting..." : "Submit Response"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
