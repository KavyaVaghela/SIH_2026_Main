"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Building2, CheckCircle2 } from "lucide-react";
import type { AddSocietyFormPayload, SocietyStatus } from "../types";

interface AddSocietyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AddSocietyFormPayload) => Promise<boolean>;
  isSubmitting: boolean;
}

export function AddSocietyDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: AddSocietyDialogProps) {
  const [formData, setFormData] = React.useState<AddSocietyFormPayload>({
    name: "",
    code: "",
    registrationNumber: "",
    city: "Mumbai",
    state: "Maharashtra",
    address: "",
    adminName: "",
    contactEmail: "",
    contactPhone: "",
    serviceRegion: "",
    status: "ACTIVE",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleChange = (field: keyof AddSocietyFormPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Society Name is required";
    if (!formData.registrationNumber.trim()) errs.registrationNumber = "Registration Number is required";
    if (!formData.city.trim()) errs.city = "City is required";
    if (!formData.state.trim()) errs.state = "State is required";
    if (!formData.address.trim()) errs.address = "Address is required";
    if (!formData.adminName.trim()) errs.adminName = "Admin Name is required";
    if (!formData.contactEmail.trim() || !formData.contactEmail.includes("@")) {
      errs.contactEmail = "Valid email is required";
    }
    if (!formData.contactPhone.trim() || formData.contactPhone.length < 10) {
      errs.contactPhone = "Valid contact phone is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Auto-generate code if empty
    let code = formData.code.trim();
    if (!code) {
      code = formData.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 5) + `-${Math.floor(10 + Math.random() * 90)}`;
    }

    const success = await onSubmit({ ...formData, code });
    if (success) {
      setFormData({
        name: "",
        code: "",
        registrationNumber: "",
        city: "Mumbai",
        state: "Maharashtra",
        address: "",
        adminName: "",
        contactEmail: "",
        contactPhone: "",
        serviceRegion: "",
        status: "ACTIVE",
      });
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2 text-foreground">
          <Building2 className="h-5 w-5 text-emerald-700" />
          <span>Register New Cooperative Society</span>
        </div>
      }
      description="Enter official society registration data to onboard a primary worker federation."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Society Name <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. Navi Mumbai Electricians Co-op"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={!!errors.name}
              className="h-9 text-xs"
            />
            {errors.name && <p className="text-[10px] text-rose-500 mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Registration Number <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. REG-MH-2026-088"
              value={formData.registrationNumber}
              onChange={(e) => handleChange("registrationNumber", e.target.value)}
              error={!!errors.registrationNumber}
              className="h-9 text-xs"
            />
            {errors.registrationNumber && (
              <p className="text-[10px] text-rose-500 mt-0.5">{errors.registrationNumber}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Society Code (Optional)
            </label>
            <Input
              placeholder="Auto-generated if empty"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              City <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              error={!!errors.city}
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              State <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. Maharashtra"
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              error={!!errors.state}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">
            Office Registered Address <span className="text-rose-500">*</span>
          </label>
          <Textarea
            placeholder="Complete office address..."
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            rows={2}
            className="text-xs"
          />
          {errors.address && <p className="text-[10px] text-rose-500 mt-0.5">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Admin Name <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. Rajesh Sharma"
              value={formData.adminName}
              onChange={(e) => handleChange("adminName", e.target.value)}
              error={!!errors.adminName}
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Contact Email <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="admin@coop.org"
              value={formData.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              error={!!errors.contactEmail}
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Contact Phone <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="+91 98000 00000"
              value={formData.contactPhone}
              onChange={(e) => handleChange("contactPhone", e.target.value)}
              error={!!errors.contactPhone}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Service Region Corridor
            </label>
            <Input
              placeholder="e.g. Central Suburbs Zone 1"
              value={formData.serviceRegion}
              onChange={(e) => handleChange("serviceRegion", e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Initial Registration Status
            </label>
            <Select
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value as SocietyStatus)}
              className="h-9 text-xs"
            >
              <option value="ACTIVE">Active & Verified</option>
              <option value="PENDING_VERIFICATION">Pending Audit Verification</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="h-9 text-xs bg-emerald-800 hover:bg-emerald-900 text-white font-semibold"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Register Society
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
