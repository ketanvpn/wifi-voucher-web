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
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:p-6">
      <h2 className="text-lg font-bold text-slate-950">Checkout Cepat</h2>
      <p className="mt-1 text-sm text-slate-500">Kontak opsional, tapi membantu kalau ada kendala voucher.</p>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Paket</span>
          <select value={packageId} onChange={(e) => setPackageId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} — {formatRupiah(pkg.price)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Nama (opsional)</span>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Contoh: Pak Eko" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Nomor HP (opsional)</span>
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
        </label>

        {selected && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total bayar</div>
            <div className="mt-1 text-2xl font-black text-slate-950">{formatRupiah(selected.price)}</div>
          </div>
        )}

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <button disabled={loading || !packageId} className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Membuat QRIS…" : "Beli Sekarang"}
        </button>
      </div>
    </form>
  );
}
