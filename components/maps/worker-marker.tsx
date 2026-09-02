"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { MapMarker } from "./map-marker";
import { Coordinates } from "@/lib/maps/types";

export interface WorkerMarkerProps {
  map?: any;
  position: Coordinates;
  workerName: string;
  skillName?: string;
  isAvailable?: boolean;
  rating?: number;
  onClick?: () => void;
}

export function WorkerMarker({
  map,
  position,
  workerName,
  skillName = "General Service Provider",
  isAvailable = true,
  rating = 4.8,
  onClick,
}: WorkerMarkerProps) {
  // SVG Pin Data URL representing custom worker pin
  const pinColor = isAvailable ? "%2310b981" : "%23f59e0b"; // Emerald green for available, Amber for busy
  const svgIcon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="${pinColor}" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="%23ffffff"/></svg>`;

  const popupHtml = `
    <div style="min-width: 160px; font-family: system-ui, sans-serif;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <strong style="font-size: 14px; color: #0f172a;">${workerName}</strong>
        <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 9999px; background: ${isAvailable ? "#dcfce7" : "#fef3c7"}; color: ${isAvailable ? "#15803d" : "#b45309"};">
          ${isAvailable ? "AVAILABLE" : "BUSY"}
        </span>
      </div>
      <div style="font-size: 12px; color: #64748b;">${skillName}</div>
      <div style="font-size: 12px; color: #d97706; font-weight: 600; margin-top: 4px;">★ ${rating.toFixed(1)}</div>
    </div>
  `;

  return (
    <MapMarker
      map={map}
      position={position}
      title={`${workerName} (${isAvailable ? "Available" : "Busy"})`}
      iconUrl={svgIcon}
      popupContent={popupHtml}
      onClick={onClick}
    />
  );
}
