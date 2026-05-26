"use client";

import { useState } from "react";
import type { GeneratedVoucher } from "@/lib/types";

type VoucherCopyProps = {
  code?: string;
  vouchers?: GeneratedVoucher[];
};

export function VoucherCopy({ code, vouchers }: VoucherCopyProps) {
  const [copied, setCopied] = useState<"single" | "all" | null>(null);
  const codes = Array.isArray(vouchers) && vouchers.length > 0 ? vouchers.map((v) => v.code).filter(Boolean) : code ? [code] : [];
  const voucherCode = codes[0] || "";
  const multi = codes.length > 1;

  async function copyText(text: string, key: "single" | "all") {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  if (multi) {
    const allText = codes.map((item, index) => `Voucher ${index + 1}: ${item}`).join("\n");
    return (
      <div className="mt-6 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-5 text-white shadow-2xl shadow-cyan-950/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200">Voucher</div>
            <div className="mt-2 text-2xl font-black">{codes.length} Kode WiFi</div>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">Siap dipakai</div>
        </div>
        <div className="mt-5 space-y-3">
          {codes.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-xs font-black uppercase tracking-wide text-slate-400">Voucher #{index + 1}</div>
                <button type="button" onClick={() => copyText(item, "single")} className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-cyan-100 hover:bg-white/15">
                  {copied === "single" ? "✅ Tersalin" : "Salin"}
                </button>
              </div>
              <div className="select-all break-all font-mono text-3xl font-black tracking-widest sm:text-4xl">{item}</div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => copyText(allText, "all")}
          className="mt-5 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-300 active:scale-[0.99]"
        >
          {copied === "all" ? "✅ Semua kode tersalin" : "📋 Salin Semua Voucher"}
        </button>
        <div className="mt-3 rounded-full bg-white/10 px-4 py-2 text-center text-xs font-bold text-slate-300">Bagikan satu kode untuk satu perangkat/customer</div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-center text-white shadow-2xl shadow-cyan-950/20">
      <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200">Voucher</div>
      <div className="mt-4 select-all break-all font-mono text-5xl font-black tracking-widest sm:text-6xl">{voucherCode}</div>
      <button
        type="button"
        onClick={() => copyText(voucherCode, "single")}
        className="mt-5 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-300 active:scale-[0.99]"
      >
        {copied === "single" ? "✅ Kode tersalin" : "📋 Salin Kode Voucher"}
      </button>
      <div className="mt-3 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-slate-300">Kalau tombol tidak jalan, tap & tahan kode untuk salin manual</div>
    </div>
  );
}
