import { NextResponse } from "next/server";
import { getPackages } from "@/lib/config";

export async function GET() {
  return NextResponse.json({ data: getPackages() });
}
