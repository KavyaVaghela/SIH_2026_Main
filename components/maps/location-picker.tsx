"use client";

import React, { useState } from "react";
import { Map } from "./map";
import { CustomerMarker } from "./customer-marker";
import { Coordinates, AHMEDABAD_DEFAULT_CENTER } from "@/lib/maps/types";
import { MapPin } from "lucide-react";

export interface LocationPickerProps {
  initialPosition?: Coordinates;
  onLocationSelect?: (coords: Coordinates) => void;
  className?: string;
}

export function LocationPicker({
  initialPosition = AHMEDABAD_DEFAULT_CENTER,
  onLocationSelect,
  className = "w-full h-[400px] rounded-xl border border-slate-200 overflow-hidden shadow-sm",
}: LocationPickerProps) {
  const [selectedCoords, setSelectedCoords] = useState<Coordinates>(initialPosition);

  const handleMapClick = (coords: Coordinates) => {
    setSelectedCoords(coords);
    if (onLocationSelect) {
      onLocationSelect(coords);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between bg-slate-900 text-slate-100 px-4 py-3 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">Selected Coordinates:</span>
        </div>
        <div className="font-mono text-indigo-300">
          Latitude: <span className="font-bold">{selectedCoords.lat.toFixed(4)}</span> | Longitude:{" "}
          <span className="font-bold">{selectedCoords.lng.toFixed(4)}</span>
        </div>
      </div>

      <Map
        center={selectedCoords}
        zoom={14}
        className={className}
        onClick={handleMapClick}
      >
        <CustomerMarker
          position={selectedCoords}
          customerName="Picked Location"
          addressText={`Lat: ${selectedCoords.lat.toFixed(4)}, Lng: ${selectedCoords.lng.toFixed(4)}`}
        />
      </Map>
    </div>
  );
}
