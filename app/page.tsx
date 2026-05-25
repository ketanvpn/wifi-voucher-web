import { getPackages, getSiteConfig } from "@/lib/config";
import { formatRupiah } from "@/lib/format";
import OrderForm from "./order-form";

export default function HomePage() {
  const site = getSiteConfig();
  const packages = getPackages();
  const cheapest = packages.length ? Math.min(...packages.map((p) => p.price)) : 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-6xl px-4 pb-10 pt-6 sm:pt-10">
        <nav className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/10 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-emerald-300 text-xl font-black text-slate-950 shadow-lg shadow-cyan-500/20">W</div>
            <div>
              <div className="text-sm font-black leading-tight">{site.name}</div>
              <div className="text-[11px] text-slate-300">Voucher WiFi QRIS Otomatis</div>
            </div>
          </div>
          <a href="/help" className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-slate-100 transition hover:bg-white/10">Bantuan</a>
        </nav>

        <div className="grid items-start gap-6 py-8 lg:grid-cols-[1.05fr_420px] lg:py-12">
          <div className="pt-2 lg:pt-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,.8)]" />
              Bayar QRIS • Voucher langsung keluar
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Internet cepat, <span className="bg-gradient-to-r from-cyan-200 via-emerald-200 to-yellow-100 bg-clip-text text-transparent">bayar gampang.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{site.subtitle}</p>

            <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
              <HeroStat label="Mulai dari" value={cheapest ? formatRupiah(cheapest) : "-"} />
              <HeroStat label="Pembayaran" value="QRIS" />
              <HeroStat label="Aktivasi" value="Otomatis" />
            </div>

            <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-100">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-cyan-300/15">⚡</span>
                Cara beli super singkat
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                <Step no="1" title="Pilih paket" text="Pilih durasi WiFi." />
                <Step no="2" title="Scan QRIS" text="Bayar pakai e-wallet/bank." />
                <Step no="3" title="Login" text="Kode voucher muncul otomatis." />
              </div>
            </div>
          </div>

          <OrderForm packages={packages} />
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Paket Voucher</h2>
              <p className="mt-1 text-sm text-slate-300">Pilih yang cocok. Semua paket aktif setelah kode berhasil login.</p>
            </div>
            <div className="text-xs font-bold text-emerald-200">Harga final • tanpa login akun</div>
          </div>

          {packages.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-amber-200/30 bg-amber-300/10 p-4 text-sm text-amber-100">Paket belum diset oleh admin.</div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg, index) => (
                <div key={pkg.id} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.14] to-white/[0.05] p-5 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-cyan-200/40">
                  {index === 0 && <div className="absolute right-4 top-4 rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-950">Favorit</div>}
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/15 text-xl">📶</div>
                  <h3 className="mt-4 text-xl font-black">{pkg.name}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-slate-300">{pkg.description || "Voucher WiFi siap pakai."}</p>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Harga</div>
                      <div className="text-2xl font-black text-white">{formatRupiah(pkg.price)}</div>
                    </div>
                    <a href="#checkout" className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-100">Beli</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function Step({ no, title, text }: { no: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-3">
      <div className="flex items-center gap-2 font-bold text-white"><span className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs text-slate-950">{no}</span>{title}</div>
      <div className="mt-2 text-xs leading-5 text-slate-400">{text}</div>
    </div>
  );
}
