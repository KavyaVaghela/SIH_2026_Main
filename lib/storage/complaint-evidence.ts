import { createAdminClient } from "@/lib/supabase/admin";

export const COMPLAINT_EVIDENCE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"] as const;
export const COMPLAINTS_BUCKET = "complaints";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file's extension, MIME type, and size.
 * Rejects unsupported files such as PDF, SVG, GIF, WEBP, EXE, ZIP, etc.
 */
export function validateComplaintEvidenceFile(file: {
  name?: string;
  type?: string;
  size?: number;
} | null | undefined): FileValidationResult {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }

  // Size validation
  if (typeof file.size === "number" && file.size > COMPLAINT_EVIDENCE_MAX_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 5MB.`,
    };
  }

  // Extension validation
  const fileName = file.name || "";
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) {
    return {
      valid: false,
      error: "File lacks a valid extension. Only JPG, JPEG, and PNG images are allowed.",
    };
  }

  const ext = fileName.slice(lastDot).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return {
      valid: false,
      error: `Invalid file format "${ext}". Only JPG, JPEG, and PNG images are supported. Files such as PDF, SVG, GIF, and WEBP are not permitted.`,
    };
  }

  // MIME type validation
  if (file.type) {
    const cleanType = file.type.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.includes(cleanType as (typeof ALLOWED_MIME_TYPES)[number])) {
      return {
        valid: false,
        error: `Invalid file MIME type "${file.type}". Only JPG, JPEG, and PNG images are supported.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Generates a non-predictable, unique structured path for complaint evidence:
 * complaints/{complaint-id}/{unique-file-name}
 */
export function generateEvidenceStoragePath(complaintId: string, originalFileName: string): string {
  const lastDot = originalFileName.lastIndexOf(".");
  const rawExt = lastDot !== -1 ? originalFileName.slice(lastDot + 1).toLowerCase() : "jpg";
  const ext = ["jpg", "jpeg", "png"].includes(rawExt) ? rawExt : "jpg";

  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 11);
  const uniqueName = `evidence-${timestamp}-${randomPart}.${ext}`;

  return `complaints/${complaintId}/${uniqueName}`;
}

/**
 * Resolves a stored path or relative path to the object key inside the complaints bucket.
 */
export function normalizeStorageKey(pathOrUrl: string): string {
  let clean = decodeURIComponent(pathOrUrl).trim();
  // Strip URL query parameters if present
  clean = clean.split("?")[0];
  // If full API URL or path provided, extract path param
  if (clean.includes("/api/complaints/evidence")) {
    const match = pathOrUrl.match(/[?&]path=([^&]+)/);
    if (match && match[1]) {
      clean = decodeURIComponent(match[1]).trim().split("?")[0];
    }
  }
  // Remove leading slashes
  clean = clean.replace(/^\/+/, "");
  return clean;
}

/**
 * Uploads complaint evidence to the private Supabase Storage bucket.
 */
export async function uploadComplaintEvidence(
  fileBuffer: Buffer | Uint8Array,
  complaintId: string,
  originalFileName: string,
  mimeType: string
): Promise<{ success: boolean; filePath?: string; url?: string; error?: string }> {
  try {
    const admin = createAdminClient();
    const filePath = generateEvidenceStoragePath(complaintId, originalFileName);

    const { error: uploadErr } = await admin.storage
      .from(COMPLAINTS_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: mimeType || "image/jpeg",
        upsert: false,
      });

    if (uploadErr) {
      console.error("[Storage] Failed to upload complaint evidence:", uploadErr);
      return { success: false, error: uploadErr.message };
    }

    const publicRef = `/api/complaints/evidence?path=${encodeURIComponent(filePath)}`;

    return {
      success: true,
      filePath,
      url: publicRef,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload evidence";
    return { success: false, error: message };
  }
}

/**
 * Safely removes a file from the complaints storage bucket (e.g. for rollback on submission error).
 */
export async function removeComplaintEvidence(filePath: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const key = normalizeStorageKey(filePath);
    const { error } = await admin.storage.from(COMPLAINTS_BUCKET).remove([key]);
    if (error) {
      console.warn("[Storage] Warning: removeComplaintEvidence error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Storage] Warning: removeComplaintEvidence threw:", err);
    return false;
  }
}

/**
 * Generates a secure, time-limited signed URL for authorized access to private complaint evidence.
 */
export async function generateComplaintEvidenceSignedUrl(
  filePath: string,
  expiresInSeconds = 300
): Promise<{ signedUrl: string | null; error?: string }> {
  try {
    const admin = createAdminClient();
    const key = normalizeStorageKey(filePath);

    // Try key as-is (e.g. "complaints/{id}/{filename}")
    const { data, error } = await admin.storage
      .from(COMPLAINTS_BUCKET)
      .createSignedUrl(key, expiresInSeconds);

    if (!error && data?.signedUrl) {
      return { signedUrl: data.signedUrl };
    }

    // Fallback: If uploaded without "complaints/" prefix
    const strippedKey = key.replace(/^complaints\//, "");
    if (strippedKey !== key) {
      const { data: retryData, error: retryErr } = await admin.storage
        .from(COMPLAINTS_BUCKET)
        .createSignedUrl(strippedKey, expiresInSeconds);

      if (!retryErr && retryData?.signedUrl) {
        return { signedUrl: retryData.signedUrl };
      }
    }

    return { signedUrl: null, error: error?.message || "Could not generate signed URL" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Signed URL error";
    return { signedUrl: null, error: message };
  }
}

/**
 * Verifies whether a given user is authorized to access evidence belonging to a complaint.
 * 
 * Rules:
 * - Super Admin: Global access.
 * - Complainant (raisedBy): Authorized.
 * - Target Party (targetProfileId or target worker): Authorized.
 * - Federation Admin: Authorized if the complaint's federation matches the admin's federation.
 * - Any other user: Unauthorized.
 */
export async function verifyComplaintAccess(
  complaintId: string,
  user: { id: string; role?: string; federationId?: string }
): Promise<boolean> {
  try {
    if (!user || !user.id) return false;

    // Super Admin has global access
    if (user.role === "SUPER_ADMIN") return true;

    const admin = createAdminClient();

    // Query complaint record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: complaint, error } = await (admin.from("complaints") as any)
      .select(`
        id,
        raised_by,
        target_profile_id,
        booking_id,
        description,
        bookings (
          federation_id,
          worker_id,
          workers (profile_id)
        )
      `)
      .eq("id", complaintId)
      .maybeSingle();

    if (error || !complaint) {
      return false;
    }

    // Complainant access
    if (complaint.raised_by === user.id) {
      return true;
    }

    // Target party access (worker or customer target)
    if (complaint.target_profile_id === user.id) {
      return true;
    }

    // Worker involved via booking
    if (complaint.bookings?.workers?.profile_id === user.id) {
      return true;
    }

    // Parse structured envelope for federation context if stored in description JSON
    let envelopeFedId: string | null = null;
    let envelopeTargetWorkerId: string | null = null;
    try {
      if (complaint.description && complaint.description.startsWith("{")) {
        const parsed = JSON.parse(complaint.description);
        envelopeFedId = parsed.federationId || null;
        envelopeTargetWorkerId = parsed.targetWorkerId || null;
      }
    } catch {
      // Ignored if plain text description
    }

    // Check worker profile match via targetWorkerId
    if (envelopeTargetWorkerId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: wRecord } = await (admin.from("workers") as any)
        .select("profile_id")
        .eq("id", envelopeTargetWorkerId)
        .maybeSingle();

      if (wRecord?.profile_id === user.id) {
        return true;
      }
    }

    // Federation Admin access
    if (user.role === "FEDERATION_ADMIN" || user.role === "ADMIN") {
      const complaintFedId =
        complaint.bookings?.federation_id ||
        envelopeFedId;

      // If user has direct federationId
      if (user.federationId && complaintFedId && user.federationId === complaintFedId) {
        return true;
      }

      // Check if user's profile email or federation association matches
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (admin.from("profiles") as any)
        .select("email")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.email && complaintFedId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: fed } = await (admin.from("federations") as any)
          .select("id, contact_email")
          .eq("id", complaintFedId)
          .maybeSingle();

        if (fed && fed.contact_email === profile.email) {
          return true;
        }
      }
    }

    return false;
  } catch (err) {
    console.error("[Storage] Error verifying complaint access:", err);
    return false;
  }
}
