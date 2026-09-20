"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { WelfareProgramItem, ProgramCategory } from "../types";

export interface ViewEditProgramModalProps {
  program: WelfareProgramItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: WelfareProgramItem) => void;
  onDeactivate: (programId: string) => void;
}

export function ViewEditProgramModal({
  program,
  isOpen,
  onClose,
  onUpdate,
  onDeactivate,
}: ViewEditProgramModalProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = React.useState(false);

  // Form states for edit mode
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<ProgramCategory>("Pension");
  const [description, setDescription] = React.useState("");
  const [eligibilityCriteria, setEligibilityCriteria] = React.useState("");
  const [status, setStatus] = React.useState<"Active" | "Inactive" | "Under Review">("Active");

  React.useEffect(() => {
    if (program) {
      setName(program.name);
      setCategory(program.category);
      setDescription(program.description || "");
      setEligibilityCriteria(program.eligibilityCriteria || "");
      setStatus(program.status);
      setIsEditing(false);
      setShowDeactivateConfirm(false);
    }
  }, [program]);

  if (!program) return null;

  const coveragePct = Math.round((program.coveredWorkers / program.eligibleWorkers) * 100) || 0;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...program,
      name,
      category,
      description,
      eligibilityCriteria,
      status,
    });
    setIsEditing(false);
  };

  const handleDeactivate = () => {
    onDeactivate(program.id);
    setShowDeactivateConfirm(false);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto p-1">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-lg font-bold text-foreground">
              {isEditing ? "Edit Welfare Program" : program.name}
            </DialogTitle>
            <Badge
              variant="outline"
              className={
                program.status === "Active"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300/60"
                  : "bg-slate-100 text-slate-700 border-slate-300"
              }
            >
              {program.status}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Category: <span className="font-semibold text-foreground">{program.category}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Deactivation Confirmation Modal Box Overlay */}
        {showDeactivateConfirm ? (
          <div className="my-4 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-center space-y-3">
            <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">
              Deactivate Welfare Program?
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400">
              Workers will no longer see this program as an active welfare initiative across federations.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeactivateConfirm(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeactivate}
                className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Deactivate
              </Button>
            </div>
          </div>
        ) : isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSaveEdit} className="space-y-3 my-3 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">Program Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProgramCategory)}
                  className="w-full h-9 text-xs border border-border/80 rounded-md px-3 bg-background"
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
                <label className="font-semibold text-foreground block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "Active" | "Inactive" | "Under Review")}
                  className="w-full h-9 text-xs border border-border/80 rounded-md px-3 bg-background"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-2 border border-border/80 rounded-md bg-background focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Eligibility Criteria</label>
              <Input
                value={eligibilityCriteria}
                onChange={(e) => setEligibilityCriteria(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Read-only Detailed View */
          <div className="space-y-4 my-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/60">
              <span className="font-semibold text-foreground block mb-1">Description:</span>
              <p className="text-muted-foreground leading-relaxed">
                {program.description || "No description specified."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg border border-border/60">
                <span className="text-muted-foreground block text-[11px]">Eligibility:</span>
                <span className="font-semibold text-foreground">
                  {program.eligibilityCriteria || "All registered craftsmen"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-border/60">
                <span className="text-muted-foreground block text-[11px]">Participating Federations:</span>
                <span className="font-semibold text-foreground">{program.federationsCount} Federations</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/50">
                <div className="text-sm font-bold text-foreground">{program.eligibleWorkers.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground font-semibold">Eligible Workers</div>
              </div>

              <div className="p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/50">
                <div className="text-sm font-bold text-emerald-600">{program.coveredWorkers.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground font-semibold">Workers Covered</div>
              </div>

              <div className="p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/50">
                <div className="text-sm font-bold text-emerald-700">{coveragePct}%</div>
                <div className="text-[10px] text-muted-foreground font-semibold">Coverage %</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-muted-foreground">
              <div>Start Date: <span className="font-semibold text-foreground">{program.startDate || "2024-01-01"}</span></div>
              <div>End Date: <span className="font-semibold text-foreground">{program.endDate || "2029-12-31"}</span></div>
            </div>

            <DialogFooter className="pt-2 flex justify-between items-center sm:justify-end gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeactivateConfirm(true)}
                className="text-xs h-8"
              >
                Deactivate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs h-8 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                Edit Program
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs h-8"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </div>
    </Dialog>
  );
}
