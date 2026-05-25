import { getSiteConfig } from "@/lib/config";

export default function HelpPage() {
  const site = getSiteConfig();
  const wa = site.supportWhatsapp;
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
        <h1 className="text-2xl font-black text-slate-950">Cara Login WiFi</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">
            Nama WiFi:<br /><b>{site.wifiSsid}</b>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
            Login manual:<br /><b>{site.loginUrl}</b>
          </div>
        </div>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-600">
          <li>Sambungkan perangkat ke WiFi <b className="font-black text-slate-900">{site.wifiSsid}</b>.</li>
          <li>Buka browser, biasanya halaman login hotspot muncul otomatis.</li>
          <li>Kalau halaman login tidak muncul, ketik manual <b className="font-black text-slate-900">{site.loginUrl}</b> di browser.</li>
          <li>Masukkan kode voucher yang muncul setelah pembayaran.</li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={site.loginUrl.startsWith("http") ? site.loginUrl : `http://${site.loginUrl}`} className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Buka Login Manual</a>
          {wa && (
            <a href={`https://wa.me/${wa}`} className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Hubungi Admin</a>
          )}
        </div>
      </div>
    </main>
  );
}
