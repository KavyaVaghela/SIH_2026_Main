"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WelfareProgramItem, ProgramCategory } from "../types";

export interface AddProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (program: WelfareProgramItem) => void;
}

export function AddProgramModal({ isOpen, onClose, onSave }: AddProgramModalProps) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<ProgramCategory>("Pension");
  const [description, setDescription] = React.useState("");
  const [eligibilityCriteria, setEligibilityCriteria] = React.useState("");
  const [eligibleWorkerGroups, setEligibleWorkerGroups] = React.useState("");
  const [requiredDocuments, setRequiredDocuments] = React.useState("");
  const [eligibleWorkers, setEligibleWorkers] = React.useState("5000");
  const [coveredWorkers, setCoveredWorkers] = React.useState("2500");
  const [federationsCount, setFederationsCount] = React.useState("15");
  const [status, setStatus] = React.useState<"Active" | "Inactive" | "Under Review">("Active");
  const [startDate, setStartDate] = React.useState("2024-01-01");
  const [endDate, setEndDate] = React.useState("2029-12-31");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Program name is required";
    if (!description.trim()) newErrors.description = "Description is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSave({
        id: `prog-${Date.now()}`,
        name: name.trim(),
        category,
        federationsCount: parseInt(federationsCount, 10) || 10,
        eligibleWorkers: parseInt(eligibleWorkers, 10) || 5000,
        coveredWorkers: parseInt(coveredWorkers, 10) || 2500,
        status,
        description: description.trim(),
        eligibilityCriteria: eligibilityCriteria.trim() || "Standard eligibility",
        eligibleWorkerGroups: eligibleWorkerGroups.trim() || "All trade artisans",
        requiredDocuments: requiredDocuments.trim() || "Aadhaar Card",
        startDate,
        endDate,
      });
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto p-1">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Add Welfare Program
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create a new worker welfare initiative available across federations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 my-3">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Program Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pradhan Mantri Shram Yogi Maandhan"
              className="text-xs h-9"
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-0.5">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProgramCategory)}
                className="w-full h-9 text-xs border border-border/80 rounded-md px-3 bg-background focus:ring-1 focus:ring-emerald-600"
              >
                <option value="Pension">Pension</option>
                <option value="Insurance">Insurance</option>
                <option value="Health">Health</option>
                <option value="Skill Development">Skill Development</option>
                <option value="Safety">Safety</option>
                <option value="Social Welfare">Social Welfare</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Inactive" | "Under Review")}
                className="w-full h-9 text-xs border border-border/80 rounded-md px-3 bg-background focus:ring-1 focus:ring-emerald-600"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Under Review">Under Review</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief summary of scheme benefits and protection terms..."
              className="w-full text-xs p-2 border border-border/80 rounded-md bg-background focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
            {errors.description && <p className="text-[11px] text-rose-500 mt-0.5">{errors.description}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Eligibility Criteria
            </label>
            <Input
              value={eligibilityCriteria}
              onChange={(e) => setEligibilityCriteria(e.target.value)}
              placeholder="e.g. Age 18-40 years, Monthly income <= Rs. 15,000"
              className="text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Eligible Worker Groups
              </label>
              <Input
                value={eligibleWorkerGroups}
                onChange={(e) => setEligibleWorkerGroups(e.target.value)}
                placeholder="e.g. All unregistered gig craftsmen"
                className="text-xs h-9"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Required Documents
              </label>
              <Input
                value={requiredDocuments}
                onChange={(e) => setRequiredDocuments(e.target.value)}
                placeholder="e.g. Aadhaar Card, Savings Account"
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Applicable Federations
              </label>
              <Input
                type="number"
                value={federationsCount}
                onChange={(e) => setFederationsCount(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Eligible Workers
              </label>
              <Input
                type="number"
                value={eligibleWorkers}
                onChange={(e) => setEligibleWorkers(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Workers Covered
              </label>
              <Input
                type="number"
                value={coveredWorkers}
                onChange={(e) => setCoveredWorkers(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isSubmitting ? "Saving Program..." : "Save Program"}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}
