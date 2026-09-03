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
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { bookingService, Booking } from "@/features/bookings/services/booking-service";

export interface EmergencyOption {
  id: string;
  title: string;
  categoryName: string;
  description: string;
  icon: React.ElementType;
}

const EMERGENCY_OPTIONS: EmergencyOption[] = [
  {
    id: "em-pipe-burst",
    title: "Major Water Leakage / Pipe Burst",
    categoryName: "Plumbing",
    description: "Uncontrolled water leak or main pipe rupture threatening property damage.",
    icon: Droplets,
  },
  {
    id: "em-electrical-short",
    title: "Electrical Short Circuit",
    categoryName: "Electrical Services",
    description: "Burnt wiring smell, breaker trip failure, or exposed high-voltage sparking.",
    icon: Zap,
  },
  {
    id: "em-gas-hazard",
    title: "Gas Leak",
    categoryName: "Gas & Appliance",
    description: "Piped gas leak odor or regulator malfunction requiring immediate isolation.",
    icon: Flame,
  },
  {
    id: "em-lockout",
    title: "Door Lockout",
    categoryName: "Carpentry & Locks",
    description: "Main entrance door lock failure, key break, or emergency house lockout.",
    icon: Key,
  },
  {
    id: "em-appliance",
    title: "Urgent Appliance Issue",
    categoryName: "Appliance Repair",
    description: "Critical refrigerator failure, water heater leak, or hazardous main appliance defect.",
    icon: Wrench,
  },
  {
    id: "em-other",
    title: "Other Emergency",
    categoryName: "General Emergency",
    description: "Unlisted urgent household hazard requiring immediate trade attention.",
    icon: HelpCircle,
  },
];

export function EmergencyFlowView() {
  const router = useRouter();

  const [selectedOption, setSelectedOption] = React.useState<EmergencyOption>(EMERGENCY_OPTIONS[0]);
  const [problemDescription, setProblemDescription] = React.useState<string>("");
  const [addressText, setAddressText] = React.useState<string>("Flat 402, Shivam Apartments, Satellite, Ahmedabad");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [submittedBooking, setSubmittedBooking] = React.useState<Booking | null>(null);

  const handleSubmitEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const now = new Date();
      const end = new Date(now.getTime() + 2 * 3600000); // 2 hours emergency window

      const newBooking = await bookingService.createRequest({
        customerId: "cust-1",
        federationId: "fed-ahm-1",
        serviceId: selectedOption.id,
        addressId: "addr-home-1",
        scheduledStartAt: now.toISOString(),
        scheduledEndAt: end.toISOString(),
        totalAmount: 650, // Base emergency dispatch rate
        serviceTitle: `EMERGENCY: ${selectedOption.title}`,
        categoryName: selectedOption.categoryName,
        problemDescription: problemDescription || `URGENT: ${selectedOption.description}`,
        addressText,
        cooperativeName: "Satellite Artisans Cooperative Society (Emergency Cell)",
      });

      setSubmittedBooking(newBooking);
    } catch (err) {
      console.error("Failed to dispatch emergency request", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Emergency Service"
        description="Need urgent assistance? Submit an emergency service request and the cooperative network will process it."
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Emergency Request" },
        ]}
      />

      {submittedBooking ? (
        /* Confirmation State */
        <Card className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 p-6 rounded-xl shadow-md space-y-5">
          <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-base font-bold">Emergency Request Received</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Reference Code: <strong className="font-mono text-emerald-800 dark:text-emerald-300">{submittedBooking.bookingNumber}</strong>
              </p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cooperative Dispatch Status</span>
            </div>
            <p className="leading-relaxed font-medium text-[11px]">
              Your emergency request has been received and is awaiting cooperative dispatch.
            </p>
          </div>

          <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Emergency Type:</span>
              <span className="font-bold text-slate-900 dark:text-white">{submittedBooking.serviceTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Problem Summary:</span>
              <span className="font-medium text-slate-900 dark:text-white truncate max-w-[250px]">{submittedBooking.problemDescription}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service Location:</span>
              <span className="font-bold text-slate-900 dark:text-white">{submittedBooking.addressText}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted Time:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(submittedBooking.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Status:</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-[10px]">
                {submittedBooking.status}
              </Badge>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/customer")}
              className="text-xs"
            >
              Return Home
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/customer/bookings/${submittedBooking.id}`)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5"
            >
              Track Emergency Request
            </Button>
          </div>
        </Card>
      ) : (
        /* Emergency Request Form */
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Submit Emergency Request
              </h3>
              <p className="text-[11px] text-slate-500">
                Select the critical issue below to trigger rapid cooperative team dispatch.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitEmergency} className="space-y-4">
            {/* Options Selection */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase block">1. Select Emergency Category</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EMERGENCY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedOption.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`p-3.5 rounded-xl text-left transition-all border ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-700" : "text-slate-500"}`} />
                        <span className={`text-xs font-bold ${isSelected ? "text-emerald-900 dark:text-emerald-200" : "text-slate-900 dark:text-slate-100"}`}>
                          {opt.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Other Emergency Special Notice */}
            {selectedOption.id === "em-other" && (
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Please describe the emergency clearly in the description below.</span>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase block">2. Problem Description</label>
              <textarea
                rows={3}
                required
                placeholder="Describe the emergency details clearly (e.g. Main water pipe leaking under sink...)"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase block">3. Service Address</label>
              <input
                type="text"
                required
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 outline-none"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-3 shadow-md gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {submitting ? "Submitting Emergency Request..." : "Submit Emergency Request"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
