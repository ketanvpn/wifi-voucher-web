import { NextResponse } from "next/server";
import { refreshOrder } from "@/lib/orderFlow";
import type { VoucherOrder } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const order = await refreshOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "Order tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: publicOrder(order) });
}

function publicOrder(order: VoucherOrder) {
  return {
    orderId: order.id,
    paymentOrderId: order.paymentOrderId,
    amount: order.amount,
    packageName: order.packageName,
    profile: order.profile,
    status: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentUrl: order.paymentUrl,
    qrString: order.qrString,
    voucherCode: order.orderStatus === "paid_delivered" ? order.voucherCode : undefined,
    errorMessage: order.orderStatus === "paid_pending_voucher" ? order.errorMessage : undefined,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt,
    deliveredAt: order.deliveredAt,
  };
}
