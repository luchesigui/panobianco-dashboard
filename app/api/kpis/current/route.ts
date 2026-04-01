import { getKpiPageData } from "@/lib/data/kpis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getKpiPageData();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
