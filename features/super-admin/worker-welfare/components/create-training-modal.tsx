"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TrainingProgramItem } from "../types";

export interface CreateTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (program: TrainingProgramItem) => void;
}

export function CreateTrainingModal({ isOpen, onClose, onCreate }: CreateTrainingModalProps) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<"Safety" | "Technical" | "Digital" | "Soft Skills">("Safety");
  const [duration, setDuration] = React.useState("4 Weeks");
  const [instructor, setInstructor] = React.useState("");
  const [enrolledWorkers, setEnrolledWorkers] = React.useState("100");
  const [description, setDescription] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Training program name is required";
    if (!instructor.trim()) newErrors.instructor = "Instructor name is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onCreate({
        id: `trg-${Date.now()}`,
        name: name.trim(),
        category,
        enrolledWorkers: parseInt(enrolledWorkers, 10) || 100,
        duration: duration.trim(),
        instructor: instructor.trim(),
        status: "Active",
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
            Create Training Program
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Launch a new skill certification or safety training initiative across federations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 my-3 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Training Program Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Electrical Safety & High-Voltage Maintenance"
              className="text-xs h-9"
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-0.5">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as "Safety" | "Technical" | "Digital" | "Soft Skills")}
                className="w-full h-9 text-xs border border-border/80 rounded-md px-3 bg-background focus:ring-1 focus:ring-emerald-600"
              >
                <option value="Safety">Safety</option>
                <option value="Technical">Technical</option>
                <option value="Digital">Digital</option>
                <option value="Soft Skills">Soft Skills</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Duration</label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 4 Weeks"
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Instructor / Master Trainer <span className="text-rose-500">*</span>
              </label>
              <Input
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="e.g. Er. Rajesh Mehta"
                className="text-xs h-9"
              />
              {errors.instructor && <p className="text-[11px] text-rose-500 mt-0.5">{errors.instructor}</p>}
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Initial Enrolled Workers</label>
              <Input
                type="number"
                value={enrolledWorkers}
                onChange={(e) => setEnrolledWorkers(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Description & Modules</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Outline practical training objectives, certification criteria, and safety protocols..."
              className="w-full text-xs p-2 border border-border/80 rounded-md bg-background focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
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
              {isSubmitting ? "Creating..." : "Create Program"}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}
