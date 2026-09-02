import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    platform: "Cooperative Gig Services Platform",
    timestamp: new Date().toISOString(),
  });
}
