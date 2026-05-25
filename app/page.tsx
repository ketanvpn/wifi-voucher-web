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

      <section className="relative mx-auto max-w-5xl px-4 pb-10 pt-5 sm:pt-8">
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

        <div className="py-7 text-center sm:py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,.8)]" />
            QRIS aktif • voucher otomatis
          </div>

          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            Beli Voucher WiFi <span className="bg-gradient-to-r from-cyan-200 via-emerald-200 to-yellow-100 bg-clip-text text-transparent">Tanpa Ribet</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{site.subtitle}</p>

          <div className="mx-auto mt-5 inline-flex rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-slate-100 backdrop-blur-xl">
            Mulai dari <span className="ml-1 text-cyan-200">{cheapest ? formatRupiah(cheapest) : "-"}</span>
          </div>
        </div>

        <OrderForm packages={packages} />

        <div className="mx-auto mt-5 grid max-w-3xl gap-3 text-center text-xs text-slate-300 sm:grid-cols-3">
          <MiniStep title="1. Pilih Paket" text="Tap paket yang mau dibeli." />
          <MiniStep title="2. Bayar QRIS" text="Scan dari e-wallet/bank." />
          <MiniStep title="3. Login WiFi" text="Kode muncul otomatis." />
        </div>
      </section>
    </main>
  );
}

function MiniStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
      <div className="font-black text-white">{title}</div>
      <div className="mt-1 leading-5">{text}</div>
    </div>
  );
}
