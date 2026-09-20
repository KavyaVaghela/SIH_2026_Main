/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getDailyMonitoringData, saveDailyUpdate } from "@/lib/projects/daily-monitoring-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId parameter" }, { status: 400 });
    }

    const data = await getDailyMonitoringData(projectId);

    return NextResponse.json({
      success: true,
      dailyUpdates: data.dailyUpdates,
      updates: data.dailyUpdates,
      workerCharges: data.workerCharges,
      expenses: data.expenses,
      customerQueries: data.customerQueries,
      summary: data.summary,
    });
  } catch (err: unknown) {
    console.error("GET /api/projects/daily-updates error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      workerId,
      workDate,
      workDescription,
      progressPercentage,
      photoUrl,
      storagePath,
      fileName,
      mimeType,
      fileSize,
      expenseDescription,
      expenseAmount,
    } = body;

    if (!projectId || !workDescription || !workDescription.trim()) {
      return NextResponse.json({ error: "Missing required fields: projectId and workDescription" }, { status: 400 });
    }

    // Strict File Type Validation: ONLY JPG, JPEG, PNG allowed
    if (mimeType) {
      const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPG, JPEG, and PNG proof photos are allowed." },
          { status: 400 }
        );
      }
    }

    const activeWorkerId = workerId || "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";

    const result = await saveDailyUpdate({
      projectId,
      workerId: activeWorkerId,
      workDate,
      workDescription,
      progressPercentage,
      photoUrl,
      storagePath,
      fileName,
      mimeType,
      fileSize,
      expenseDescription,
      expenseAmount,
    });

    return NextResponse.json({
      success: true,
      message: "Daily update and labour charge recorded successfully",
      dailyUpdate: result.dailyUpdate,
      expense: result.expense,
    });
  } catch (err: unknown) {
    console.error("POST /api/projects/daily-updates error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
