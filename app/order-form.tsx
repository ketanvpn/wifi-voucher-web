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
    <form id="checkout" onSubmit={submit} className="rounded-[2rem] border border-white/15 bg-white p-5 text-slate-950 shadow-2xl shadow-cyan-950/30 sm:p-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Checkout</div>
        <h2 className="mt-2 text-2xl font-black">Beli Voucher WiFi</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Isi singkat, bayar QRIS, kode voucher langsung tampil setelah payment sukses.</p>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-black text-slate-800">Pilih paket</span>
          <div className="mt-2 grid gap-2">
            {packages.map((pkg) => (
              <button key={pkg.id} type="button" onClick={() => setPackageId(pkg.id)} className={`rounded-2xl border p-4 text-left transition ${packageId === pkg.id ? "border-cyan-500 bg-cyan-50 ring-4 ring-cyan-100" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-slate-950">{pkg.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{pkg.description || "Voucher WiFi"}</div>
                  </div>
                  <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{formatRupiah(pkg.price)}</div>
                </div>
              </button>
            ))}
          </div>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-black text-slate-800">Nama</span>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Contoh: Pak Eko" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100" />
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-800">Nomor HP</span>
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100" />
          </label>
        </div>

        {selected && (
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-cyan-50 p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-slate-500">Total bayar</div>
                <div className="mt-1 text-3xl font-black text-slate-950">{formatRupiah(selected.price)}</div>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">QRIS</div>
            </div>
          </div>
        )}

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        <button disabled={loading || !packageId || packages.length === 0} className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-5 py-4 text-sm font-black text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Membuat QRIS…" : "Bayar Sekarang"}
        </button>

        <p className="text-center text-xs leading-5 text-slate-500">Dengan lanjut, kamu akan diarahkan ke halaman QRIS. Simpan kode voucher setelah pembayaran berhasil.</p>
      </div>
    </form>
  );
}
