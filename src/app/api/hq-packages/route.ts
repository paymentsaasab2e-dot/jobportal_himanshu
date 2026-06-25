import { fetchPublicHqPackages } from "@/lib/employers/hqPackages";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const packages = await fetchPublicHqPackages();
  return NextResponse.json({ success: true, data: { packages } });
}
