"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ShieldCheck, Info } from "lucide-react";
import type { WorkerProfileDetails } from "../types";

export interface ProfileEditDialogsProps {
  profile: WorkerProfileDetails;
  isEditProfileOpen: boolean;
  isUpdateSkillsOpen: boolean;
  onCloseEditProfile: () => void;
  onCloseUpdateSkills: () => void;
  onSaveProfileSuccess?: (updated: Partial<WorkerProfileDetails>) => void;
}

export function ProfileEditDialogs({
  profile,
  isEditProfileOpen,
  isUpdateSkillsOpen,
  onCloseEditProfile,
  onCloseUpdateSkills,
  onSaveProfileSuccess,
}: ProfileEditDialogsProps) {
  const [name, setName] = React.useState(profile.name);
  const [phone, setPhone] = React.useState(profile.phone);
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>(profile.skills);
  const [newSkillInput, setNewSkillInput] = React.useState("");

  const availableSkillCatalog = [
    "Pipe Repair",
    "Leakage Repair",
    "Bathroom Plumbing",
    "Water Tank Maintenance",
    "Solar Water Heater Plumbing",
    "Drainage Clearing",
    "Kitchen Sink Trap Fitting",
    "Submersible Pump Installation",
  ];

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    if (newSkillInput.trim() && !selectedSkills.includes(newSkillInput.trim())) {
      setSelectedSkills([...selectedSkills, newSkillInput.trim()]);
      setNewSkillInput("");
    }
  };

  const handleSaveProfile = () => {
    onSaveProfileSuccess?.({ name, phone });
    onCloseEditProfile();
  };

  const handleSaveSkills = () => {
    onSaveProfileSuccess?.({ skills: selectedSkills });
    onCloseUpdateSkills();
  };

  return (
    <>
      {/* Edit Profile Dialog */}
      <Dialog
        isOpen={isEditProfileOpen}
        onClose={onCloseEditProfile}
        title="Edit Cooperative Worker Profile"
        description="Update contact details registered with Gujarat Labour Cooperative Federation."
        footer={
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={onCloseEditProfile}>
              Cancel
            </Button>
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white" onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-700/20 text-xs text-muted-foreground flex items-start space-x-2">
            <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Primary trade & institutional membership are verified by ABC Labour Cooperative Society. Contact society admin for trade changes.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Full Name (per Aadhaar)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Registered Phone Number</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Primary Cooperative Society</label>
            <Input value={profile.cooperativeName} disabled className="bg-muted text-muted-foreground" />
          </div>
        </div>
      </Dialog>

      {/* Update Skills Dialog */}
      <Dialog
        isOpen={isUpdateSkillsOpen}
        onClose={onCloseUpdateSkills}
        title="Update Certified Trade Skills"
        description="Select trade proficiencies recognized by the Cooperative Service Catalog."
        footer={
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={onCloseUpdateSkills}>
              Cancel
            </Button>
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white" onClick={handleSaveSkills}>
              Save Skills
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm">
          <div className="flex items-center text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 mr-1 text-emerald-600" />
            Selected skills are highlighted in customer search and instant dispatch matching.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {availableSkillCatalog.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleToggleSkill(skill)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-foreground"
                      : "border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="truncate mr-1">{skill}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-2 border-t">
            <label className="text-xs font-semibold text-foreground">Add Other Specialization</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Industrial Valve Testing"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomSkill()}
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddCustomSkill}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
