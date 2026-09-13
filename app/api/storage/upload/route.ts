import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "avatars";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (bucket !== "avatars" && bucket !== "documents") {
      return NextResponse.json({ error: "Invalid storage bucket target" }, { status: 400 });
    }

    // Validation
    const maxSize = bucket === "avatars" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds limit (${bucket === "avatars" ? "5MB" : "10MB"})` },
        { status: 400 }
      );
    }

    const allowedMimeTypes =
      bucket === "avatars"
        ? ["image/jpeg", "image/png", "image/webp", "image/gif"]
        : ["application/pdf", "image/jpeg", "image/png", "image/webp"];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const ext = file.name.split(".").pop() || (bucket === "avatars" ? "jpg" : "pdf");
    const uniqueName = `${bucket === "avatars" ? "avatar" : "doc"}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = uniqueName;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await admin.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.error(`Storage upload error to ${bucket}:`, uploadErr);
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    if (bucket === "avatars") {
      const {
        data: { publicUrl },
      } = admin.storage.from("avatars").getPublicUrl(filePath);

      return NextResponse.json({
        success: true,
        bucket,
        filePath,
        url: publicUrl,
      });
    }

    // For private documents, return the internal storage reference
    return NextResponse.json({
      success: true,
      bucket,
      filePath,
      url: `/api/storage/document?path=${encodeURIComponent(filePath)}`,
    });
  } catch (err: unknown) {
    console.error("Storage upload handler error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
