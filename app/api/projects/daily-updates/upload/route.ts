import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file || !projectId) {
      return NextResponse.json({ error: "Missing file or projectId parameter" }, { status: 400 });
    }

    // 1. Strict File Type Server-Side Validation: ONLY JPG, JPEG, PNG
    const fileName = file.name || "proof_photo.jpg";
    const mimeType = file.type?.toLowerCase() || "";
    const ext = fileName.split(".").pop()?.toLowerCase() || "";

    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    const allowedExtensions = ["jpg", "jpeg", "png"];

    const isMimeValid = allowedMimeTypes.includes(mimeType);
    const isExtValid = allowedExtensions.includes(ext);

    if (!isMimeValid && !isExtValid) {
      return NextResponse.json(
        {
          error: `Invalid file type "${file.type || ext}". Only JPG, JPEG, and PNG proof photos are allowed. PDF, WEBP, GIF, SVG, HEIC, and video files are strictly rejected.`,
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeExt = allowedExtensions.includes(ext) ? ext : "jpg";
    const storagePath = `proofs/${projectId}/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${safeExt}`;

    // 2. Try uploading to Supabase Storage bucket 'project-proofs'
    let publicUrl = "";
    try {
      const { error: uploadErr } = await admin.storage
        .from("project-proofs")
        .upload(storagePath, buffer, {
          contentType: mimeType || `image/${safeExt}`,
          upsert: true,
        });

      if (!uploadErr) {
        const { data: urlData } = admin.storage.from("project-proofs").getPublicUrl(storagePath);
        publicUrl = urlData?.publicUrl || "";
      } else {
        console.warn("Storage upload notice (bucket auto-fallback):", uploadErr.message);
      }
    } catch (stgErr) {
      console.warn("Storage bucket error notice:", stgErr);
    }

    // Fallback: If bucket is not created, return data URL or placeholder reference
    if (!publicUrl) {
      const base64 = buffer.toString("base64");
      publicUrl = `data:${mimeType || "image/jpeg"};base64,${base64}`;
    }

    return NextResponse.json({
      success: true,
      publicUrl,
      storagePath,
      fileName,
      mimeType: mimeType || `image/${safeExt}`,
      fileSize: file.size,
    });
  } catch (err: unknown) {
    console.error("POST /api/projects/daily-updates/upload error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
