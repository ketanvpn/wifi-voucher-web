# WiFi Voucher Web

Web pembelian voucher WiFi TAPEKETAN/TK Net via QRIS.

Flow MVP:

```text
Customer pilih paket
→ Web create order
→ KetantechPay create QRIS
→ Customer bayar
→ Web polling KetantechPay status
→ Jika success, web panggil internal bot MikroTik untuk generate voucher
→ Voucher tampil ke customer
```

## Stack

- Next.js 15 fullstack
- Tailwind CSS
- File JSON store untuk MVP (`data/orders.json`)
- Payment via KetantechPay (`/api/v1/payments/charge`)
- Voucher generation via internal MikroTik bot API

## Setup lokal

```bash
cp .env.example .env.local
npm install
npm run dev
```

Buka:

```text
http://localhost:3010
```

Untuk development tanpa bot internal, set:

```env
WIFI_VOUCHER_MOCK_GENERATE=true
```

## Environment penting

```env
KETANTECHPAY_BASE_URL=https://pay.ketantech.my.id
KETANTECHPAY_CLIENT_KEY=isi_client_key_dari_dashboard
BOT_INTERNAL_GENERATE_URL=http://127.0.0.1:8082/internal/generate-voucher
BOT_INTERNAL_TOKEN=isi_token_internal
VOUCHER_PACKAGES_JSON=[{"id":"1-jam","profile":"1 Jam","name":"1 Jam","price":2000,"enabled":true}]
```

Jangan taruh AutoGoPay API key di app ini. AutoGoPay credential cukup di KetantechPay dashboard.

## Routes

- `/` — landing + pilih paket
- `/checkout/:orderId` — tampil QRIS + polling status
- `/success/:orderId` — tampil voucher jika sudah delivered
- `/help` — instruksi login WiFi

## API

- `GET /api/packages`
- `POST /api/orders`
- `GET /api/orders/:orderId`

## Status order

- `waiting_payment`
- `paid_generating`
- `paid_delivered`
- `paid_pending_voucher`
- `payment_expired`
- `payment_failed`

## Deploy VPS singkat

```bash
git pull --ff-only origin main
npm ci
npm run build
systemctl restart wifi-voucher-web.service
```

Lihat detail di `docs/DEPLOY-VPS.md`.
