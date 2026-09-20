/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import {
  createCustomerQuery,
  getDailyMonitoringData,
  respondToCustomerQuery,
} from "@/lib/projects/daily-monitoring-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId parameter" }, { status: 400 });
    }

    const data = await getDailyMonitoringData(projectId);
    return NextResponse.json({ success: true, queries: data.customerQueries || [] });
  } catch (err: unknown) {
    console.error("GET /api/projects/daily-queries error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, customerId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef", dailyUpdateId, expenseId, message } = body;

    if (!projectId || !message || !message.trim()) {
      return NextResponse.json({ error: "Missing required fields: projectId and message" }, { status: 400 });
    }

    const query = await createCustomerQuery({
      projectId,
      customerId,
      dailyUpdateId,
      expenseId,
      message,
    });

    return NextResponse.json({
      success: true,
      message: "Query raised successfully. Federation has been notified.",
      query,
    });
  } catch (err: unknown) {
    console.error("POST /api/projects/daily-queries error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { queryId, response, respondedBy, status = "RESOLVED" } = body;

    if (!queryId || !response || !response.trim()) {
      return NextResponse.json({ error: "Missing required fields: queryId and response" }, { status: 400 });
    }

    const query = await respondToCustomerQuery({
      queryId,
      response,
      respondedBy,
      status: status.toUpperCase() as "RESOLVED" | "CLOSED",
    });

    if (!query) {
      return NextResponse.json({ error: "Query record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Query response recorded successfully",
      query,
    });
  } catch (err: unknown) {
    console.error("PATCH /api/projects/daily-queries error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
