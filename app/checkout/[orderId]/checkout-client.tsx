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
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:p-7">
        <div className="text-sm font-semibold text-sky-700">Checkout QRIS</div>
        <h1 className="mt-2 text-2xl font-black text-slate-950">Selesaikan Pembayaran</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Scan QRIS di bawah. Setelah pembayaran sukses, voucher akan muncul otomatis.</p>

        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {!order ? (
          <div className="mt-6 h-80 animate-pulse rounded-2xl bg-slate-100" />
        ) : (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-950">{order.packageName}</div>
                  <div className="mt-1 font-mono text-xs text-slate-500">{order.paymentOrderId}</div>
                </div>
                <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-bold text-white">{formatRupiah(order.amount)}</div>
              </div>
            </div>

            <StatusBox status={order.status} paymentStatus={order.paymentStatus} error={order.errorMessage} />

            {order.paymentUrl ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={order.paymentUrl} alt="QRIS pembayaran" className="mx-auto h-auto max-w-full rounded-2xl" />
              </div>
            ) : order.qrString ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Provider memberi QR string, tapi belum ada QR image URL. QR string: <code>{order.qrString.slice(0, 40)}…</code>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">QRIS belum tersedia. Coba refresh sebentar lagi.</div>
            )}

            <div className="flex flex-wrap gap-2">
              <a href="/" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Beli Paket Lain</a>
              <a href={`/success/${order.orderId}`} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Cek Voucher</a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBox({ status, paymentStatus, error }: { status: string; paymentStatus: string; error?: string }) {
  const paid = status === "paid_delivered";
  const pendingVoucher = status === "paid_pending_voucher";
  return (
    <div className={`rounded-2xl border p-4 text-sm ${paid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : pendingVoucher ? "border-amber-200 bg-amber-50 text-amber-800" : "border-sky-200 bg-sky-50 text-sky-800"}`}>
      <div className="font-bold">Status: {status}</div>
      <div className="mt-1">Payment: {paymentStatus}</div>
      {error && <div className="mt-2 text-xs">Catatan: {error}</div>}
    </div>
  );
}
