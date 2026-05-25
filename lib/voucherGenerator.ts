export async function generateVoucher(input: {
  orderId: string;
  profile: string;
  customerName?: string;
  customerPhone?: string;
}): Promise<{ voucherCode: string }> {
  if (process.env.WIFI_VOUCHER_MOCK_GENERATE === "true") {
    const suffix = Math.abs(hash(input.orderId)).toString().slice(0, 6).padStart(6, "0");
    return { voucherCode: suffix };
  }

  const url = process.env.BOT_INTERNAL_GENERATE_URL;
  if (!url) throw new Error("BOT_INTERNAL_GENERATE_URL belum diset");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.BOT_INTERNAL_TOKEN
        ? { Authorization: `Bearer ${process.env.BOT_INTERNAL_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      orderId: input.orderId,
      profile: input.profile,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      source: "wifi_voucher_web",
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    throw new Error(body.message || body.error || `Generate voucher failed (${response.status})`);
  }
  if (!body.voucherCode || typeof body.voucherCode !== "string") {
    throw new Error("Generate voucher response tidak punya voucherCode");
  }
  return { voucherCode: body.voucherCode };
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(31, h) + text.charCodeAt(i);
  }
  return h;
}
