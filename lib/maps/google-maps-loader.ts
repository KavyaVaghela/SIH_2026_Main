/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Singleton Google Maps JavaScript API Loader
 * 
 * Ensures the Google Maps JS script is injected into the DOM exactly ONCE.
 * Consumes NEXT_PUBLIC_GOOGLE_MAPS_API_KEY from environment variables.
 */

let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only be loaded in browser environment"));
  }

  // Already loaded globally
  if ((window as any).google && (window as any).google.maps) {
    return Promise.resolve();
  }

  // Currently loading
  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return Promise.reject(new Error("GOOGLE_MAPS_KEY_MISSING"));
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existingScript = document.getElementById("google-maps-js-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () => reject(new Error("MAPS_LOAD_FAILED")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js-sdk";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error("MAPS_LOAD_FAILED"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
