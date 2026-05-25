import { NextResponse } from "next/server";
import { retryVoucherDelivery } from "@/lib/orderFlow";

function authorized(request: Request): boolean {
  const token = process.env.BOT_INTERNAL_TOKEN || "";
  if (!token) return false;
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const headerToken = request.headers.get("x-internal-token") || "";
  return bearer === token || headerToken === token;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { orderId } = await params;
  try {
    const order = await retryVoucherDelivery(orderId);
    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "Order tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Retry gagal";
    return NextResponse.json({ error: "RETRY_FAILED", message }, { status: 400 });
  }
}
