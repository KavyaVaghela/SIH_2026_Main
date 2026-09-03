"use client";

import * as React from "react";
import { MapPin, Navigation, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Map, CustomerMarker, WorkerMarker } from "@/components/maps";
import { AHMEDABAD_DEFAULT_CENTER } from "@/lib/maps/types";
import { BookingStatus } from "@/supabase/types/database.types";

export interface TrackingMapCardProps {
  status: BookingStatus;
  workerName?: string;
  addressText?: string;
}

export function TrackingMapCard({ status, workerName = "Worker", addressText }: TrackingMapCardProps) {
  // Coordinates in Ahmedabad (Satellite area)
  const customerCoords = { lat: 23.0300, lng: 72.5178 };
  // Dynamic worker location based on status
  const workerCoords = React.useMemo(() => {
    if (status === "ON_THE_WAY") return { lat: 23.0335, lng: 72.5230 }; // 0.8km away
    if (status === "ARRIVED" || status === "OTP_VERIFIED" || status === "SERVICE_STARTED" || status === "SERVICE_COMPLETED") {
      return { lat: 23.0302, lng: 72.5180 }; // At site
    }
    return { lat: 23.0380, lng: 72.5590 }; // At cooperative base
  }, [status]);

  const getStatusMapLabel = () => {
    switch (status) {
      case "ON_THE_WAY":
        return `${workerName} is en route (Approx. 0.8 km away)`;
      case "ARRIVED":
        return `${workerName} has arrived at your location. Verify OTP to start service.`;
      case "OTP_VERIFIED":
      case "SERVICE_STARTED":
        return `${workerName} is currently performing requested service on site.`;
      case "SERVICE_COMPLETED":
        return `Service completed on site by ${workerName}.`;
      default:
        return `${workerName} assigned from nearby cooperative.`;
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden space-y-0">
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
          <Navigation className="w-4 h-4 text-emerald-600" />
          <span>Live Service Location Map</span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200">
          {status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Embedded Map Component */}
      <div className="relative">
        <Map center={customerCoords} zoom={14} className="w-full h-[260px] rounded-none border-b border-slate-200">
          <CustomerMarker position={customerCoords} customerName="Service Address" addressText={addressText} />
          <WorkerMarker position={workerCoords} workerName={workerName} isAvailable={true} />
        </Map>
      </div>

      <div className="p-3.5 text-xs bg-white dark:bg-slate-900 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-slate-700 dark:text-slate-300 font-medium">
          {getStatusMapLabel()}
        </p>
      </div>
    </Card>
  );
}
