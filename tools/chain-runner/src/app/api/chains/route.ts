import { NextResponse } from "next/server";
import { getChains } from "@/lib/chains";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const chains = await getChains();

    return NextResponse.json({
      chains: chains.map((chain) => ({
        id: chain.meta.id,
        name: chain.meta.name,
        description: chain.meta.description,
        version: chain.meta.version,
        author: chain.meta.author,
        tags: chain.meta.tags,
        stepCount: chain.steps.length,
        steps: chain.steps.map((s) => ({
          id: s.id,
          name: s.name,
          model: s.model,
        })),
      })),
    });
  } catch (error) {
    console.error("Error loading chains:", error);
    return NextResponse.json(
      { error: "Failed to load chains" },
      { status: 500 }
    );
  }
}
