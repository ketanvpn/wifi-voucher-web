import { refreshOrder } from "@/lib/orderFlow";
import { formatRupiah } from "@/lib/format";

export default async function SuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await refreshOrder(orderId);

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-400/25 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl md:p-8">
        {!order ? (
          <div>
            <h1 className="text-2xl font-black">Order tidak ditemukan</h1>
            <a href="/" className="mt-5 inline-flex rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950">Kembali</a>
          </div>
        ) : order.orderStatus === "paid_delivered" ? (
          <div>
            <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">✅ Voucher berhasil dibuat</div>
            <h1 className="mt-4 text-3xl font-black tracking-tight">Kode Voucher WiFi</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Masukkan kode ini di halaman login hotspot WiFi. Simpan dulu sebelum menutup halaman.</p>

            <div className="mt-6 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-center text-white shadow-2xl shadow-cyan-950/20">
              <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200">Voucher</div>
              <div className="mt-4 select-all break-all font-mono text-5xl font-black tracking-widest sm:text-6xl">{order.voucherCode}</div>
              <div className="mt-4 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-slate-300">Tap & tahan untuk salin kode</div>
            </div>

            <div className="mt-5 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
              <Info label="Paket" value={order.packageName} />
              <Info label="Total" value={formatRupiah(order.amount)} />
              <Info label="Status" value="Aktif setelah login" />
              <Info label="Order" value={order.paymentOrderId} mono />
            </div>

            <div className="mt-5 rounded-3xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
              <b>Cara pakai:</b> sambungkan ke WiFi, buka browser kalau halaman login belum muncul, lalu masukkan kode voucher di atas.
            </div>
            <a href="/" className="mt-5 inline-flex w-full justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">Beli Paket Lain</a>
          </div>
        ) : (
          <div>
            <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Belum siap</div>
            <h1 className="mt-4 text-2xl font-black">Voucher belum tersedia</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Status saat ini: <b>{order.orderStatus}</b>. Jika sudah bayar, halaman checkout akan otomatis memproses voucher.</p>
            <a href={`/checkout/${order.id}`} className="mt-5 inline-flex rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950">Kembali ke Checkout</a>
          </div>
        )}
      </div>
    </main>
  );
}

function Info({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 font-bold text-slate-900 ${mono ? "font-mono text-xs" : ""}`}>{value || "-"}</div>
    </div>
  );
}
