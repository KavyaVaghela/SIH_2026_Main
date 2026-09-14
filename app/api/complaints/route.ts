import { NextRequest, NextResponse } from "next/server";
import { complaintService } from "@/features/complaints/services/complaint-service";
import type { GrievancePartyRole, GrievancePriority } from "@/types/complaints/v2";

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
    const searchQuery = searchParams.get("search") || undefined;
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
      searchQuery,
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
    const errorObj = err as { message?: string; status?: number };
    return NextResponse.json(
      { success: false, error: errorObj.message || "Failed to list complaints" },
      { status: errorObj.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      evidenceUrls,
    } = body;

    if (!raisedBy || !category || !subject || !description) {
      return NextResponse.json(
        { success: false, error: "Missing required complaint fields: raisedBy, category, subject, description." },
        { status: 400 }
      );
    }

    const created = await complaintService.createGrievance({
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

    return NextResponse.json({
      success: true,
      message: "Complaint submitted successfully.",
      complaint: created,
    }, { status: 201 });
  } catch (err: unknown) {
    const errorObj = err as { message?: string; status?: number };
    return NextResponse.json(
      { success: false, error: errorObj.message || "Failed to create complaint" },
      { status: errorObj.status || 500 }
    );
  }
}
