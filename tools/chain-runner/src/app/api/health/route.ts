import { NextResponse } from "next/server";
import { getAvailableModels } from "@/lib/models";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    models: getAvailableModels(),
  });
}
