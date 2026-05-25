import { getKetantechPayConfig } from "./config";
import type { PaymentStatus, VoucherOrder } from "./types";

interface ChargeResponseData {
  id: string;
  orderId: string;
  status: PaymentStatus;
  providerName?: string;
  providerTransactionId?: string;
  paymentUrl?: string;
  rawResponse?: Record<string, unknown>;
}

function getQrString(raw: Record<string, unknown> | undefined): string | undefined {
  const value = raw?.qris_data || raw?.qr_string || raw?.qrString;
  return typeof value === "string" ? value : undefined;
}

export async function createGatewayCharge(input: {
  orderId: string;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  description: string;
}): Promise<Partial<VoucherOrder>> {
  const cfg = getKetantechPayConfig();
  if (!cfg.clientKey) throw new Error("KETANTECHPAY_CLIENT_KEY belum diset");

  const response = await fetch(`${cfg.baseUrl}/api/v1/payments/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Key": cfg.clientKey,
      "Idempotency-Key": input.orderId,
    },
    body: JSON.stringify({
      orderId: input.orderId,
      amount: input.amount,
      currency: "IDR",
      method: "qris",
      customer: {
        name: input.customerName || "Customer WiFi",
        email: `${input.orderId.toLowerCase()}@wifi.local`,
        phone: input.customerPhone || undefined,
      },
      description: input.description,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || body.error || `KetantechPay charge failed (${response.status})`);
  }

  const data = body.data as ChargeResponseData;
  return {
    gatewayTransactionId: data.id,
    providerTransactionId: data.providerTransactionId,
    paymentStatus: data.status,
    paymentUrl: data.paymentUrl,
    qrString: getQrString(data.rawResponse),
  };
}

export async function getGatewayPaymentByOrderId(orderId: string): Promise<Partial<VoucherOrder> | null> {
  const cfg = getKetantechPayConfig();
  if (!cfg.clientKey) throw new Error("KETANTECHPAY_CLIENT_KEY belum diset");

  const url = new URL(`${cfg.baseUrl}/api/v1/payments`);
  url.searchParams.set("orderId", orderId);

  const response = await fetch(url, {
    headers: { "X-Client-Key": cfg.clientKey },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(body.message || body.error || `KetantechPay status failed (${response.status})`);

  const data = body.data as ChargeResponseData;
  return {
    gatewayTransactionId: data.id,
    providerTransactionId: data.providerTransactionId,
    paymentStatus: data.status,
    paymentUrl: data.paymentUrl,
    qrString: getQrString(data.rawResponse),
  };
}
