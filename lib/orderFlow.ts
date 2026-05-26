import { appendNotified, hasNotified, notifyWebVoucherEvent } from "./botNotifier";
import { appendWhatsappNotified, hasWhatsappNotified, sendFonnteVoucherMessage } from "./fonnteNotifier";
import { getGatewayPaymentByOrderId } from "./ketantechpay";
import { getOrder, listOrders, updateOrder } from "./store";
import { generateVoucher } from "./voucherGenerator";
import type { GeneratedVoucher, VoucherOrder } from "./types";

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

export async function sweepExpiredOrders(limit = 500): Promise<{ checked: number; expired: number }> {
  const orders = await listOrders(limit);
  let checked = 0;
  let expired = 0;
  const now = Date.now();

  for (const order of orders) {
    if (["paid_delivered", "payment_expired", "payment_failed", "cancelled"].includes(order.orderStatus)) continue;
    if (!order.expiresAt || new Date(order.expiresAt).getTime() > now) continue;
    checked += 1;
    const refreshed = await refreshOrder(order.id);
    if (refreshed?.orderStatus === "payment_expired") expired += 1;
  }

  return { checked, expired };
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
  const targetQuantity = Math.max(1, Math.floor(order.quantity || 1));
  const existingVouchers = normalizeVouchers(order);
  if (!force && existingVouchers.length >= targetQuantity && order.orderStatus === "paid_delivered") return order;

  await updateOrder(order.id, {
    orderStatus: "paid_generating",
    paidAt: order.paidAt || new Date().toISOString(),
    vouchers: existingVouchers,
  });

  const vouchers = [...existingVouchers];
  try {
    for (let index = vouchers.length + 1; index <= targetQuantity; index += 1) {
      const generated = await generateVoucher({
        orderId: voucherGenerationOrderId(order.id, index, targetQuantity),
        profile: order.profile,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
      });
      vouchers.push({ code: generated.voucherCode, index, generatedAt: new Date().toISOString() });
      await updateOrder(order.id, {
        vouchers,
        voucherCode: vouchers[0]?.code,
        errorMessage: undefined,
      });
    }

    let delivered = await updateOrder(order.id, {
      orderStatus: "paid_delivered",
      voucherCode: vouchers[0]?.code,
      vouchers,
      deliveredAt: new Date().toISOString(),
      errorMessage: undefined,
    });
    if (delivered && !hasNotified(delivered, "voucher_delivered")) {
      await notifyWebVoucherEvent("voucher_delivered", delivered);
      delivered = (await updateOrder(delivered.id, { notifiedEvents: appendNotified(delivered, "voucher_delivered") })) || delivered;
    }
    if (delivered && !hasWhatsappNotified(delivered, "voucher_delivered")) {
      const sent = await sendFonnteVoucherMessage("voucher_delivered", delivered);
      if (sent) {
        delivered = (await updateOrder(delivered.id, { notifiedEvents: appendWhatsappNotified(delivered, "voucher_delivered") })) || delivered;
      }
    }
    return delivered || order;
  } catch (err) {
    let pending = await updateOrder(order.id, {
      orderStatus: "paid_pending_voucher",
      voucherCode: vouchers[0]?.code,
      vouchers,
      errorMessage: `Berhasil buat ${vouchers.length}/${targetQuantity} voucher. ${(err as Error).message}`,
    });
    if (pending && !hasNotified(pending, "voucher_pending")) {
      await notifyWebVoucherEvent("voucher_pending", pending);
      pending = (await updateOrder(pending.id, { notifiedEvents: appendNotified(pending, "voucher_pending") })) || pending;
    }
    if (pending && !hasWhatsappNotified(pending, "voucher_pending")) {
      const sent = await sendFonnteVoucherMessage("voucher_pending", pending);
      if (sent) {
        pending = (await updateOrder(pending.id, { notifiedEvents: appendWhatsappNotified(pending, "voucher_pending") })) || pending;
      }
    }
    return pending || order;
  }
}

function normalizeVouchers(order: VoucherOrder): GeneratedVoucher[] {
  if (Array.isArray(order.vouchers) && order.vouchers.length > 0) return order.vouchers;
  if (order.voucherCode) {
    return [{ code: order.voucherCode, index: 1, generatedAt: order.deliveredAt || order.updatedAt || new Date().toISOString() }];
  }
  return [];
}

function voucherGenerationOrderId(orderId: string, index: number, quantity: number): string {
  return quantity <= 1 ? orderId : `${orderId}:${index}`;
}
