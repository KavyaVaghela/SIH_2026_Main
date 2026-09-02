"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";
import { Map } from "./map";
import { CustomerMarker } from "./customer-marker";
import { WorkerMarker } from "./worker-marker";
import { Coordinates } from "@/lib/maps/types";

export interface RouteMapProps {
  origin: Coordinates; // Worker location
  destination: Coordinates; // Customer location
  workerName?: string;
  customerName?: string;
  strokeColor?: string;
  className?: string;
  onDistanceCalculated?: (distanceKm: number) => void;
}

export function RouteMap({
  origin,
  destination,
  workerName = "Assigned Worker",
  customerName = "Service Customer",
  strokeColor = "#10b981", // Emerald route line
  className = "w-full h-[420px] rounded-xl border border-slate-200 overflow-hidden shadow-sm",
  onDistanceCalculated,
}: RouteMapProps) {
  const polylineRef = useRef<any>(null);

  // Midpoint for centering map view
  const centerLat = (origin.lat + destination.lat) / 2;
  const centerLng = (origin.lng + destination.lng) / 2;
  const mapCenter: Coordinates = { lat: centerLat, lng: centerLng };

  const handleMapReady = (mapInstance: any) => {
    if (typeof window === "undefined" || !(window as any).google) return;
    const google = (window as any).google;

    // Draw route polyline
    const flightPath = new google.maps.Polyline({
      path: [
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng },
      ],
      geodesic: true,
      strokeColor,
      strokeOpacity: 0.8,
      strokeWeight: 4,
    });

    flightPath.setMap(mapInstance);
    polylineRef.current = flightPath;

    // Fit map bounds to contain both markers comfortably
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(origin.lat, origin.lng));
    bounds.extend(new google.maps.LatLng(destination.lat, destination.lng));
    mapInstance.fitBounds(bounds);

    // Compute approximate Haversine distance in KM
    if (onDistanceCalculated) {
      const R = 6371;
      const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
      const dLon = ((destination.lng - origin.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((origin.lat * Math.PI) / 180) *
          Math.cos((destination.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = Math.round(R * c * 10) / 10;
      onDistanceCalculated(dist);
    }
  };

  useEffect(() => {
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  return (
    <Map center={mapCenter} zoom={13} className={className} onMapReady={handleMapReady}>
      <WorkerMarker position={origin} workerName={workerName} isAvailable={false} />
      <CustomerMarker position={destination} customerName={customerName} />
    </Map>
  );
}
