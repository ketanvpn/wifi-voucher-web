import { formatRupiah } from "./format";
import { getSiteConfig } from "./config";
import type { VoucherOrder } from "./types";

export type FonnteMessageKind = "voucher_delivered" | "voucher_pending";

function enabled(): boolean {
  return ["1", "true", "yes", "on"].includes((process.env.FONNTE_ENABLED || "").toLowerCase());
}

function token(): string {
  return process.env.FONNTE_TOKEN || "";
}

function normalizePhone(phone?: string): string {
  const raw = (phone || "").trim();
  if (!raw) return "";
  let cleaned = raw.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("0")) cleaned = `62${cleaned.slice(1)}`;
  return cleaned;
}

function loginLink(loginUrl: string): string {
  return loginUrl.startsWith("http") ? loginUrl : `http://${loginUrl}`;
}

function buildMessage(kind: FonnteMessageKind, order: VoucherOrder): string {
  const site = getSiteConfig();
  const name = order.customerName?.trim() || "Kak";
  if (kind === "voucher_pending") {
    return [
      `Halo ${name}, pembayaran voucher WiFi sudah diterima ✅`,
      "",
      `Paket: ${order.packageName}`,
      `Total: ${formatRupiah(order.amount)}`,
      "",
      "Voucher sedang diproses admin. Mohon tunggu sebentar ya.",
      "Kalau butuh bantuan, balas pesan ini atau hubungi admin.",
    ].join("\n");
  }

  return [
    `Halo ${name}, pembayaran voucher WiFi berhasil ✅`,
    "",
    `Paket: ${order.packageName}`,
    `Total: ${formatRupiah(order.amount)}`,
    `Kode Voucher: ${order.voucherCode || "-"}`,
    "",
    `Sambungkan ke WiFi: ${site.wifiSsid}`,
    `Kalau halaman login tidak muncul, buka: ${site.loginUrl}`,
    loginLink(site.loginUrl),
    "",
    "Terima kasih sudah membeli voucher 🙏",
  ].join("\n");
}

export async function sendFonnteVoucherMessage(kind: FonnteMessageKind, order: VoucherOrder): Promise<boolean> {
  if (!enabled()) return false;
  const authToken = token();
  if (!authToken) return false;
  const target = normalizePhone(order.customerPhone);
  if (!target) return false;

  try {
    const body = new URLSearchParams();
    body.set("target", target);
    body.set("message", buildMessage(kind, order));
    body.set("countryCode", process.env.FONNTE_COUNTRY_CODE || "62");

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: authToken,
      },
      body,
    });
    const text = await response.text().catch(() => "");
    if (!response.ok) {
      console.warn("Fonnte send failed", response.status, text.slice(0, 500));
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Fonnte send failed", err);
    return false;
  }
}

export function hasWhatsappNotified(order: VoucherOrder, key: FonnteMessageKind): boolean {
  return Array.isArray(order.notifiedEvents) && order.notifiedEvents.includes(`whatsapp_${key}`);
}

export function appendWhatsappNotified(order: VoucherOrder, key: FonnteMessageKind): string[] {
  const current = Array.isArray(order.notifiedEvents) ? order.notifiedEvents : [];
  const event = `whatsapp_${key}`;
  return current.includes(event) ? current : [...current, event];
}
