"use client";

import { useState } from "react";
import type { VoucherPackage } from "@/lib/types";
import { formatRupiah } from "@/lib/format";

const MAX_QUANTITY = 10;

export default function OrderForm({ packages }: { packages: VoucherPackage[] }) {
  const [packageId, setPackageId] = useState(packages[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selected = packages.find((p) => p.id === packageId);
  const safeQuantity = Math.min(MAX_QUANTITY, Math.max(1, Math.floor(quantity || 1)));
  const total = selected ? selected.price * safeQuantity : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!packageId || !selected) return;
    setQuantity(safeQuantity);
    setConfirmOpen(true);
  }

  function updateQuantity(next: number) {
    setQuantity(Math.min(MAX_QUANTITY, Math.max(1, Math.floor(next || 1))));
  }

  async function createOrder() {
    if (!packageId || !selected) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, quantity: safeQuantity, customerName, customerPhone }),
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
    <form onSubmit={submit} className="mx-auto max-w-3xl rounded-[2rem] border border-white/15 bg-white p-4 text-slate-950 shadow-2xl shadow-cyan-950/30 sm:p-5">
      <div className="flex items-start justify-between gap-4 px-1 py-2">
        <div>
          <h2 className="text-2xl font-black">Mau beli paket yang mana?</h2>
          <p className="mt-1 text-sm text-slate-500">Pilih paket, jumlah perangkat, lalu lanjut bayar QRIS.</p>
        </div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">QRIS siap</div>
      </div>

      {packages.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Paket belum diset oleh admin.</div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {packages.map((pkg) => {
            const active = packageId === pkg.id;
            return (
              <button key={pkg.id} type="button" onClick={() => setPackageId(pkg.id)} className={`group relative min-h-32 overflow-hidden rounded-3xl border p-3 text-left shadow-sm transition active:scale-[0.99] sm:p-4 ${active ? "border-cyan-400 bg-gradient-to-br from-cyan-100 via-white to-emerald-100 ring-4 ring-cyan-100" : "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50 hover:border-cyan-300 hover:shadow-md"}`}>
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-300/25 blur-2xl transition group-hover:bg-cyan-300/40" />
                <div className="pointer-events-none absolute bottom-0 right-0 text-5xl opacity-[0.08] sm:text-6xl">📶</div>
                <div className="relative flex items-start justify-between gap-2">
                  <div className="rounded-2xl bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-100">WiFi</div>
                  {active && <div className="grid h-6 w-6 place-items-center rounded-full bg-cyan-500 text-xs font-black text-white shadow-lg shadow-cyan-500/30">✓</div>}
                </div>
                <div className="relative mt-3 text-base font-black leading-tight text-slate-950 sm:text-lg">{pkg.name}</div>
                <div className="relative mt-1 line-clamp-2 min-h-8 text-[11px] leading-4 text-slate-500">{pkg.description || "Voucher WiFi"}</div>
                <div className="relative mt-3 text-xl font-black text-slate-950 sm:text-2xl">{formatRupiah(pkg.price)}</div>
              </button>
            );
          })}
        </div>
      )}

      <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-black text-slate-700">Kirim voucher ke WhatsApp? <span className="font-bold text-slate-400">Opsional</span></summary>
        <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
          Isi nama dan nomor HP kalau ingin kode voucher ikut dikirim ke WhatsApp. Kalau dikosongkan juga tidak apa-apa, voucher tetap muncul di halaman setelah pembayaran berhasil.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama pembeli" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="Nomor WhatsApp aktif" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
        </div>
      </details>

      {selected && (
        <div className="mt-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-400">Total bayar</div>
              <div className="mt-1 text-3xl font-black">{formatRupiah(total)}</div>
              <div className="mt-1 text-xs font-bold text-slate-400">{safeQuantity} voucher × {formatRupiah(selected.price)}</div>
            </div>
            <div className="flex items-center rounded-2xl bg-white/10 p-1 ring-1 ring-white/10">
              <button type="button" onClick={() => updateQuantity(safeQuantity - 1)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xl font-black text-white transition hover:bg-white/20 disabled:opacity-30" disabled={safeQuantity <= 1}>−</button>
              <input
                aria-label="Jumlah voucher"
                value={safeQuantity}
                onChange={(e) => updateQuantity(Number(e.target.value))}
                inputMode="numeric"
                className="h-10 w-12 border-0 bg-transparent text-center text-xl font-black text-white outline-none"
              />
              <button type="button" onClick={() => updateQuantity(safeQuantity + 1)} className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-xl font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40" disabled={safeQuantity >= MAX_QUANTITY}>+</button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-xs font-bold text-cyan-100">
            <span>Jumlah perangkat/voucher</span>
            <span>Bayar sekali QRIS</span>
          </div>
        </div>
      )}

      {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <button disabled={loading || !packageId || packages.length === 0} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-5 py-4 text-base font-black text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">
        Lanjut Bayar QRIS
      </button>

      {confirmOpen && selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-5 text-slate-950 shadow-2xl">
            <div className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">Konfirmasi Pembelian</div>
            <h3 className="mt-3 text-2xl font-black">Sudah sesuai?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Cek paket, jumlah voucher, dan total sebelum QRIS dibuat.</p>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-slate-400">Paket</div>
                  <div className="mt-1 text-lg font-black">{selected.name}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{selected.description || "Voucher WiFi"}</div>
                </div>
                <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{safeQuantity}x</div>
              </div>
              <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                <Line label="Harga satuan" value={formatRupiah(selected.price)} />
                <Line label="Jumlah voucher" value={`${safeQuantity} kode`} />
                <Line label="Total bayar" value={formatRupiah(total)} strong />
              </div>
            </div>

            {(customerName || customerPhone) && (
              <div className="mt-3 rounded-2xl bg-cyan-50 p-3 text-xs leading-5 text-cyan-900">
                {customerName && <div><b>Nama:</b> {customerName}</div>}
                {customerPhone && <div><b>HP:</b> {customerPhone}</div>}
              </div>
            )}

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button type="button" disabled={loading} onClick={() => setConfirmOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Ubah Dulu
              </button>
              <button type="button" disabled={loading} onClick={createOrder} className="rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-50">
                {loading ? "Membuat QRIS…" : "Ya, Buat QRIS"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "text-base font-black text-slate-950" : "font-bold text-slate-800"}>{value}</span>
    </div>
  );
}
