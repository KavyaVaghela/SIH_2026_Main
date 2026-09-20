import { NextRequest, NextResponse } from "next/server";
import { complaintService } from "@/features/complaints/services/complaint-service";
import type { GrievancePartyRole, GrievancePriority } from "@/types/complaints/v2";
import {
  validateComplaintEvidenceFile,
  uploadComplaintEvidence,
  removeComplaintEvidence,
} from "@/lib/storage/complaint-evidence";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = (searchParams.get("role") || "CUSTOMER") as GrievancePartyRole;
    const actorId = searchParams.get("actorId") || undefined;
    const federationId = searchParams.get("federationId") || undefined;
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const isEscalatedParam = searchParams.get("isEscalated");
    const isEscalated = isEscalatedParam !== null ? isEscalatedParam === "true" : undefined;
    const includeEscalatedParam = searchParams.get("includeEscalated");
    const includeEscalated = includeEscalatedParam !== null ? includeEscalatedParam === "true" : undefined;
    const searchQuery = searchParams.get("search") || undefined;
    const complainantRole = (searchParams.get("complainantRole") || undefined) as "CUSTOMER" | "WORKER" | "FEDERATION_ADMIN" | undefined;
    const filterType = (searchParams.get("filterType") || undefined) as "MY_COMPLAINTS" | "COMPLAINTS_FROM_CUSTOMERS" | undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

    const { cases, totalCount } = await complaintService.listGrievances({
      role,
      actorId,
      federationId,
      status,
      category,
      priority,
      isEscalated,
      includeEscalated,
      searchQuery,
      complainantRole,
      filterType,
      dateFrom,
      dateTo,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      complaints: cases,
      totalCount,
      page,
      pageSize,
    });
  } catch (err: unknown) {
    const errorObj = err as { message?: string; status?: number; statusCode?: number };
    return NextResponse.json(
      { success: false, error: errorObj.message || "Failed to list complaints" },
      { status: errorObj.statusCode || errorObj.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null;
  try {
    const contentType = request.headers.get("content-type") || "";
    let file: File | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      file = formData.get("file") as File | null;
      payload = {
        raisedBy: formData.get("raisedBy") as string,
        raisedByRole: (formData.get("raisedByRole") as string) || "CUSTOMER",
        raisedByName: (formData.get("raisedByName") as string) || undefined,
        raisedByPhone: (formData.get("raisedByPhone") as string) || undefined,
        targetProfileId: (formData.get("targetProfileId") as string) || undefined,
        targetRole: (formData.get("targetRole") as string) || "WORKER",
        targetName: (formData.get("targetName") as string) || undefined,
        targetWorkerId: (formData.get("targetWorkerId") as string) || undefined,
        bookingId: (formData.get("bookingId") as string) || undefined,
        federationId: (formData.get("federationId") as string) || undefined,
        category: formData.get("category") as string,
        subcategory: (formData.get("subcategory") as string) || undefined,
        subject: formData.get("subject") as string,
        description: formData.get("description") as string,
        priority: (formData.get("priority") as string) || "MEDIUM",
        evidenceUrls: [],
      };
    } else {
      payload = await request.json();
    }

    const {
      raisedBy,
      raisedByRole,
      raisedByName,
      raisedByPhone,
      targetProfileId,
      targetRole,
      targetName,
      targetWorkerId,
      bookingId,
      federationId,
      category,
      subcategory,
      subject,
      description,
      priority,
    } = payload;

    let evidenceUrls: string[] = Array.isArray(payload.evidenceUrls) ? payload.evidenceUrls : [];

    if (!raisedBy || !category || !subject || !description) {
      return NextResponse.json(
        { success: false, error: "Missing required complaint fields: raisedBy, category, subject, description." },
        { status: 400 }
      );
    }

    // Prepare complaint ID ahead of time so the storage path matches complaints/{complaint-id}/{unique-file-name}
    const complaintId = payload.id || crypto.randomUUID();

    // If an image file was provided, validate and upload it
    if (file && file.size > 0) {
      const validation = validateComplaintEvidenceFile({
        name: file.name,
        type: file.type,
        size: file.size,
      });

      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error || "Invalid file" },
          { status: 400 }
        );
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const uploadRes = await uploadComplaintEvidence(
        fileBuffer,
        complaintId,
        file.name,
        file.type
      );

      if (!uploadRes.success || !uploadRes.filePath || !uploadRes.url) {
        return NextResponse.json(
          { success: false, error: uploadRes.error || "Failed to upload evidence image." },
          { status: 500 }
        );
      }

      uploadedFilePath = uploadRes.filePath;
      evidenceUrls = [uploadRes.url];
    }

    // Create the grievance record
    const created = await complaintService.createGrievance({
      id: complaintId,
      raisedBy,
      raisedByRole: raisedByRole as GrievancePartyRole,
      raisedByName,
      raisedByPhone,
      targetProfileId,
      targetRole: targetRole as GrievancePartyRole,
      targetName,
      targetWorkerId,
      bookingId,
      federationId,
      category,
      subcategory,
      subject,
      description,
      priority: priority as GrievancePriority,
      evidenceUrls,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Complaint submitted successfully.",
        complaint: created,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    // If complaint creation failed and a file was uploaded, safely clean it up to prevent orphan files
    if (uploadedFilePath) {
      try {
        await removeComplaintEvidence(uploadedFilePath);
      } catch (cleanupErr) {
        console.warn("[Storage] Failed to cleanup orphaned evidence file:", cleanupErr);
      }
    }

    const errorObj = err as { message?: string; status?: number; statusCode?: number };
    return NextResponse.json(
      { success: false, error: errorObj.message || "Failed to create complaint" },
      { status: errorObj.statusCode || errorObj.status || 500 }
    );
  }
}
