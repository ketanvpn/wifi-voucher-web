import { refreshOrder } from "@/lib/orderFlow";
import { formatRupiah } from "@/lib/format";
import { getSiteConfig } from "@/lib/config";
import { VoucherCopy } from "./voucher-copy";

export default async function SuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await refreshOrder(orderId);
  const site = getSiteConfig();
  const loginUrl = site.loginUrl.startsWith("http") ? site.loginUrl : `http://${site.loginUrl}`;
  const quantity = order ? order.quantity || order.vouchers?.length || 1 : 1;
  const unitPrice = order ? order.unitPrice || Math.round(order.amount / quantity) : 0;

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
            <p className="mt-2 text-sm leading-6 text-slate-500">Masukkan kode ini di halaman login hotspot WiFi. Satu kode untuk satu perangkat.</p>

            <VoucherCopy code={order.voucherCode} vouchers={order.vouchers} />

            <div className="mt-5 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
              <Info label="Paket" value={order.packageName} />
              <Info label="Jumlah" value={`${quantity} voucher`} />
              <Info label="Harga satuan" value={formatRupiah(unitPrice)} />
              <Info label="Total" value={formatRupiah(order.amount)} />
              <Info label="Status" value="Aktif setelah login" />
              <Info label="Order" value={order.paymentOrderId} mono />
            </div>

            <div className="mt-5 rounded-3xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              <div className="font-black">Cara pakai voucher</div>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Sambungkan perangkat ke WiFi <b>{site.wifiSsid}</b>.</li>
                <li>Kalau halaman login muncul otomatis, masukkan salah satu kode voucher di atas.</li>
                <li>Kalau halaman login tidak muncul, buka browser lalu masuk ke <a href={loginUrl} className="font-black underline">{site.loginUrl}</a>.</li>
              </ol>
              <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs leading-5 text-emerald-800">
                Tips: kalau masih belum muncul, matikan data seluler sebentar, lupakan WiFi lalu sambungkan ulang, kemudian buka link login manual di atas.
              </div>
            </div>
            <a href="/" className="mt-5 inline-flex w-full justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">Beli Paket Lain</a>
          </div>
        ) : (
          <div>
            <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Belum siap</div>
            <h1 className="mt-4 text-2xl font-black">Voucher belum tersedia</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Status saat ini: <b>{order.orderStatus}</b>. Jika sudah bayar, halaman checkout akan otomatis memproses voucher.</p>
            {order.vouchers && order.vouchers.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                Sebagian voucher sudah berhasil dibuat: <b>{order.vouchers.length}/{quantity}</b>. Admin bisa retry dari Telegram.
              </div>
            )}
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
