import { NextResponse } from "next/server";
import { sweepExpiredOrders } from "@/lib/orderFlow";

function authorized(request: Request): boolean {
  const token = process.env.BOT_INTERNAL_TOKEN || "";
  if (!token) return false;
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const headerToken = request.headers.get("x-internal-token") || "";
  return bearer === token || headerToken === token;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const result = await sweepExpiredOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sweep expired gagal";
    return NextResponse.json({ error: "SWEEP_FAILED", message }, { status: 500 });
  }
}
