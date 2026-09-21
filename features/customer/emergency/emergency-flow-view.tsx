"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Flame,
  Zap,
  Droplets,
  Key,
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  Users,
  MapPin,
  Camera,
  Upload,
  Clock,
  ArrowLeft,
  X,
  Radio,
} from "lucide-react";
import {
  PREDEFINED_EMERGENCY_CATEGORIES,
  PredefinedEmergencyCategory,
  PredefinedEmergencyType,
} from "@/features/emergency/constants/emergency-matrix";
import {
  emergencyIncidentService,
  EmergencyIncident,
} from "@/features/emergency/services/emergency-incident-service";
import { uploadFileToStorage } from "@/lib/storage/upload";

export function EmergencyFlowView() {
  const router = useRouter();

  // Selection states
  const [selectedCategory, setSelectedCategory] = React.useState<PredefinedEmergencyCategory>(
    PREDEFINED_EMERGENCY_CATEGORIES[0]
  );
  const [selectedType, setSelectedType] = React.useState<PredefinedEmergencyType>(
    PREDEFINED_EMERGENCY_CATEGORIES[0].types[0]
  );

  // Form input states
  const [location, setLocation] = React.useState<string>(
    "Block C, Shivalik Residency, Satellite, Ahmedabad, Gujarat"
  );
  const [description, setDescription] = React.useState<string>("");
  const [approxPeople, setApproxPeople] = React.useState<number>(10);
  const [hasImmediateDanger, setHasImmediateDanger] = React.useState<boolean>(true);
  const [dangerDetails, setDangerDetails] = React.useState<string>(
    "Water cascading rapidly down common elevator shaft and main electrical riser panel."
  );

  // Photo upload states
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState<boolean>(false);
  const [photoUploadError, setPhotoUploadError] = React.useState<string | null>(null);

  // Submission states
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [reportedIncident, setReportedIncident] = React.useState<EmergencyIncident | null>(null);

  // Switch category updates selected type
  const handleCategoryChange = (cat: PredefinedEmergencyCategory) => {
    setSelectedCategory(cat);
    setSelectedType(cat.types[0]);
  };

  // Handle Photo Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setPhotoUploadError(null);

    try {
      const result = await uploadFileToStorage(file, "avatars");
      if (result.success && result.url) {
        setPhotoUrl(result.url);
      } else {
        setPhotoUploadError(result.error || "Failed to upload photo evidence.");
      }
    } catch {
      setPhotoUploadError("Photo upload failed. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Submit Emergency Incident (NO NORMAL BOOKING IS CREATED)
  const handleSubmitEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const incident = await emergencyIncidentService.reportEmergency({
        categoryName: selectedCategory.name,
        emergencyType: selectedType.name,
        location: location.trim(),
        description: description.trim() || selectedType.description,
        evidencePhotos: photoUrl ? [photoUrl] : [],
        photoUrl: photoUrl || undefined,
        approxPeopleAffected: approxPeople,
        immediateDanger: hasImmediateDanger,
        dangerDetails: hasImmediateDanger ? dangerDetails.trim() : undefined,
        severity: selectedType.defaultSeverity,
      });

      setReportedIncident(incident);
    } catch (err: unknown) {
      setSubmitError((err as Error)?.message || "Failed to report emergency incident.");
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "droplets":
        return Droplets;
      case "zap":
        return Zap;
      case "flame":
        return Flame;
      case "key":
        return Key;
      case "shield-alert":
        return ShieldAlert;
      case "alert-triangle":
        return AlertTriangle;
      default:
        return AlertOctagon;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <PageHeader
        title="Emergency Incident Reporting"
        description="Kaushalya Setu Rapid Emergency Services. Report community hazards and structural emergencies for cooperative response team mobilization."
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Emergency Services", href: "/customer/emergency" },
          { label: "Report Emergency" },
        ]}
      />

      {reportedIncident ? (
        /* ==========================================================
           8. CUSTOMER INCIDENT CONFIRMATION SCREEN
           ========================================================== */
        <Card className="bg-white dark:bg-slate-900 border-2 border-emerald-500/80 dark:border-emerald-600/80 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded tracking-wider">
                  Incident Logged
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(reportedIncident.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                🚨 Emergency Reported
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Your emergency incident has been recorded in the cooperative emergency registry.
              </p>
            </div>
          </div>

          {/* Primary Incident Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block mb-0.5">
                Emergency ID
              </span>
              <div className="font-mono text-base md:text-lg font-black text-emerald-700 dark:text-emerald-400 select-all">
                {reportedIncident.emergencyId}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block mb-0.5">
                Incident Status
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Awaiting Response
              </div>
            </div>
          </div>

          {/* Incident Details Summary */}
          <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Category:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {reportedIncident.categoryName}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Emergency Type:</span>
              <span className="font-black text-slate-900 dark:text-slate-100">
                {reportedIncident.emergencyType}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Location:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-right max-w-sm">
                {reportedIncident.location}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Affected Population:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                ~{reportedIncident.approxPeopleAffected} people affected
              </span>
            </div>
            {reportedIncident.immediateDanger && (
              <div className="py-2">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Immediate Hazard Alert:
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium pl-5">
                  {reportedIncident.dangerDetails || "Active life/property hazard reported."}
                </p>
              </div>
            )}
            {reportedIncident.evidencePhotos && reportedIncident.evidencePhotos.length > 0 && (
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Attached Evidence:</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  {reportedIncident.evidencePhotos.length} photo attached
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/customer")}
              className="text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Return to Customer Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => router.push(`/customer/emergency/${reportedIncident.id}`)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 shadow-md shadow-rose-600/20"
              >
                Track Emergency Live →
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/customer")}
                className="text-xs px-4"
              >
                Done
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* ==========================================================
           5. CUSTOMER REPORT EMERGENCY FORM
           ========================================================== */
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 md:p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Report Emergency Incident
              </h2>
              <p className="text-xs text-slate-500">
                Select predefined incident category and specify hazard parameters to trigger cooperative response protocols.
              </p>
            </div>
          </div>

          {submitError && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 p-3 rounded-lg text-xs text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitEmergency} className="space-y-6">
            {/* 1. Predefined Category Selection */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">
                1. Select Emergency Infrastructure Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {PREDEFINED_EMERGENCY_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory.name === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                        isSelected
                          ? "border-rose-600 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 font-bold ring-2 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="truncate">{cat.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Predefined Emergency Type Selection (Deterministic) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">
                  2. Select Specific Incident Type
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Category: <strong>{selectedCategory.name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedCategory.types.map((type) => {
                  const Icon = getIcon(type.iconName);
                  const isSelected = selectedType.id === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-rose-600 bg-rose-50/90 dark:bg-rose-950/50 ring-2 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Icon
                            className={`w-5 h-5 ${
                              isSelected ? "text-rose-600 dark:text-rose-400" : "text-slate-500"
                            }`}
                          />
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 font-bold uppercase ${
                              type.defaultSeverity === "CRITICAL"
                                ? "border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40"
                                : "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40"
                            }`}
                          >
                            {type.defaultSeverity}
                          </Badge>
                        </div>
                        <h4
                          className={`text-xs font-bold ${
                            isSelected ? "text-rose-950 dark:text-rose-100" : "text-slate-900 dark:text-slate-100"
                          } mb-1`}
                        >
                          {type.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {type.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Incident Location & Problem Description */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">
                  3. Emergency Location / Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter full address, society name, and flat/wing details..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">
                  4. Incident Description & Immediate Observations
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`Describe the situation (e.g. ${selectedType.description})...`}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>

            {/* 4. Population Affected & Immediate Danger Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Users className="w-4 h-4 text-slate-500" />
                  Approx. People Affected
                </div>
                <div className="flex items-center gap-2">
                  {[1, 5, 20, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setApproxPeople(num)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        approxPeople === num
                          ? "bg-rose-600 text-white border-rose-600"
                          : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                      }`}
                    >
                      {num === 1 ? "1" : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasImmediateDanger}
                    onChange={(e) => setHasImmediateDanger(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
                    Immediate Life / Property Danger Present
                  </span>
                </label>

                {hasImmediateDanger && (
                  <input
                    type="text"
                    value={dangerDetails}
                    onChange={(e) => setDangerDetails(e.target.value)}
                    placeholder="Specify hazard (e.g. live sparks, flooding electrical panel)"
                    className="w-full p-2 rounded-lg border border-rose-300 dark:border-rose-900 text-[11px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  />
                )}
              </div>
            </div>

            {/* 5. Photo / Evidence Upload */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">
                5. Photo Evidence (Optional)
              </label>

              {photoUrl ? (
                <div className="relative inline-block border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Evidence Preview"
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="absolute top-3 right-3 bg-slate-900/80 text-white rounded-full p-1 hover:bg-slate-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-slate-500 font-medium block mt-1 text-center">
                    Photo attached
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer border border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                    <Camera className="w-4 h-4 text-rose-600" />
                    <span>{isUploadingPhoto ? "Uploading..." : "Attach photo from camera / file"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoSelect}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </label>
                  {isUploadingPhoto && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5 animate-bounce text-rose-600" />
                      Uploading to secure storage...
                    </span>
                  )}
                  {photoUploadError && (
                    <span className="text-xs text-rose-600 font-medium">{photoUploadError}</span>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm py-6 shadow-lg shadow-rose-600/20 gap-2.5 rounded-xl"
            >
              <AlertTriangle className="w-5 h-5" />
              {submitting ? "Transmitting Emergency Incident..." : "🚨 Report Emergency"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
