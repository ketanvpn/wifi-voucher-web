import { refreshOrder } from "@/lib/orderFlow";
import { formatRupiah } from "@/lib/format";

export default async function SuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await refreshOrder(orderId);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
        {!order ? (
          <div>
            <h1 className="text-2xl font-black text-slate-950">Order tidak ditemukan</h1>
            <a href="/" className="mt-5 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white">Kembali</a>
          </div>
        ) : order.orderStatus === "paid_delivered" ? (
          <div>
            <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Voucher berhasil dibuat</div>
            <h1 className="mt-4 text-2xl font-black text-slate-950">Kode Voucher WiFi</h1>
            <div className="mt-6 rounded-3xl bg-slate-950 p-6 text-center text-white">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Voucher</div>
              <div className="mt-3 select-all font-mono text-5xl font-black tracking-widest">{order.voucherCode}</div>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <div><b>Paket:</b> {order.packageName}</div>
              <div><b>Total:</b> {formatRupiah(order.amount)}</div>
              <div><b>Order:</b> <code>{order.paymentOrderId}</code></div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">Simpan kode ini dan jangan dibagikan ke orang lain. Masukkan kode voucher di halaman login WiFi.</p>
          </div>
        ) : (
          <div>
            <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Belum siap</div>
            <h1 className="mt-4 text-2xl font-black text-slate-950">Voucher belum tersedia</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Status saat ini: <b>{order.orderStatus}</b>. Jika sudah bayar, halaman checkout akan otomatis memproses voucher.</p>
            <a href={`/checkout/${order.id}`} className="mt-5 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white">Kembali ke Checkout</a>
          </div>
        )}
      </div>
    </main>
  );
}
