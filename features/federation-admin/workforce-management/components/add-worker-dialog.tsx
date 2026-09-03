"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  UserPlus,
  AlertCircle,
  ShieldCheck,
  User,
  Briefcase,
  FileCheck2,
} from "lucide-react";
import {
  addWorkerSchema,
  AUTHORIZED_PROFESSIONS,
  IDENTITY_DOCUMENT_TYPES,
  type AddWorkerFormData,
} from "../schemas/add-worker-schema";
import type { AddWorkerPayload } from "../types";

interface AddWorkerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AddWorkerPayload) => Promise<boolean>;
  isSubmitting: boolean;
}

export function AddWorkerDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: AddWorkerDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddWorkerFormData>({
    resolver: zodResolver(addWorkerSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      phone: "",
      email: "",
      address: "",
      city: "Ahmedabad",
      state: "Gujarat",
      profession: "Electrician",
      skills: "",
      experienceYears: 3,
      hourlyRate: 350,
      identityDocumentType: "Aadhaar Card",
      identityDocumentNumber: "",
      professionalCertificate: "",
      skillCertificate: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        fullName: "",
        dateOfBirth: "",
        phone: "",
        email: "",
        address: "",
        city: "Ahmedabad",
        state: "Gujarat",
        profession: "Electrician",
        skills: "",
        experienceYears: 3,
        hourlyRate: 350,
        identityDocumentType: "Aadhaar Card",
        identityDocumentNumber: "",
        professionalCertificate: "",
        skillCertificate: "",
      });
    }
  }, [isOpen, reset]);

  const onFormSubmit = async (data: AddWorkerFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2 text-foreground">
          <UserPlus className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <span>Register New Cooperative Worker</span>
        </div>
      }
      description="Induct a skilled worker into your federation roster. Newly registered workers are established with Active account status."
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5 text-xs">
        {/* Statutory notice */}
        <div className="rounded-md bg-emerald-50/60 dark:bg-emerald-950/40 p-2.5 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 flex items-start space-x-2 text-[11px]">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>
            Worker federation ownership is locked to your authenticated federation context. Newly registered workers are initialized with <strong className="font-semibold">ACTIVE</strong> account status.
          </span>
        </div>

        {/* 1. PERSONAL INFORMATION */}
        <div className="space-y-3 p-3.5 rounded-lg border border-border/80 bg-muted/20">
          <div className="flex items-center space-x-1.5 font-semibold text-foreground text-xs border-b border-border/60 pb-1.5">
            <User className="h-3.5 w-3.5 text-blue-700" />
            <span>Personal Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Full Name */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block font-medium text-foreground">
                Full Legal Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Rameshchandra Solanki"
                {...register("fullName")}
                error={!!errors.fullName}
                className="h-8 text-xs"
              />
              {errors.fullName && (
                <p className="text-[10px] text-destructive flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.fullName.message}</span>
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-1">
              <label className="block font-medium text-foreground">
                Date of Birth <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                {...register("dateOfBirth")}
                error={!!errors.dateOfBirth}
                className="h-8 text-xs"
              />
              {errors.dateOfBirth && (
                <p className="text-[10px] text-destructive">{errors.dateOfBirth.message}</p>
              )}
            </div>

            {/* Contact Phone */}
            <div className="space-y-1">
              <label className="block font-medium text-foreground">
                Mobile Number <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="10-digit mobile (e.g. 9825144520)"
                {...register("phone")}
                error={!!errors.phone}
                className="h-8 text-xs"
              />
              {errors.phone && (
                <p className="text-[10px] text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block font-medium text-foreground">
                Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                placeholder="worker@example.com"
                {...register("email")}
                error={!!errors.email}
                className="h-8 text-xs"
              />
              {errors.email && (
                <p className="text-[10px] text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Residential Address */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block font-medium text-foreground">
                Residential Address <span className="text-destructive">*</span>
              </label>
              <Textarea
                rows={2}
                placeholder="Complete street address, colony, and landmark..."
                {...register("address")}
                error={!!errors.address}
                className="text-xs"
              />
              {errors.address && (
                <p className="text-[10px] text-destructive">{errors.address.message}</p>
              )}
            </div>

            {/* City & State */}
            <div className="space-y-1">
              <label className="block font-medium text-foreground">City</label>
              <Input {...register("city")} error={!!errors.city} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="block font-medium text-foreground">State</label>
              <Input {...register("state")} error={!!errors.state} className="h-8 text-xs" />
            </div>
          </div>
        </div>

        {/* 2. PROFESSIONAL INFORMATION */}
        <div className="space-y-3 p-3.5 rounded-lg border border-border/80 bg-muted/20">
          <div className="flex items-center space-x-1.5 font-semibold text-foreground text-xs border-b border-border/60 pb-1.5">
            <Briefcase className="h-3.5 w-3.5 text-emerald-700" />
            <span>Trade & Professional Competency</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Profession */}
            <div className="space-y-1">
              <label className="block font-medium text-foreground">
                Trade Specialty <span className="text-destructive">*</span>
              </label>
              <Select {...register("profession")} error={!!errors.profession} className="h-8 text-xs">
                {AUTHORIZED_PROFESSIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              {errors.profession && (
                <p className="text-[10px] text-destructive">{errors.profession.message}</p>
              )}
            </div>

            {/* Experience Years */}
            <div className="space-y-1">
              <label className="block font-medium text-foreground">
                Experience (Years) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={0}
                max={50}
                {...register("experienceYears")}
                error={!!errors.experienceYears}
                className="h-8 text-xs"
              />
              {errors.experienceYears && (
                <p className="text-[10px] text-destructive">{errors.experienceYears.message}</p>
              )}
            </div>

            {/* Authorized Hourly Rate */}
            <div className="space-y-1">
              <label className="block font-medium text-foreground">
                Hourly Tariff Rate (₹) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={100}
                step={10}
                {...register("hourlyRate")}
                error={!!errors.hourlyRate}
                className="h-8 text-xs"
              />
              {errors.hourlyRate && (
                <p className="text-[10px] text-destructive">{errors.hourlyRate.message}</p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block font-medium text-foreground">
                Skill Competencies <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Circuit wiring, Switchboard assembly, Earthing"
                {...register("skills")}
                error={!!errors.skills}
                className="h-8 text-xs"
              />
              {errors.skills && (
                <p className="text-[10px] text-destructive">{errors.skills.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* 3. DOCUMENTS */}
        <div className="space-y-3 p-3.5 rounded-lg border border-border/80 bg-muted/20">
          <div className="flex items-center space-x-1.5 font-semibold text-foreground text-xs border-b border-border/60 pb-1.5">
            <FileCheck2 className="h-3.5 w-3.5 text-purple-700" />
            <span>Document Credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Identity Document Type */}
            <div className="space-y-1">
              <label className="block font-medium text-foreground">
                Identity Document <span className="text-destructive">*</span>
              </label>
              <Select
                {...register("identityDocumentType")}
                error={!!errors.identityDocumentType}
                className="h-8 text-xs"
              >
                {IDENTITY_DOCUMENT_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>

            {/* Identity Document Number */}
            <div className="space-y-1">
              <label className="block font-medium text-foreground">
                Document Identification Number <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. 5482 9102 3841"
                {...register("identityDocumentNumber")}
                error={!!errors.identityDocumentNumber}
                className="h-8 text-xs"
              />
              {errors.identityDocumentNumber && (
                <p className="text-[10px] text-destructive">
                  {errors.identityDocumentNumber.message}
                </p>
              )}
            </div>

            {/* Professional Certificate */}
            <div className="space-y-1">
              <label className="block font-medium text-foreground">
                Professional Certificate <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Input
                placeholder="e.g. ITI National Trade Certificate #881"
                {...register("professionalCertificate")}
                className="h-8 text-xs"
              />
            </div>

            {/* Skill Certificate */}
            <div className="space-y-1">
              <label className="block font-medium text-foreground">
                Skill Certificate <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Input
                placeholder="e.g. Skill India NSDC Electrician Level 4"
                {...register("skillCertificate")}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-2 border-t border-border flex items-center justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="text-xs bg-emerald-800 hover:bg-emerald-900 text-white"
          >
            {isSubmitting ? "Registering Worker..." : "Add Worker to Federation"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
