import { z } from "zod";
import type { VoucherPackage } from "./types";

const packageSchema = z.object({
  id: z.string().min(1),
  profile: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int().positive(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
});

export function getSiteConfig() {
  return {
    name: process.env.NEXT_PUBLIC_SITE_NAME || "TAPEKETAN WiFi",
    subtitle:
      process.env.NEXT_PUBLIC_SITE_SUBTITLE ||
      "Voucher internet cepat, bayar QRIS, kode muncul otomatis.",
    supportWhatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "",
  };
}

export function getPackages(): VoucherPackage[] {
  const raw = process.env.VOUCHER_PACKAGES_JSON || "[]";
  try {
    const parsed = JSON.parse(raw);
    return z.array(packageSchema).parse(parsed).filter((p) => p.enabled);
  } catch (err) {
    console.error("Invalid VOUCHER_PACKAGES_JSON", err);
    return [];
  }
}

export function getOrderExpireMinutes(): number {
  const n = Number(process.env.ORDER_EXPIRE_MINUTES || "15");
  return Number.isFinite(n) && n > 0 ? n : 15;
}

export function getDataFile(): string {
  return process.env.ORDER_DATA_FILE || "./data/orders.json";
}

export function getKetantechPayConfig() {
  return {
    baseUrl: (process.env.KETANTECHPAY_BASE_URL || "https://pay.ketantech.my.id").replace(/\/$/, ""),
    clientKey: process.env.KETANTECHPAY_CLIENT_KEY || "",
  };
}
