"use client";

import { useState } from "react";

export function VoucherCopy({ code }: { code?: string }) {
  const [copied, setCopied] = useState(false);
  const voucherCode = code || "";

  async function copyCode() {
    if (!voucherCode) return;
    try {
      await navigator.clipboard.writeText(voucherCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-6 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-center text-white shadow-2xl shadow-cyan-950/20">
      <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200">Voucher</div>
      <div className="mt-4 select-all break-all font-mono text-5xl font-black tracking-widest sm:text-6xl">{voucherCode}</div>
      <button
        type="button"
        onClick={copyCode}
        className="mt-5 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-300 active:scale-[0.99]"
      >
        {copied ? "✅ Kode tersalin" : "📋 Salin Kode Voucher"}
      </button>
      <div className="mt-3 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-slate-300">Kalau tombol tidak jalan, tap & tahan kode untuk salin manual</div>
    </div>
  );
}
