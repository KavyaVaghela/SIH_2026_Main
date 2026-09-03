"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { Coordinates } from "@/lib/maps/types";

export interface MapMarkerProps {
  map?: any;
  position: Coordinates;
  title?: string;
  iconUrl?: string;
  popupContent?: string;
  onClick?: () => void;
}

export function MapMarker({
  map,
  position,
  title,
  iconUrl,
  popupContent,
  onClick,
}: MapMarkerProps) {
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  useEffect(() => {
    if (!map || typeof window === "undefined" || !(window as any).google) return;

    const google = (window as any).google;

    const markerOptions: any = {
      position: { lat: position.lat, lng: position.lng },
      map,
      title: title || "",
    };

    if (iconUrl) {
      markerOptions.icon = {
        url: iconUrl,
        scaledSize: new google.maps.Size(36, 36),
      };
    }

    const marker = new google.maps.Marker(markerOptions);
    markerRef.current = marker;

    if (popupContent) {
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color: #0f172a; font-family: sans-serif; font-size: 13px; font-weight: 500; padding: 4px;">${popupContent}</div>`,
      });
      infoWindowRef.current = infoWindow;

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
        if (onClick) onClick();
      });
    } else if (onClick) {
      marker.addListener("click", onClick);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, position.lat, position.lng, title, iconUrl, popupContent]);

  return null;
}
