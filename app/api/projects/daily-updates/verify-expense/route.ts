/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { verifyExpense } from "@/lib/projects/daily-monitoring-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { expenseId, status, verifiedAmount, verifiedBy, notes } = body;

    if (!expenseId || !status) {
      return NextResponse.json({ error: "Missing required fields: expenseId and status" }, { status: 400 });
    }

    const normalizedStatus = status.toUpperCase();
    if (normalizedStatus !== "VERIFIED" && normalizedStatus !== "REJECTED" && normalizedStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Invalid status. Must be 'VERIFIED', 'REJECTED', or 'PENDING'." },
        { status: 400 }
      );
    }

    const result = await verifyExpense({
      expenseId,
      status: normalizedStatus,
      verifiedAmount,
      verifiedBy,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: `Expense successfully marked as ${normalizedStatus}`,
      expense: result.expense,
      financials: result.financials,
    });
  } catch (err: unknown) {
    console.error("POST /api/projects/daily-updates/verify-expense error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
