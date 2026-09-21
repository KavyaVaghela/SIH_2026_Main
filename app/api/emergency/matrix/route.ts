import { NextRequest, NextResponse } from "next/server";
import { EmergencyResponseMatrixRepository } from "@/lib/emergency/response-matrix-store";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const type = searchParams.get("type");
    const category = searchParams.get("category");

    // Single deterministic lookup by stable matrix code
    if (code) {
      const entry = await EmergencyResponseMatrixRepository.findByCode(code);
      if (!entry) {
        return NextResponse.json(
          { error: `Response matrix entry for code "${code}" not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, matrix: entry });
    }

    // Single deterministic lookup by emergency type name
    if (type) {
      const entry = await EmergencyResponseMatrixRepository.findByEmergencyType(type);
      if (!entry) {
        return NextResponse.json(
          { error: `Response matrix entry for type "${type}" not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, matrix: entry });
    }

    // List all (or filtered by category)
    const entries = await EmergencyResponseMatrixRepository.listAll(category || undefined);
    return NextResponse.json({
      success: true,
      matrix: entries,
      count: entries.length,
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/matrix error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required." },
        { status: 401 }
      );
    }

    // Normal customers must not be able to modify the response matrix
    if (user.role === "CUSTOMER") {
      return NextResponse.json(
        { error: "Forbidden: Customers are strictly forbidden from modifying the Emergency Response Matrix." },
        { status: 403 }
      );
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin privileges are required to create matrix configurations." },
        { status: 403 }
      );
    }

    const body = await request.json();
    return NextResponse.json({ success: true, created: body }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/emergency/matrix error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required." },
        { status: 401 }
      );
    }

    // Normal customers must not be able to modify the response matrix
    if (user.role === "CUSTOMER") {
      return NextResponse.json(
        { error: "Forbidden: Customers are strictly forbidden from modifying the Emergency Response Matrix." },
        { status: 403 }
      );
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin privileges are required to update matrix configurations." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, ...updates } = body;
    if (!code) {
      return NextResponse.json(
        { error: "matrix_code is required to update response configuration." },
        { status: 400 }
      );
    }

    const result = await EmergencyResponseMatrixRepository.updateMatrixEntry(
      code,
      updates,
      user.role
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, matrix: result.record });
  } catch (err: unknown) {
    console.error("PATCH /api/emergency/matrix error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required." },
        { status: 401 }
      );
    }

    if (user.role === "CUSTOMER") {
      return NextResponse.json(
        { error: "Forbidden: Customers are strictly forbidden from modifying the Emergency Response Matrix." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Forbidden: Super Admin privileges are required." },
      { status: 403 }
    );
  } catch (err: unknown) {
    console.error("DELETE /api/emergency/matrix error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
