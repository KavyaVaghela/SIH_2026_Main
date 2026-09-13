/**
 * Uploads a file (avatar or document) through the server upload endpoint.
 */
export async function uploadFileToStorage(
  file: File,
  bucket: "avatars" | "documents"
): Promise<{ success: boolean; url?: string; filePath?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);

    const res = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "File upload failed" };
    }

    return {
      success: true,
      url: data.url,
      filePath: data.filePath,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload error";
    return { success: false, error: message };
  }
}
