"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { MapMarker } from "./map-marker";
import { Coordinates } from "@/lib/maps/types";

export interface CustomerMarkerProps {
  map?: any;
  position: Coordinates;
  customerName?: string;
  addressText?: string;
  onClick?: () => void;
}

export function CustomerMarker({
  map,
  position,
  customerName = "Customer Location",
  addressText = "Service Address",
  onClick,
}: CustomerMarkerProps) {
  // SVG Pin Data URL representing customer location
  const pinColor = "%236366f1"; // Indigo pin for customer
  const svgIcon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="${pinColor}" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><path d="m9 10 2 2 4-4" stroke="%23ffffff" stroke-width="2.5" fill="none"/></svg>`;

  const popupHtml = `
    <div style="min-width: 150px; font-family: system-ui, sans-serif;">
      <strong style="font-size: 14px; color: #4338ca;">📍 ${customerName}</strong>
      <div style="font-size: 12px; color: #475569; margin-top: 4px;">${addressText}</div>
    </div>
  `;

  return (
    <MapMarker
      map={map}
      position={position}
      title={customerName}
      iconUrl={svgIcon}
      popupContent={popupHtml}
      onClick={onClick}
    />
  );
}
