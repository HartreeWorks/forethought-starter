import { NextResponse } from "next/server";
import { loadRunById } from "@/lib/persistence";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const run = await loadRunById(id);

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json({ run });
  } catch (error) {
    console.error("Error loading run:", error);
    return NextResponse.json({ error: "Failed to load run" }, { status: 500 });
  }
}
