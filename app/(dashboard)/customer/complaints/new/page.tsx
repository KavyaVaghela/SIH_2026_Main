"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  UploadCloud,
  FileImage,
  Trash2,
  RefreshCw,
  X,
} from "lucide-react";
import { validateComplaintEvidenceFile } from "@/lib/storage/complaint-evidence";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  CUSTOMER_COMPLAINT_CATEGORIES,
  type GrievanceCase,
} from "@/types/complaints/v2";
import { computeSmartTriage } from "@/features/complaints/services/complaint-service";

interface CustomerBookingData {
  id: string;
  booking_number: string;
  status: string;
  total_amount?: number;
  scheduled_start_at?: string;
  federation_id?: string;
  services?: { title: string } | null;
  workers?: { id: string; profile_id: string; profiles?: { full_name: string } | null } | null;
  federations?: { name: string } | null;
}

export interface EligibleWorker {
  profileId: string;
  workerId: string;
  fullName: string;
  serviceTitle: string;
  latestBookingNumber: string;
  bookingIds: string[];
}

function NewCustomerComplaintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillBookingId = searchParams.get("bookingId");

  // Dynamic booking and worker data
  const [customerBookings, setCustomerBookings] = React.useState<CustomerBookingData[]>([]);
  const [eligibleWorkers, setEligibleWorkers] = React.useState<EligibleWorker[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  // Form Fields
  const [category, setCategory] = React.useState<string>(CUSTOMER_COMPLAINT_CATEGORIES[0]);
  const [subcategory, setSubcategory] = React.useState<string>("");
  const [selectedParty, setSelectedParty] = React.useState<string>(""); // Worker profileId or "OTHER"
  const [selectedBookingId, setSelectedBookingId] = React.useState<string>(prefillBookingId || "NONE");
  const [subject, setSubject] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = React.useState<string | null>(null);
  const [fileValidationError, setFileValidationError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Clean up object URL when component unmounts or preview changes
  React.useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submittedCase, setSubmittedCase] = React.useState<GrievanceCase | null>(null);

  // Load customer's real bookings and derive eligible workers
  React.useEffect(() => {
    async function loadCustomerContext() {
      setIsLoadingData(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const customerId = user?.id || "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";

        // Query real bookings with joined workers and profile names
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            booking_number,
            status,
            total_amount,
            scheduled_start_at,
            federation_id,
            worker_id,
            services (title),
            workers (
              id,
              profile_id,
              profiles:profile_id (full_name)
            ),
            federations (name)
          `)
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          const bookings = data as unknown as CustomerBookingData[];
          setCustomerBookings(bookings);

          // Extract deduplicated list of eligible workers who actually worked on customer's bookings
          const workerMap = new Map<string, EligibleWorker>();

          bookings.forEach((b) => {
            if (b.workers?.profile_id && b.workers?.id) {
              const pId = b.workers.profile_id;
              const wName = b.workers.profiles?.full_name || "Cooperative Worker";
              const sTitle = b.services?.title || "Trade Service";

              if (!workerMap.has(pId)) {
                workerMap.set(pId, {
                  profileId: pId,
                  workerId: b.workers.id,
                  fullName: wName,
                  serviceTitle: sTitle,
                  latestBookingNumber: b.booking_number,
                  bookingIds: [b.id],
                });
              } else {
                const existing = workerMap.get(pId)!;
                if (!existing.bookingIds.includes(b.id)) {
                  existing.bookingIds.push(b.id);
                }
              }
            }
          });

          const workersList = Array.from(workerMap.values());
          setEligibleWorkers(workersList);

          // Handle prefill booking if provided in URL
          if (prefillBookingId) {
            const matched = bookings.find((b) => b.id === prefillBookingId);
            if (matched) {
              setSelectedBookingId(matched.id);
              if (matched.workers?.profile_id) {
                setSelectedParty(matched.workers.profile_id);
                const sTitle = matched.services?.title || "Service";
                const wName = matched.workers?.profiles?.full_name || "Worker";
                setSubject(`Issue regarding ${sTitle} by ${wName}`);
              } else {
                setSelectedParty("OTHER");
                setSubject(`Issue regarding ${matched.services?.title || "Service"} (Booking #${matched.booking_number})`);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Could not load customer complaint context:", err);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadCustomerContext();
  }, [prefillBookingId]);

  // Bi-directional handler: When user selects a Person / Party
  const handleSelectParty = (partyVal: string) => {
    setSelectedParty(partyVal);

    if (partyVal === "OTHER") {
      // If "OTHER", any booking or no booking can be associated
      if (selectedBookingId !== "NONE") {
        const bk = customerBookings.find((b) => b.id === selectedBookingId);
        if (bk && !subject) {
          setSubject(`Service issue regarding booking #${bk.booking_number}`);
        }
      }
    } else {
      // Find selected worker
      const worker = eligibleWorkers.find((w) => w.profileId === partyVal);
      if (worker) {
        // Constrain selected booking to one of this worker's bookings
        if (!worker.bookingIds.includes(selectedBookingId)) {
          setSelectedBookingId(worker.bookingIds[0] || "NONE");
        }
        // Auto-suggest subject if empty or generic
        if (!subject || subject.startsWith("Issue regarding") || subject.startsWith("Service issue")) {
          setSubject(`Issue regarding ${worker.serviceTitle} by ${worker.fullName}`);
        }
      }
    }
  };

  // Bi-directional handler: When user selects an Associated Booking
  const handleSelectBooking = (bookingIdVal: string) => {
    setSelectedBookingId(bookingIdVal);

    if (bookingIdVal === "NONE") {
      // No specific booking
      return;
    }

    const matched = customerBookings.find((b) => b.id === bookingIdVal);
    if (matched) {
      if (matched.workers?.profile_id) {
        // Auto-select the worker assigned to this booking
        setSelectedParty(matched.workers.profile_id);
        const wName = matched.workers?.profiles?.full_name || "Worker";
        const sTitle = matched.services?.title || "Service";
        if (!subject || subject.startsWith("Issue regarding") || subject.startsWith("Service issue")) {
          setSubject(`Issue regarding ${sTitle} by ${wName}`);
        }
      } else {
        // Booking without assigned worker -> default to OTHER
        setSelectedParty("OTHER");
        if (!subject || subject.startsWith("Issue regarding") || subject.startsWith("Service issue")) {
          setSubject(`Service issue regarding booking #${matched.booking_number}`);
        }
      }
    }
  };

  // Filter bookings based on selected worker (if a worker is selected)
  const selectableBookings = React.useMemo(() => {
    if (!selectedParty || selectedParty === "OTHER") {
      return customerBookings;
    }
    const worker = eligibleWorkers.find((w) => w.profileId === selectedParty);
    if (!worker) return customerBookings;
    return customerBookings.filter((b) => worker.bookingIds.includes(b.id));
  }, [customerBookings, eligibleWorkers, selectedParty]);

  // Live Smart Triage calculation
  const triage = React.useMemo(() => {
    return computeSmartTriage(category, subcategory, description);
  }, [category, subcategory, description]);

  const effectivePriority = triage.suggestedPriority;

  const handleFileChange = (file: File | null) => {
    setFileValidationError(null);
    if (!file) {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setSelectedFile(null);
      setFilePreviewUrl(null);
      return;
    }

    const validation = validateComplaintEvidenceFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!validation.valid) {
      setFileValidationError(validation.error || "Invalid file selected.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setFileValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParty) {
      setSubmitError("Please select who this complaint is about.");
      return;
    }

    if (!subject.trim() || !description.trim()) {
      setSubmitError("Please provide a subject summary and detailed grievance statement.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const customerId = user?.id || "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
      const customerName = user?.user_metadata?.full_name || "Prince Patel";

      // Resolve target based on selected party
      const isWorker = selectedParty !== "OTHER";
      const selectedWorker = isWorker ? eligibleWorkers.find((w) => w.profileId === selectedParty) : null;

      const targetProfileId = isWorker ? selectedWorker?.profileId : undefined;
      const targetWorkerId = isWorker ? selectedWorker?.workerId : undefined;
      const targetName = isWorker ? selectedWorker?.fullName : "General Service / Operations";
      const targetRole = isWorker ? "WORKER" : "FEDERATION_ADMIN";

      // Resolve booking context & federation
      const effectiveBookingId = selectedBookingId !== "NONE" ? selectedBookingId : undefined;
      const matchedBooking = customerBookings.find((b) => b.id === effectiveBookingId);
      const federationId = matchedBooking?.federation_id || "b765df3b-c418-4a15-b79f-3cbc09e475dc";

      const formData = new FormData();
      formData.append("raisedBy", customerId);
      formData.append("raisedByRole", "CUSTOMER");
      formData.append("raisedByName", customerName);
      if (targetProfileId) formData.append("targetProfileId", targetProfileId);
      if (targetWorkerId) formData.append("targetWorkerId", targetWorkerId);
      formData.append("targetRole", targetRole);
      if (targetName) formData.append("targetName", targetName);
      if (effectiveBookingId) formData.append("bookingId", effectiveBookingId);
      formData.append("federationId", federationId);
      formData.append("category", category);
      if (subcategory.trim()) formData.append("subcategory", subcategory.trim());
      formData.append("subject", subject.trim());
      formData.append("description", description.trim());
      formData.append("priority", effectivePriority);

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to submit complaint.");
      }

      setSubmittedCase(data.complaint);
    } catch (err: unknown) {
      setSubmitError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submitted Confirmation View
  if (submittedCase) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Complaint Submitted Successfully
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your grievance has been officially registered and logged into the cooperative arbitration queue.
          </p>
        </div>

        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Official Reference</span>
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
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Subject</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{submittedCase.subject}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Target / Respondent</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {submittedCase.targetName || "General Service Issue"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Priority Level</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{submittedCase.priority}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Authority</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {submittedCase.federationName || "Gujarat Labour Cooperative Federation"}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Expected Next Action</span>
              <span className="text-slate-600 dark:text-slate-400">
                Cooperative federation review and party statement conciliation within 24 hours.
              </span>
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => router.push("/customer/complaints")}
            className="text-xs font-semibold"
          >
            Back to My Complaints
          </Button>
          <Button
            onClick={() => router.push(`/customer/complaints/${submittedCase.id}`)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
          >
            Track Grievance Case
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
            Register a Grievance or Dispute
          </h1>
          <p className="text-xs text-slate-500">
            Submit a formal dispute case for cooperative conciliation and administrative resolution.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 1: Category & Subcategory */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Step 1: Complaint Type & Category
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Complaint Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-medium"
                >
                  {CUSTOMER_COMPLAINT_CATEGORIES.map((cat) => (
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
                  placeholder="e.g. Broken pipe seal, unexpected fee..."
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="text-xs h-10"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: Who is this complaint about? (Person / Party) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 2: Who is this complaint about? (Person / Party) *
                </span>
              </div>
              {selectedParty && selectedParty !== "OTHER" && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                  Worker Linked
                </Badge>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              Select the specific professional who delivered your service, or select &ldquo;Other / Service Issue&rdquo; if this is not specific to an individual worker.
            </p>

            {isLoadingData ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                Loading eligible service workers...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Dynamically Loaded Eligible Workers */}
                {eligibleWorkers.map((w) => {
                  const isSelected = selectedParty === w.profileId;
                  return (
                    <div
                      key={w.profileId}
                      onClick={() => handleSelectParty(w.profileId)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 relative ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-600"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? "bg-emerald-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}>
                            {w.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block leading-tight">
                              {w.fullName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {w.serviceTitle}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-medium">
                          {w.bookingIds.length} {w.bookingIds.length === 1 ? "Booking" : "Bookings"}
                        </Badge>
                      </div>

                      <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-mono">
                        Associated: Booking #{w.latestBookingNumber}
                      </div>
                    </div>
                  );
                })}

                {/* Other / General Service Issue Option */}
                <div
                  onClick={() => handleSelectParty("OTHER")}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                    selectedParty === "OTHER"
                      ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-600"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        selectedParty === "OTHER" ? "bg-emerald-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}>
                        🏢
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                        Other / Service Issue
                      </span>
                    </div>
                    {selectedParty === "OTHER" && (
                      <Badge className="bg-emerald-700 text-white text-[9px] px-1.5 py-0">Selected</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Billing dispute, platform operations, cooperative administration, or not specific to an individual worker.
                  </p>
                </div>
              </div>
            )}

            {/* Graceful Empty State for Workers */}
            {!isLoadingData && eligibleWorkers.length === 0 && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-bold block">No eligible workers found for a complaint.</span>
                  <span className="text-[11px]">
                    You do not have any prior active or completed bookings with assigned workers. Please select &ldquo;Other / Service Issue&rdquo; above to file a platform or general service grievance.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Associate Relevant Booking */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Step 3: Relevant Service Booking
              </span>
              {selectedBookingId !== "NONE" && (
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-700 border-emerald-300">
                  Booking Linked
                </Badge>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Affected Booking {selectedParty && selectedParty !== "OTHER" ? "(Filtered to selected worker)" : "(Optional)"}
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => handleSelectBooking(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-medium"
              >
                <option value="NONE">
                  {selectedParty && selectedParty !== "OTHER"
                    ? "-- Select one of this worker&apos;s bookings --"
                    : "None / Not specific to a single booking"}
                </option>
                {selectableBookings.map((bk) => {
                  const sTitle = bk.services?.title || "Service";
                  const wName = bk.workers?.profiles?.full_name ? ` • Worker: ${bk.workers.profiles.full_name}` : "";
                  return (
                    <option key={bk.id} value={bk.id}>
                      #{bk.booking_number} — {sTitle}{wName} ({bk.status})
                    </option>
                  );
                })}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Linking a booking allows the cooperative federation to access service timestamps, escrow status, and estimates.
              </p>
            </div>
          </div>

          {/* STEP 4: Subject & Statement */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Step 4: Grievance Statement & Details
              </span>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Subject Summary *
              </label>
              <Input
                placeholder="Brief summary of the issue (e.g. Water dripping post-installation)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-xs h-10 font-semibold"
                required
              />
            </div>

            {/* Detailed Statement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Detailed Grievance Statement *
              </label>
              <Textarea
                placeholder="Provide a comprehensive statement explaining what occurred, dates, damages, or discrepancies..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="text-xs leading-relaxed"
                required
              />
            </div>

            {/* Smart Triage Live Indicator */}
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  Intelligent Cooperative Triage:
                </span>
                <Badge className="bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-extrabold text-[10px]">
                  Suggested Priority: {triage.suggestedPriority}
                </Badge>
              </div>
              <p className="text-blue-800 dark:text-blue-300 text-[11px]">
                {triage.triageReason} Assigned to: <strong>{triage.suggestedQueue}</strong>
              </p>
            </div>
          </div>

          {/* STEP 5: Direct Image Upload Evidence */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Step 5: Photo Evidence (Optional)
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                JPG, JPEG, PNG • Max 5MB
              </span>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="hidden"
              id="complaint-evidence-file"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                handleFileChange(f);
              }}
            />

            {/* Validation Error Alert */}
            {fileValidationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Invalid file selection</span>
                  <span>{fileValidationError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFileValidationError(null)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {!selectedFile ? (
              /* Dropzone / Upload Trigger */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0] || null;
                  handleFileChange(f);
                }}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-600 dark:hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Click to select or drag & drop photo evidence
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Supported formats: <strong>JPG, JPEG, PNG</strong> (up to 5MB)
                  </span>
                </div>
              </div>
            ) : (
              /* Selected File Preview Card */
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                <div className="flex items-start gap-3">
                  {filePreviewUrl ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0 relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={filePreviewUrl}
                        alt="Evidence Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <FileImage className="w-8 h-8 text-slate-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                        Image Attached
                      </Badge>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      This photo will be encrypted and stored securely for cooperative federation review.
                    </p>
                  </div>
                </div>

                {/* Actions: Replace or Remove */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs h-8 gap-1.5 font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replace Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="text-xs h-8 gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Submit Actions */}
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
            {isSubmitting ? "Submitting Case..." : "File Official Complaint"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewCustomerComplaintPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-12 px-4 space-y-6 text-center animate-pulse">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
          <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
          <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
          <div className="h-64 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      }
    >
      <NewCustomerComplaintContent />
    </React.Suspense>
  );
}
