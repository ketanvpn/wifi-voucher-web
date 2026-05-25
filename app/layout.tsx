import type { Metadata } from "next";
import "./globals.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "TAPEKETAN WiFi";

export const metadata: Metadata = {
  title: siteName,
  description: "Beli voucher WiFi via QRIS, kode voucher muncul otomatis setelah pembayaran sukses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
