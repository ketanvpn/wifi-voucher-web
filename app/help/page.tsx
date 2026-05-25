import { getSiteConfig } from "@/lib/config";

export default function HelpPage() {
  const site = getSiteConfig();
  const wa = site.supportWhatsapp;
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
        <h1 className="text-2xl font-black text-slate-950">Cara Login WiFi</h1>
        <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">
          Nama WiFi: <b>{site.wifiSsid}</b>
        </div>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-600">
          <li>Sambungkan perangkat ke WiFi <b className="font-black text-slate-900">{site.wifiSsid}</b>.</li>
          <li>Buka browser, biasanya halaman login hotspot muncul otomatis.</li>
          <li>Masukkan kode voucher yang muncul setelah pembayaran.</li>
          <li>Jika halaman login tidak muncul, coba buka situs apa saja dari browser.</li>
        </ol>
        {wa && (
          <a href={`https://wa.me/${wa}`} className="mt-6 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Hubungi Admin</a>
        )}
      </div>
    </main>
  );
}
