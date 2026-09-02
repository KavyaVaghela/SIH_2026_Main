"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import {
  Coordinates,
  MapState,
  AHMEDABAD_DEFAULT_CENTER,
  DEFAULT_MAP_ZOOM,
  DEMO_MAP_ID,
  isValidCoordinates,
} from "@/lib/maps/types";
import { loadGoogleMapsScript } from "@/lib/maps/google-maps-loader";
import { AlertTriangle, MapPin, Loader2 } from "lucide-react";

export interface MapProps {
  center?: Coordinates;
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  onMapReady?: (map: any) => void;
  onClick?: (coords: Coordinates) => void;
  simulateMissingKey?: boolean;
  simulateInvalidCoords?: boolean;
}

export function Map({
  center = AHMEDABAD_DEFAULT_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  className = "w-full h-[400px] rounded-xl overflow-hidden border border-slate-200 shadow-sm",
  children,
  onMapReady,
  onClick,
  simulateMissingKey = false,
  simulateInvalidCoords = false,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const [mapState, setMapState] = useState<MapState>("loading");

  useEffect(() => {
    // Simulated state overrides for testing fallback UI
    if (simulateMissingKey) {
      setMapState("missing_key");
      return;
    }

    if (simulateInvalidCoords || !isValidCoordinates(center)) {
      setMapState("invalid_coordinates");
      return;
    }

    let isMounted = true;

    loadGoogleMapsScript()
      .then(() => {
        if (!isMounted || !mapRef.current) return;

        const google = (window as any).google;
        if (!google || !google.maps) {
          setMapState("error");
          return;
        }

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom,
          mapId: DEMO_MAP_ID,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        });

        googleMapInstanceRef.current = mapInstance;
        setMapState("ready");

        if (onMapReady) {
          onMapReady(mapInstance);
        }

        if (onClick) {
          mapInstance.addListener("click", (e: any) => {
            onClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err.message === "GOOGLE_MAPS_KEY_MISSING") {
          setMapState("missing_key");
        } else {
          setMapState("error");
        }
      });

    return () => {
      isMounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, zoom, simulateMissingKey, simulateInvalidCoords]);

  // Update center when center prop changes
  useEffect(() => {
    if (
      googleMapInstanceRef.current &&
      mapState === "ready" &&
      isValidCoordinates(center)
    ) {
      googleMapInstanceRef.current.panTo({ lat: center.lat, lng: center.lng });
    }
  }, [center.lat, center.lng, center, mapState]);

  // Fallback UI states
  if (mapState === "missing_key") {
    return (
      <div className={`${className} bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center border-amber-500/30`}>
        <AlertTriangle className="w-10 h-10 text-amber-400 mb-3 animate-pulse" />
        <h4 className="font-semibold text-lg text-amber-200">Google Maps API Key Required</h4>
        <p className="text-sm text-slate-400 max-w-md mt-1">
          Google Maps API key is missing. Set <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment variables.
        </p>
      </div>
    );
  }

  if (mapState === "invalid_coordinates") {
    return (
      <div className={`${className} bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center border-rose-500/30`}>
        <MapPin className="w-10 h-10 text-rose-400 mb-3" />
        <h4 className="font-semibold text-lg text-rose-200">Invalid Location Coordinates</h4>
        <p className="text-sm text-slate-400 max-w-md mt-1">
          Location coordinates are uninitialized or out of geographic bounds.
        </p>
      </div>
    );
  }

  if (mapState === "error") {
    return (
      <div className={`${className} bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center border-red-500/30`}>
        <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
        <h4 className="font-semibold text-lg text-red-200">Map Unavailable</h4>
        <p className="text-sm text-slate-400 max-w-md mt-1">
          Unable to load Google Maps JavaScript API. Please check your network connection.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[350px]">
      {mapState === "loading" && (
        <div className="absolute inset-0 z-10 bg-slate-900/90 backdrop-blur-sm text-slate-200 flex flex-col items-center justify-center p-6 text-center rounded-xl">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-300">Map is loading...</p>
        </div>
      )}
      <div ref={mapRef} className={className} />
      {googleMapInstanceRef.current &&
        React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { map: googleMapInstanceRef.current } as any);
          }
          return child;
        })}
    </div>
  );
}
