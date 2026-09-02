export interface Coordinates {
  lat: number;
  lng: number;
}

export type MapState =
  | "loading"
  | "ready"
  | "error"
  | "missing_key"
  | "invalid_coordinates";

export interface MapMarkerConfig {
  id: string;
  position: Coordinates;
  title?: string;
  iconUrl?: string;
  variant?: "customer" | "worker_available" | "worker_busy" | "default";
  popupContent?: string | React.ReactNode;
  onClick?: () => void;
}

export const AHMEDABAD_DEFAULT_CENTER: Coordinates = {
  lat: 23.0225,
  lng: 72.5714,
};

export const DEFAULT_MAP_ZOOM = 13;
export const DEMO_MAP_ID = "DEMO_MAP_ID";

export function isValidCoordinates(coords?: Coordinates | null): boolean {
  if (!coords) return false;
  const { lat, lng } = coords;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    (lat !== 0 || lng !== 0)
  );
}
