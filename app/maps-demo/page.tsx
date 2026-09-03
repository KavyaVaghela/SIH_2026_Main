"use client";

import React, { useState } from "react";
import {
  Map,
  CustomerMarker,
  WorkerMarker,
  RouteMap,
  LocationPicker,
} from "@/components/maps";
import { AHMEDABAD_DEFAULT_CENTER, Coordinates } from "@/lib/maps/types";
import { MapPin, Navigation, AlertTriangle, Layers, CheckCircle2 } from "lucide-react";

export default function MapsDemoPage() {
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [testMissingKey, setTestMissingKey] = useState<boolean>(false);
  const [testInvalidCoords, setTestInvalidCoords] = useState<boolean>(false);

  // Sample Ahmedabad Coordinates
  const customerLoc: Coordinates = { lat: 23.0304, lng: 72.5667 }; // Navrangpura, Ahmedabad
  const worker1Loc: Coordinates = { lat: 23.0225, lng: 72.5714 };  // Shivajinagar, Ahmedabad (Available)
  const worker2Loc: Coordinates = { lat: 23.0404, lng: 72.5567 };  // Satellite, Ahmedabad (Available)
  const worker3Loc: Coordinates = { lat: 23.0150, lng: 72.5800 };  // Paldi, Ahmedabad (Busy)

  const [pickedLoc, setPickedLoc] = useState<Coordinates>(customerLoc);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <MapPin className="w-6 h-6" />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-50">
              Shared Google Maps Foundation Demo
            </h1>
          </div>
          <p className="text-sm text-slate-400 max-w-3xl">
            Prototyping surface for the shared Google Maps component architecture centered on{" "}
            <span className="text-emerald-400 font-semibold">Ahmedabad, Gujarat</span> using the Google Maps Demo Key.
          </p>
        </header>

        {/* Demo Mode Controls */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-slate-200">Interactive Test Controls:</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setTestMissingKey(!testMissingKey)}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 font-medium ${
                testMissingKey
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Simulate Missing Key
            </button>

            <button
              onClick={() => setTestInvalidCoords(!testInvalidCoords)}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 font-medium ${
                testInvalidCoords
                  ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Simulate Invalid Coords
            </button>
          </div>
        </div>

        {/* Grid Section 1: Multi-Marker Map */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Multi-Worker & Customer Geographic View (Ahmedabad)
            </h2>
            <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              Center: {AHMEDABAD_DEFAULT_CENTER.lat}, {AHMEDABAD_DEFAULT_CENTER.lng}
            </span>
          </div>

          <Map
            center={AHMEDABAD_DEFAULT_CENTER}
            zoom={13}
            simulateMissingKey={testMissingKey}
            simulateInvalidCoords={testInvalidCoords}
          >
            <CustomerMarker position={customerLoc} customerName="Ramesh Patel" addressText="Navrangpura, Ahmedabad" />
            <WorkerMarker position={worker1Loc} workerName="Sanjay Kumar (Electrician)" skillName="Electrical Wiring" isAvailable={true} rating={4.9} />
            <WorkerMarker position={worker2Loc} workerName="Vikram Singh (Plumber)" skillName="Plumbing Repair" isAvailable={true} rating={4.7} />
            <WorkerMarker position={worker3Loc} workerName="Amit Shah (Cleaner)" skillName="Deep House Cleaning" isAvailable={false} rating={4.8} />
          </Map>
        </section>

        {/* Grid Section 2: Route Map & Location Picker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Route Map */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-indigo-400" />
                Route & Distance Visualization
              </h2>
              {distanceKm !== null && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {distanceKm} km
                </span>
              )}
            </div>
            <RouteMap
              origin={worker1Loc}
              destination={customerLoc}
              workerName="Sanjay Kumar (Electrician)"
              customerName="Ramesh Patel"
              onDistanceCalculated={(dist) => setDistanceKm(dist)}
            />
          </section>

          {/* Location Picker */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Interactive Location Picker
            </h2>
            <LocationPicker
              initialPosition={pickedLoc}
              onLocationSelect={(coords) => setPickedLoc(coords)}
            />
          </section>
        </div>

      </div>
    </div>
  );
}
