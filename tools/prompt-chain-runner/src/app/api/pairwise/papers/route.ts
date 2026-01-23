import { NextResponse } from "next/server";
import { getAvailablePapers } from "@/lib/pairwise-data";

// GET /api/pairwise/papers - List available papers
export async function GET() {
  try {
    const papers = getAvailablePapers();
    return NextResponse.json({ papers });
  } catch (error) {
    console.error("Error getting papers:", error);
    return NextResponse.json(
      { error: "Failed to get papers" },
      { status: 500 }
    );
  }
}
