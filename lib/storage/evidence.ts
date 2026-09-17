/**
 * Evidence and Problem Photo helper utilities.
 * Connects Customer-uploaded problem photos to Worker request inspection views
 * without modifying database schemas or breaking existing description fields.
 */

export const EVIDENCE_PHOTO_TAG = "[Customer Evidence Photo]:";

/**
 * Persists an optional customer evidence photo reference inside the request description.
 */
export function formatDescriptionWithEvidence(description: string, photoUrl?: string | null): string {
  if (!photoUrl || !photoUrl.trim()) {
    return description;
  }
  const cleanDesc = description.trim();
  const cleanPhoto = photoUrl.trim();
  return `${cleanDesc}\n\n${EVIDENCE_PHOTO_TAG} ${cleanPhoto}`;
}

/**
 * Extracts the evidence photo URL and returns the human-readable problem description.
 */
export function extractProblemEvidence(rawDescription?: string | null): {
  cleanDescription: string;
  problemPhotoUrl: string | null;
} {
  if (!rawDescription) {
    return {
      cleanDescription: "Service request details",
      problemPhotoUrl: null,
    };
  }

  const tagRegex = /(?:\r?\n)*\[Customer Evidence Photo\]:\s*([^\s\r\n]+)/i;
  const match = rawDescription.match(tagRegex);

  if (match && match[1]) {
    const rawPhotoUrl = match[1].trim();
    const cleanDescription = rawDescription.replace(tagRegex, "").trim();
    const resolvedUrl = resolveStoragePhotoUrl(rawPhotoUrl);
    return {
      cleanDescription: cleanDescription || "Service request details",
      problemPhotoUrl: resolvedUrl,
    };
  }

  return {
    cleanDescription: rawDescription.trim() || "Service request details",
    problemPhotoUrl: null,
  };
}

/**
 * Resolves a storage path or URL into a fully-qualified usable image URL.
 */
export function resolveStoragePhotoUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl || !pathOrUrl.trim()) return null;
  const trimmed = pathOrUrl.trim();

  // Already a usable absolute URL or local preview blob
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  // Handle Supabase Storage path e.g. "avatars/avatar-123.jpg" or "avatar-123.jpg"
  const cleanPath = trimmed.replace(/^avatars\//, "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/avatars/${cleanPath}`;
  }

  return trimmed;
}
