"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

export interface FederationContextRecord {
  id: string;
  name: string;
  code: string;
  serviceRegion?: string;
  city?: string;
  state?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationNumber?: string;
  gstNumber?: string;
  address?: string;
  isActive?: boolean;
}

const STORAGE_KEYS = {
  FED_ID: "kaushalyasetu_fed_id",
  FED_NAME: "kaushalyasetu_fed_name",
  FED_REGION: "kaushalyasetu_fed_region",
  FED_CODE: "kaushalyasetu_fed_code",
};

/**
 * Resolves the authenticated Federation Admin's assigned federation dynamically.
 * Adheres strictly to the 4-step resolution order:
 * 1. user.user_metadata.federation_id
 * 2. user.email matched against federations.contact_email
 * 3. verify that the resulting federation exists in the database
 * 4. fail safely (return null) if no federation can be resolved.
 *
 * Never uses unconstrained select("*").limit(1).
 * Never hardcodes a federation UUID or name.
 */
export async function resolveFederationContext(
  clientOverride?: any
): Promise<FederationContextRecord | null> {
  const supabase = clientOverride || createClient();

  try {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return null;
    }

    // Step 1: Check user_metadata.federation_id
    const metaFedId = user.user_metadata?.federation_id;
    if (metaFedId && typeof metaFedId === "string" && metaFedId.trim().length > 0) {
      const { data: fedById, error: fedByIdErr } = await (supabase.from("federations") as any)
        .select("*")
        .eq("id", metaFedId.trim())
        .maybeSingle();

      if (!fedByIdErr && fedById) {
        const record = mapDbToFederationRecord(fedById);
        cacheFederationInSession(record);
        return record;
      }
    }

    // Step 2: Fallback to user.email matched against federations.contact_email
    if (user.email && user.email.trim().length > 0) {
      const { data: fedByEmail, error: fedByEmailErr } = await (supabase.from("federations") as any)
        .select("*")
        .eq("contact_email", user.email.trim())
        .maybeSingle();

      if (!fedByEmailErr && fedByEmail) {
        const record = mapDbToFederationRecord(fedByEmail);
        cacheFederationInSession(record);
        return record;
      }
    }

    // Step 4: Fail safely if no verified federation row is matched
    return null;
  } catch (err) {
    console.warn("Notice: Dynamic federation context resolution encountered an error:", err);
    return null;
  }
}

function mapDbToFederationRecord(row: any): FederationContextRecord {
  return {
    id: row.id,
    name: row.name || "Federation Administrator",
    code: row.code || "",
    serviceRegion: row.service_region || row.jurisdiction || "",
    city: row.city || "",
    state: row.state || "",
    contactEmail: row.contact_email || "",
    contactPhone: row.contact_phone || "",
    registrationNumber: row.registration_number || "",
    gstNumber: row.gst_number || "",
    address: row.address || "",
    isActive: row.is_active ?? true,
  };
}

function cacheFederationInSession(record: FederationContextRecord): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEYS.FED_ID, record.id);
    sessionStorage.setItem(STORAGE_KEYS.FED_NAME, record.name);
    if (record.serviceRegion) {
      sessionStorage.setItem(STORAGE_KEYS.FED_REGION, record.serviceRegion);
    }
    if (record.code) {
      sessionStorage.setItem(STORAGE_KEYS.FED_CODE, record.code);
    }
  } catch {
    // ignore sessionStorage errors
  }
}

export function getCachedFederationContext(): FederationContextRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const id = sessionStorage.getItem(STORAGE_KEYS.FED_ID);
    const name = sessionStorage.getItem(STORAGE_KEYS.FED_NAME);
    if (!id || !name) return null;
    return {
      id,
      name,
      code: sessionStorage.getItem(STORAGE_KEYS.FED_CODE) || "",
      serviceRegion: sessionStorage.getItem(STORAGE_KEYS.FED_REGION) || "",
    };
  } catch {
    return null;
  }
}

/**
 * React Hook providing the verified federation context for Federation Admin views.
 * Uses sessionStorage cache for instant first-frame render without layout shifts.
 */
export function useFederationContext() {
  const [federation, setFederation] = React.useState<FederationContextRecord | null>(() =>
    getCachedFederationContext()
  );
  const [isLoading, setIsLoading] = React.useState<boolean>(() => !getCachedFederationContext());

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      const resolved = await resolveFederationContext();
      if (isMounted) {
        if (resolved) {
          setFederation(resolved);
        }
        setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { federation, isLoading };
}
