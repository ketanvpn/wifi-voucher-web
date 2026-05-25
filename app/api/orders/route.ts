import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderExpireMinutes, getPackages } from "@/lib/config";
import { createGatewayCharge } from "@/lib/ketantechpay";
import { createOrder, updateOrder } from "@/lib/store";
import { appendNotified, notifyWebVoucherEvent } from "@/lib/botNotifier";
import type { VoucherOrder } from "@/lib/types";

const bodySchema = z.object({
  packageId: z.string().min(1),
  customerName: z.string().trim().max(80).optional().or(z.literal("")),
  customerPhone: z.string().trim().max(30).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const input = bodySchema.parse(await request.json());
    const pkg = getPackages().find((p) => p.id === input.packageId && p.enabled);
    if (!pkg) {
      return NextResponse.json({ error: "PACKAGE_NOT_FOUND", message: "Paket tidak tersedia" }, { status: 404 });
    }

    const now = new Date();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const paymentOrderId = `WIFI-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const expiresAt = new Date(now.getTime() + getOrderExpireMinutes() * 60_000).toISOString();

    const payment = await createGatewayCharge({
      orderId: paymentOrderId,
      amount: pkg.price,
      customerName: input.customerName || undefined,
      customerPhone: input.customerPhone || undefined,
      description: `Voucher WiFi ${pkg.name}`,
    });

    const order: VoucherOrder = {
      id: orderId,
      paymentOrderId,
      gatewayTransactionId: payment.gatewayTransactionId,
      providerTransactionId: payment.providerTransactionId,
      customerName: input.customerName || undefined,
      customerPhone: input.customerPhone || undefined,
      packageId: pkg.id,
      profile: pkg.profile,
      packageName: pkg.name,
      amount: pkg.price,
      paymentStatus: payment.paymentStatus || "pending",
      orderStatus: "waiting_payment",
      paymentUrl: payment.paymentUrl,
      qrString: payment.qrString,
      expiresAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await createOrder(order);
    await notifyWebVoucherEvent("order_created", order);
    await updateOrder(order.id, { notifiedEvents: appendNotified(order, "order_created") });
    return NextResponse.json({ data: publicOrder(order) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membuat order";
    return NextResponse.json({ error: "CREATE_ORDER_FAILED", message }, { status: 400 });
  }
}

function publicOrder(order: VoucherOrder) {
  return {
    orderId: order.id,
    paymentOrderId: order.paymentOrderId,
    amount: order.amount,
    packageName: order.packageName,
    status: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentUrl: order.paymentUrl,
    qrString: order.qrString,
    expiresAt: order.expiresAt,
  };
}
