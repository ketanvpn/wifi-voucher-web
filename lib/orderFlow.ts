import { getGatewayPaymentByOrderId } from "./ketantechpay";
import { getOrder, updateOrder } from "./store";
import { generateVoucher } from "./voucherGenerator";
import type { VoucherOrder } from "./types";

export async function refreshOrder(orderId: string): Promise<VoucherOrder | null> {
  const existing = await getOrder(orderId);
  if (!existing) return null;

  if (["paid_delivered", "paid_pending_voucher", "payment_expired", "payment_failed", "cancelled"].includes(existing.orderStatus)) {
    return existing;
  }

  const payment = await getGatewayPaymentByOrderId(existing.paymentOrderId);
  if (!payment) return existing;

  let updated = await updateOrder(existing.id, {
    ...payment,
    paymentStatus: payment.paymentStatus || existing.paymentStatus,
  });
  if (!updated) return null;

  if (payment.paymentStatus === "expired") {
    updated = await updateOrder(existing.id, { orderStatus: "payment_expired" });
  } else if (payment.paymentStatus === "failed") {
    updated = await updateOrder(existing.id, { orderStatus: "payment_failed" });
  } else if (payment.paymentStatus === "success") {
    updated = await handlePaidOrder(updated);
  }

  return updated;
}

async function handlePaidOrder(order: VoucherOrder): Promise<VoucherOrder> {
  if (order.voucherCode && order.orderStatus === "paid_delivered") return order;

  await updateOrder(order.id, {
    orderStatus: "paid_generating",
    paidAt: order.paidAt || new Date().toISOString(),
  });

  try {
    const generated = await generateVoucher({
      orderId: order.id,
      profile: order.profile,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
    });
    const delivered = await updateOrder(order.id, {
      orderStatus: "paid_delivered",
      voucherCode: generated.voucherCode,
      deliveredAt: new Date().toISOString(),
      errorMessage: undefined,
    });
    return delivered || order;
  } catch (err) {
    const pending = await updateOrder(order.id, {
      orderStatus: "paid_pending_voucher",
      errorMessage: (err as Error).message,
    });
    return pending || order;
  }
}
