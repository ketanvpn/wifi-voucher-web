import { appendNotified, hasNotified, notifyWebVoucherEvent } from "./botNotifier";
import { getGatewayPaymentByOrderId } from "./ketantechpay";
import { getOrder, updateOrder } from "./store";
import { generateVoucher } from "./voucherGenerator";
import type { VoucherOrder } from "./types";

export async function refreshOrder(orderId: string): Promise<VoucherOrder | null> {
  const existing = await getOrder(orderId);
  if (!existing) return null;

  if (["paid_delivered", "payment_expired", "payment_failed", "cancelled"].includes(existing.orderStatus)) {
    return existing;
  }

  if (existing.orderStatus === "paid_pending_voucher") {
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
    if (updated && !hasNotified(updated, "payment_expired")) {
      await notifyWebVoucherEvent("payment_expired", updated);
      updated = (await updateOrder(updated.id, { notifiedEvents: appendNotified(updated, "payment_expired") })) || updated;
    }
  } else if (payment.paymentStatus === "failed") {
    updated = await updateOrder(existing.id, { orderStatus: "payment_failed" });
  } else if (payment.paymentStatus === "success") {
    if (!hasNotified(updated, "payment_success")) {
      await notifyWebVoucherEvent("payment_success", updated);
      updated = (await updateOrder(updated.id, { notifiedEvents: appendNotified(updated, "payment_success") })) || updated;
    }
    updated = await handlePaidOrder(updated);
  } else if (updated.expiresAt && new Date(updated.expiresAt).getTime() <= Date.now()) {
    updated = await updateOrder(updated.id, { orderStatus: "payment_expired", paymentStatus: "expired" }) || updated;
    if (!hasNotified(updated, "payment_expired")) {
      await notifyWebVoucherEvent("payment_expired", updated);
      updated = (await updateOrder(updated.id, { notifiedEvents: appendNotified(updated, "payment_expired") })) || updated;
    }
  }

  return updated;
}

export async function retryVoucherDelivery(orderId: string): Promise<VoucherOrder | null> {
  const order = await getOrder(orderId);
  if (!order) return null;
  if (order.paymentStatus !== "success") {
    throw new Error("Order belum payment success");
  }
  return handlePaidOrder(order, true);
}

async function handlePaidOrder(order: VoucherOrder, force = false): Promise<VoucherOrder> {
  if (!force && order.voucherCode && order.orderStatus === "paid_delivered") return order;

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
    let delivered = await updateOrder(order.id, {
      orderStatus: "paid_delivered",
      voucherCode: generated.voucherCode,
      deliveredAt: new Date().toISOString(),
      errorMessage: undefined,
    });
    if (delivered && !hasNotified(delivered, "voucher_delivered")) {
      await notifyWebVoucherEvent("voucher_delivered", delivered);
      delivered = (await updateOrder(delivered.id, { notifiedEvents: appendNotified(delivered, "voucher_delivered") })) || delivered;
    }
    return delivered || order;
  } catch (err) {
    let pending = await updateOrder(order.id, {
      orderStatus: "paid_pending_voucher",
      errorMessage: (err as Error).message,
    });
    if (pending && !hasNotified(pending, "voucher_pending")) {
      await notifyWebVoucherEvent("voucher_pending", pending);
      pending = (await updateOrder(pending.id, { notifiedEvents: appendNotified(pending, "voucher_pending") })) || pending;
    }
    return pending || order;
  }
}
