"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";

type OrderView = {
  orderId: string;
  paymentOrderId: string;
  amount: number;
  packageName: string;
  status: string;
  paymentStatus: string;
  paymentUrl?: string;
  qrString?: string;
  voucherCode?: string;
  errorMessage?: string;
  expiresAt?: string;
};

export default function CheckoutClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "Order tidak ditemukan");
        if (!active) return;
        setOrder(body.data);
        setError("");
        if (body.data.status === "paid_delivered") {
          window.location.href = `/success/${orderId}`;
        }
      } catch (err) {
        if (active) setError((err as Error).message);
      }
    }
    load();
    const timer = window.setInterval(load, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [orderId]);

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-6 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-2xl">
        <a href="/" className="mb-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10">← Kembali</a>
        <div className="rounded-[2rem] border border-white/10 bg-white p-5 text-slate-950 shadow-2xl md:p-7">
          <div className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">Checkout QRIS</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Selesaikan Pembayaran</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Scan QRIS, lalu tunggu sebentar. Halaman ini otomatis mengecek pembayaran setiap 3 detik.</p>

          {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          {!order ? (
            <div className="mt-6 h-96 animate-pulse rounded-3xl bg-slate-100" />
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-black">{order.packageName}</div>
                    <div className="mt-1 font-mono text-[11px] text-slate-400">{order.paymentOrderId}</div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-950">{formatRupiah(order.amount)}</div>
                </div>
              </div>

              <StatusBox status={order.status} paymentStatus={order.paymentStatus} error={order.errorMessage} />

              {order.paymentUrl ? (
                <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 text-center shadow-inner">
                  <div className="mb-3 text-sm font-black text-slate-700">Scan QRIS ini</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={order.paymentUrl} alt="QRIS pembayaran" className="mx-auto h-auto w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-2" />
                  <p className="mt-3 text-xs leading-5 text-slate-500">Gunakan GoPay, DANA, OVO, ShopeePay, mobile banking, atau aplikasi QRIS lain.</p>
                </div>
              ) : order.qrString ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">QR string tersedia, tapi gambar QR belum muncul. Tunggu sebentar atau hubungi admin.</div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">QRIS belum tersedia. Coba refresh sebentar lagi.</div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <a href="/" className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-black text-slate-700 hover:bg-slate-50">Beli Paket Lain</a>
                <a href={`/success/${order.orderId}`} className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800">Cek Voucher</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatusBox({ status, paymentStatus, error }: { status: string; paymentStatus: string; error?: string }) {
  const paid = status === "paid_delivered";
  const pendingVoucher = status === "paid_pending_voucher";
  return (
    <div className={`rounded-3xl border p-4 text-sm ${paid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : pendingVoucher ? "border-amber-200 bg-amber-50 text-amber-800" : "border-cyan-200 bg-cyan-50 text-cyan-800"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-black">{paid ? "Pembayaran sukses" : pendingVoucher ? "Sudah bayar, voucher diproses" : "Menunggu pembayaran"}</div>
          <div className="mt-1 text-xs">Order: {status} • Payment: {paymentStatus}</div>
        </div>
        {!paid && <div className="h-3 w-3 animate-pulse rounded-full bg-current" />}
      </div>
      {error && <div className="mt-2 text-xs">Catatan: {error}</div>}
    </div>
  );
}
