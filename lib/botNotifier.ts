import type { VoucherOrder } from "./types";

export type WebVoucherEvent = "order_created" | "payment_success" | "payment_expired" | "voucher_delivered" | "voucher_pending";

function notifyUrl(): string {
  if (process.env.BOT_INTERNAL_NOTIFY_URL) return process.env.BOT_INTERNAL_NOTIFY_URL;
  const generateUrl = process.env.BOT_INTERNAL_GENERATE_URL || "";
  return generateUrl.replace(/\/internal\/generate-voucher\/?$/, "/internal/webvoucher-event");
}

export async function notifyWebVoucherEvent(event: WebVoucherEvent, order: VoucherOrder): Promise<void> {
  const url = notifyUrl();
  const token = process.env.BOT_INTERNAL_TOKEN;
  if (!url || !token) return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        event,
        order: {
          id: order.id,
          paymentOrderId: order.paymentOrderId,
          packageName: order.packageName,
          profile: order.profile,
          amount: order.amount,
          unitPrice: order.unitPrice,
          quantity: order.quantity || 1,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          voucherCode: order.voucherCode,
          vouchers: order.vouchers,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          errorMessage: order.errorMessage,
          createdAt: order.createdAt,
          paidAt: order.paidAt,
          deliveredAt: order.deliveredAt,
        },
      }),
    });
    if (!response.ok) {
      console.warn("Web voucher Telegram notify failed", response.status, await response.text().catch(() => ""));
    }
  } catch (err) {
    console.warn("Web voucher Telegram notify failed", err);
  }
}

export function hasNotified(order: VoucherOrder, event: WebVoucherEvent): boolean {
  return Array.isArray(order.notifiedEvents) && order.notifiedEvents.includes(event);
}

export function appendNotified(order: VoucherOrder, event: WebVoucherEvent): string[] {
  const current = Array.isArray(order.notifiedEvents) ? order.notifiedEvents : [];
  return current.includes(event) ? current : [...current, event];
}
