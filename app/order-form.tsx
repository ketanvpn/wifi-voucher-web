"use client";

import { useState } from "react";
import type { VoucherPackage } from "@/lib/types";
import { formatRupiah } from "@/lib/format";

export default function OrderForm({ packages }: { packages: VoucherPackage[] }) {
  const [packageId, setPackageId] = useState(packages[0]?.id || "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = packages.find((p) => p.id === packageId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!packageId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, customerName, customerPhone }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Gagal membuat order");
      window.location.href = `/checkout/${body.data.orderId}`;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl rounded-[2rem] border border-white/15 bg-white p-4 text-slate-950 shadow-2xl shadow-cyan-950/30 sm:p-6">
      <div className="flex items-start justify-between gap-4 px-1 py-2">
        <div>
          <h2 className="text-2xl font-black">Pilih Paket</h2>
          <p className="mt-1 text-sm text-slate-500">Tap salah satu paket, lalu bayar QRIS.</p>
        </div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Online</div>
      </div>

      {packages.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Paket belum diset oleh admin.</div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {packages.map((pkg) => {
            const active = packageId === pkg.id;
            return (
              <button key={pkg.id} type="button" onClick={() => setPackageId(pkg.id)} className={`relative rounded-3xl border p-4 text-left transition ${active ? "border-cyan-500 bg-cyan-50 ring-4 ring-cyan-100" : "border-slate-200 bg-slate-50 hover:border-cyan-300 hover:bg-white"}`}>
                {active && <div className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-cyan-500 text-xs font-black text-white">✓</div>}
                <div className="text-lg font-black text-slate-950">{pkg.name}</div>
                <div className="mt-1 min-h-9 text-xs leading-5 text-slate-500">{pkg.description || "Voucher WiFi"}</div>
                <div className="mt-4 text-2xl font-black text-slate-950">{formatRupiah(pkg.price)}</div>
              </button>
            );
          })}
        </div>
      )}

      <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-black text-slate-700">Isi nama/HP pelanggan (opsional)</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama, contoh: Pak Eko" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Nomor HP, contoh: 08xxxxxxxxxx" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
        </div>
      </details>

      {selected && (
        <div className="mt-4 flex items-center justify-between rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-4 text-white">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-slate-400">Total Bayar</div>
            <div className="mt-1 text-3xl font-black">{formatRupiah(selected.price)}</div>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">QRIS</div>
        </div>
      )}

      {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <button disabled={loading || !packageId || packages.length === 0} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-5 py-4 text-base font-black text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Membuat QRIS…" : "Bayar Sekarang"}
      </button>
    </form>
  );
}
