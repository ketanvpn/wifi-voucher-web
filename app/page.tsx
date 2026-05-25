import { getPackages, getSiteConfig } from "@/lib/config";
import { formatRupiah } from "@/lib/format";
import OrderForm from "./order-form";

export default function HomePage() {
  const site = getSiteConfig();
  const packages = getPackages();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-100">
      <section className="mx-auto max-w-5xl px-4 py-10 text-white sm:py-14">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="inline-flex rounded-full bg-sky-400/15 px-3 py-1 text-xs font-semibold text-sky-200 ring-1 ring-sky-300/20">
            QRIS otomatis • Voucher muncul setelah paid
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">{site.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{site.subtitle}</p>
        </div>
      </section>

      <section className="mx-auto -mt-8 max-w-5xl px-4 pb-12">
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:p-6">
            <h2 className="text-lg font-bold text-slate-950">Pilih Paket Voucher</h2>
            <p className="mt-1 text-sm text-slate-500">Pilih durasi internet, isi kontak opsional, lalu bayar QRIS.</p>

            {packages.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Paket belum diset. Admin perlu mengisi <code>VOUCHER_PACKAGES_JSON</code> di environment.
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {packages.map((pkg) => (
                  <label key={pkg.id} className="group cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50">
                    <input className="peer sr-only" type="radio" name="package-preview" value={pkg.id} readOnly />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-950">{pkg.name}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">{pkg.description || "Voucher WiFi"}</div>
                      </div>
                      <div className="rounded-full bg-slate-950 px-3 py-1 text-sm font-bold text-white">{formatRupiah(pkg.price)}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <OrderForm packages={packages} />
        </div>

        <div className="mt-6 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
          <InfoCard title="1. Pilih paket" text="Pilih durasi voucher sesuai kebutuhan." />
          <InfoCard title="2. Bayar QRIS" text="Scan QRIS dari aplikasi e-wallet/bank." />
          <InfoCard title="3. Pakai voucher" text="Kode voucher muncul otomatis setelah pembayaran sukses." />
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="font-semibold text-slate-950">{title}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500">{text}</div>
    </div>
  );
}
