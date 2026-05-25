# PRD Mini — Web Pembelian Voucher WiFi QRIS

---

## 0. Update Keputusan Arsitektur — 2026-05-25

Setelah KetantechPay/AppGateway stabil dan AutoGoPay provider sudah aktif, Web Voucher **tidak lagi direct call AutoGoPay**.

Flow final MVP:

```text
Web Voucher
→ POST KetantechPay /api/v1/payments/charge
→ KetantechPay provider AutoGoPay generate QRIS
→ AutoGoPay webhook hanya ke KetantechPay /api/v1/webhooks/autogopay
→ Web Voucher polling GET /api/v1/payments?orderId=WIFI-...
→ Jika success, Web Voucher panggil internal MikroTik voucher bot API
→ voucher tampil ke customer
```

Alasan:
- AutoGoPay hanya perlu satu webhook URL.
- AutoGoPay API key cukup disimpan di KetantechPay credentials, bukan di Web Voucher.
- Produk internal dibedakan dengan prefix `WIFI-...` dan `VPN-...`.
- BotVPN dan Web Voucher sama-sama memakai KetantechPay sebagai payment hub pusat.

MVP project dibuat di:

```text
/root/.openclaw/workspace/projects/wifi-voucher-web
```

Stack awal:
- Next.js fullstack.
- Payment via KetantechPay client key.
- Order store file JSON dulu untuk MVP, mudah diganti SQLite/Postgres nanti.
- Voucher generation via internal bot endpoint `BOT_INTERNAL_GENERATE_URL`.

---

## 1. Tujuan

Membuat web sederhana untuk customer membeli voucher WiFi TAPEKETAN/TK Net secara mandiri:

1. Customer pilih paket voucher.
2. Customer bayar QRIS.
3. Setelah pembayaran sukses, sistem generate voucher MikroTik otomatis.
4. Voucher tampil di web dan tersimpan di log/admin bot.

Target utama: mengurangi jualan manual dari chat, tapi tetap aman kalau payment/router bermasalah.

---

## 2. Prinsip Utama

- **Payment dulu, voucher kemudian.** Voucher hanya dibuat setelah pembayaran terkonfirmasi.
- **Idempotent.** 1 invoice/payment sukses hanya boleh menghasilkan 1 voucher.
- **Aman kalau gagal.** Kalau customer sudah bayar tapi MikroTik gagal generate, transaksi masuk `paid_pending_voucher` dan bot/admin dapat alert.
- **MikroTik credential tidak pernah ada di frontend.** Semua generate voucher lewat backend/internal bot API.
- **Mulai kecil dulu.** Tidak perlu login customer, cart, dashboard rumit, atau multi-router di v1.

---

## 3. User Flow Customer

### Flow Normal

1. Customer buka web voucher.
2. Pilih paket: contoh `1 Jam`, `2 Jam`, `4 Jam`, `1 Hari`.
3. Isi nama dan nomor HP opsional.
4. Klik **Beli Sekarang**.
5. Web membuat invoice QRIS.
6. Customer scan QRIS dan bayar.
7. Web polling status pembayaran.
8. Jika paid:
   - backend generate voucher ke MikroTik
   - simpan transaksi
   - tampilkan kode voucher dan instruksi login
9. Customer pakai voucher di hotspot login page.

### Flow Gagal Generate Voucher

1. Payment sukses.
2. Backend gagal generate voucher karena MikroTik/API down.
3. Status transaksi: `paid_pending_voucher`.
4. Customer melihat pesan: “Pembayaran diterima, voucher sedang diproses.”
5. Bot Telegram admin menerima alert + tombol retry/manual.

---

## 4. Admin Flow

Admin/Bos bisa dari Telegram bot:

- Lihat transaksi terbaru.
- Cari invoice/voucher/customer.
- Retry generate voucher untuk transaksi `paid_pending_voucher`.
- Cek pembayaran/voucher kalau customer komplain.

Untuk v1, admin panel web belum wajib. Bot cukup jadi admin console.

---

## 5. Paket Voucher

Sumber paket direkomendasikan dari profile yang sudah visible di bot generate voucher.

Contoh field:

```json
{
  "id": "1-jam",
  "name": "1 Jam",
  "price": 2000,
  "cost": 1500,
  "description": "Internet WiFi 1 jam",
  "enabled": true
}
```

Catatan:
- Jangan tampilkan profile system: `default`, `admin`, `Block`, `gratis`, `1M`.
- Harga ambil dari Profile Manager / on-login script seperti bot sekarang.

---

## 6. Payment QRIS

Provider awal: **KetantechPay QRIS** dengan backend provider AutoGoPay.

Yang dibutuhkan dari provider:

- Create invoice / generate QRIS.
- Cek status pembayaran atau webhook paid.
- Nominal unik/invoice id.

Status payment:

- `pending`
- `paid`
- `expired`
- `failed`

---

## 7. Status Transaksi Internal

Status internal sistem:

- `created` — invoice dibuat.
- `waiting_payment` — menunggu customer bayar.
- `paid_generating` — payment sukses, sedang generate voucher.
- `paid_delivered` — voucher berhasil dibuat dan ditampilkan.
- `paid_pending_voucher` — payment sukses, voucher gagal dibuat, perlu retry.
- `payment_expired` — invoice expired.
- `cancelled` — dibatalkan admin/system.

---

## 8. Database Minimal

### `voucher_orders`

| Field | Type | Note |
|---|---|---|
| id | string | internal order id |
| invoice_id | string | id dari payment provider |
| customer_name | string nullable | nama pembeli |
| customer_phone | string nullable | nomor HP |
| profile | string | profile MikroTik |
| amount | integer | harga jual |
| cost | integer | modal |
| margin | integer | profit |
| payment_status | string | pending/paid/expired/failed |
| order_status | string | internal status |
| voucher_code | string nullable | terisi setelah generate sukses |
| qris_url | string nullable | QR image/url |
| provider_payload | json | raw response provider |
| paid_at | datetime nullable | waktu payment sukses |
| delivered_at | datetime nullable | waktu voucher dibuat |
| created_at | datetime | waktu order dibuat |
| updated_at | datetime | waktu update terakhir |

### Constraint penting

- `invoice_id` unique.
- `voucher_code` unique jika tidak null.
- Generate voucher harus idempotent berdasarkan `order_id`/`invoice_id`.

---

## 9. API Minimal

### Public API

#### `GET /api/packages`
Ambil paket voucher aktif.

#### `POST /api/orders`
Buat order + invoice QRIS.

Body:
```json
{
  "profile": "1-jam",
  "customerName": "Eko",
  "customerPhone": "0822..."
}
```

Response:
```json
{
  "orderId": "ord_xxx",
  "invoiceId": "inv_xxx",
  "amount": 2000,
  "status": "waiting_payment",
  "qrisUrl": "https://...",
  "expiresAt": "..."
}
```

#### `GET /api/orders/:orderId`
Cek status order.

Response jika paid dan voucher ready:
```json
{
  "orderId": "ord_xxx",
  "status": "paid_delivered",
  "voucherCode": "123456",
  "profile": "1-jam",
  "amount": 2000
}
```

### Provider Callback

#### Webhook provider
Webhook AutoGoPay diterima oleh KetantechPay di `/api/v1/webhooks/autogopay`; Web Voucher cukup polling status payment dari KetantechPay.

Harus:
- validasi signature/token jika tersedia
- idempotent
- jika paid: trigger generate voucher

### Internal/Admin API

#### `POST /api/admin/orders/:orderId/retry-generate`
Retry generate voucher untuk order `paid_pending_voucher`.

---

## 10. Integrasi Bot/MikroTik

Rekomendasi v1:

Backend web tidak langsung pegang API MikroTik baru, tapi memanggil module/fungsi yang sama dengan bot atau endpoint internal bot.

Pilihan implementasi:

### Opsi A — Web Backend langsung import logic bot
- Cepat kalau satu server dan satu codebase.
- Tapi coupling tinggi.

### Opsi B — Bot expose internal local API
- Backend call `http://127.0.0.1:<port>/internal/generate-voucher`.
- Lebih rapi.
- Perlu token internal.

Rekomendasi: **Opsi B**.

Internal endpoint contoh:

`POST /internal/generate-voucher`
```json
{
  "profile": "1-jam",
  "qty": 1,
  "customerName": "Eko",
  "customerPhone": "0822...",
  "source": "web_order",
  "orderId": "ord_xxx"
}
```

Response:
```json
{
  "ok": true,
  "voucherCode": "123456"
}
```

---

## 11. Halaman Web

### `/`
Landing + pilih paket.

### `/checkout/:orderId`
Tampilkan QRIS + status polling.

### `/success/:orderId`
Tampilkan voucher.

### `/help`
Instruksi login dan kontak admin.

---

## 12. UX Copy Penting

Saat menunggu payment:

> Scan QRIS di bawah ini. Setelah pembayaran berhasil, voucher akan muncul otomatis.

Saat voucher ready:

> Voucher berhasil dibuat. Simpan kode ini dan jangan dibagikan ke orang lain.

Saat paid tapi voucher pending:

> Pembayaran sudah diterima. Voucher sedang diproses. Jika belum muncul dalam 1 menit, hubungi admin dengan kode order ini.

---

## 13. Risiko & Mitigasi

### Customer bayar tapi voucher gagal
Mitigasi:
- status `paid_pending_voucher`
- alert Telegram admin
- tombol retry

### Webhook dobel
Mitigasi:
- invoice unique
- jika voucher sudah ada, jangan generate ulang

### Router offline
Mitigasi:
- tampilkan pending
- retry otomatis/manual

### Salah harga/profile
Mitigasi:
- paket aktif ambil dari config/profile visible
- admin review paket sebelum publish

---

## 14. MVP Scope

### Masuk v1
- List paket
- Buat invoice QRIS
- Poll payment status
- Generate voucher setelah paid
- Tampilkan voucher
- Simpan order
- Alert admin jika generate gagal

### Tidak masuk v1
- Login customer
- Multi voucher per order
- Dashboard web lengkap
- Multi-router
- Refund otomatis
- WhatsApp API otomatis

---

## 15. Next Implementation Plan

1. Cek docs AutoGopay API yang Bos punya.
2. Tentukan project stack:
   - Frontend: Next.js
   - Backend: Hono/Node atau FastAPI/Python
   - DB: SQLite dulu atau PostgreSQL
3. Buat skeleton project.
4. Implement package list dari config/static dulu.
5. Implement create order dummy payment dulu.
6. Integrasi AutoGopay.
7. Integrasi generate voucher internal bot.
8. Test end-to-end pakai paket 1-jam kecil.


---

## 16. Bot-Managed Web Settings

Bos ingin semua pengaturan web pembelian voucher bisa dikelola lewat Telegram bot, bukan edit file/SSH.

### Prinsip

- Bot menjadi admin panel utama untuk web voucher.
- Setting tersimpan di database/config lokal, bukan hardcoded.
- Secret tetap di environment server (`.env`) dan tidak ditampilkan full di Telegram.
- Perubahan setting harus ada preview + konfirmasi sebelum apply.

### Menu Bot Baru yang Direkomendasikan

Di menu MikroTik atau menu khusus:

```text
🛒 Web Voucher
├─ 🟢 Status Web
├─ 📦 Paket Dijual
├─ 💳 Payment QRIS
├─ 🎨 Teks & Branding
├─ ⚙️ Aturan Order
├─ 🧾 Transaksi Web
└─ 🧪 Test Pembelian
```

### 16.1 Status Web

Menampilkan:
- Web aktif/nonaktif.
- Domain web.
- Payment provider aktif.
- AutoGopay reachable/tidak.
- Bot/internal voucher API reachable/tidak.
- Router/MikroTik reachable/tidak.
- Jumlah order hari ini.
- Order pending/gagal generate.

### 16.2 Paket Dijual

Admin bisa lewat bot:
- Lihat paket yang tampil di web.
- Aktif/nonaktifkan paket.
- Atur nama display: `1 Jam`, `2 Jam`, dll.
- Atur deskripsi pendek.
- Atur harga jual web jika mau override.
- Atur maksimal pembelian per order.

Sumber default:
- Ambil dari profile visible yang sudah dipakai menu generate voucher.
- Exclude profile system/test: `default`, `admin`, `Block`, `gratis`, `1M`.

### 16.3 Payment QRIS

Admin bisa lewat bot:
- Cek status AutoGopay API.
- Set payment mode: `live` / `maintenance` / `manual`.
- Set expiry invoice, default ikut provider sekitar 15 menit.
- Set instruksi pembayaran.
- Test generate QRIS nominal kecil.

Secret API key:
- Disimpan di `.env` sebagai `AUTOGOPAY_API_KEY`.
- Bot hanya boleh menampilkan masked key: `agp_02cb...f8c`.
- Update key boleh via bot, tapi harus disimpan sebagai secret dan tidak pernah dipantulkan full.

### 16.4 Teks & Branding

Admin bisa atur:
- Nama toko: `TAPEKETAN WiFi`.
- Subtitle.
- Nomor admin bantuan.
- Instruksi login hotspot.
- Pesan sukses setelah voucher tampil.
- Pesan kalau voucher pending.

### 16.5 Aturan Order

Admin bisa atur:
- Web buka/tutup.
- Jam operasional opsional.
- Maksimal order per customer/IP per jam.
- Timeout order unpaid.
- Auto retry generate voucher berapa kali.
- Alert admin kalau paid tapi voucher belum keluar.

### 16.6 Transaksi Web

Admin bisa lewat bot:
- Lihat order hari ini.
- Cari order by invoice/customer/voucher.
- Lihat order pending.
- Retry generate voucher.
- Tandai selesai/manual jika perlu.

### 16.7 Test Pembelian

Mode test untuk memastikan flow aman:
- Test create QRIS nominal kecil.
- Test webhook signature verification.
- Test generate voucher dummy/profile kecil.
- Test paid_pending_voucher simulation.

---

## 17. AutoGopay API Mapping

Base URL:

```text
https://v1-gateway.autogopay.site
```

Auth:

```http
Authorization: Bearer <AUTOGOPAY_API_KEY>
```

API key disimpan di `.env`, tidak ditulis ke repository/dokumen.

### 17.1 Generate QRIS

Endpoint:

```http
POST /qris/generate
```

Request:

```json
{
  "amount": 10000
}
```

Response penting:

```json
{
  "success": true,
  "data": {
    "transaction_id": "uuid",
    "order_id": "AutoGopay-...",
    "amount": 10000,
    "transaction_status": "pending",
    "qr_string": "000201...",
    "qr_url": "https://.../qr-code",
    "transaction_time": "2026-03-27 20:34:00",
    "expiry_time": "2026-03-27 20:49:00"
  }
}
```

Mapping ke database:
- `transaction_id` → `provider_transaction_id`
- `order_id` → `provider_order_id`
- `amount` → `amount`
- `transaction_status` → `payment_status`
- `qr_url` / `qr_string` → tampil di checkout
- `expiry_time` → `expires_at`

### 17.2 Status QRIS

Endpoint:

```http
POST /qris/status
```

Request:

```json
{
  "transaction_id": "provider_transaction_id"
}
```

Status provider:
- `pending`
- `settlement`
- `expire`
- `cancel`

Mapping internal:
- `pending` → `waiting_payment`
- `settlement` → trigger generate voucher
- `expire` → `payment_expired`
- `cancel` → `cancelled`

### 17.3 Cancel QRIS

Endpoint:

```http
POST /qris/cancel
```

Dipakai kalau order dibatalkan sebelum dibayar.

### 17.4 Transactions

Endpoint:

```http
POST /transactions
```

Dipakai untuk audit/sinkronisasi kalau webhook/polling terlewat.

### 17.5 Webhook

Endpoint di web kita:

```http
POST /api/payments/autogopay/webhook
```

Header wajib:
- `X-Signature`
- `X-Callback-Event`

Verifikasi:

```text
expected = HMAC_SHA256(raw_body, AUTOGOPAY_API_KEY)
```

Wajib pakai raw body, bukan JSON yang sudah diubah formatnya, agar signature valid.

Payload paid:

```json
{
  "event": "transaction.received",
  "timestamp": "2024-03-29 14:30:45",
  "transaction": {
    "id": "TRX-001",
    "time": "2024-03-29 14:30:40",
    "amount": 50000,
    "currency": "IDR",
    "payment_type": "qris",
    "status": "settlement",
    "issuer": "gopay"
  }
}
```

Catatan penting:
- Webhook payload contoh memakai `transaction.id`, sementara generate QRIS response memakai `transaction_id` UUID.
- Saat implementasi harus diuji apakah `transaction.id` sama dengan `transaction_id` atau `order_id`.
- Untuk aman, matching order bisa pakai kombinasi provider transaction id + amount + waktu, tapi idealnya provider mengirim transaction id yang sama.

---

## 18. Rekomendasi Implementasi Pertama

Urutan aman:

1. Buat config bot menu `🛒 Web Voucher` dulu.
2. Buat database schema order + web settings.
3. Implement AutoGopay client tanpa expose key.
4. Implement dummy checkout page.
5. Test generate QRIS nominal kecil.
6. Implement webhook signature verification.
7. Implement idempotent paid handler.
8. Baru sambungkan generate voucher MikroTik.


---

## 19. AutoGopay OVO Endpoints — Catatan Scope

AutoGopay juga menyediakan endpoint OVO:

### 19.1 OVO Transaction History

Endpoint:

```http
GET /ovo/transactions?page=1&limit=10
```

Fungsi:
- Melihat riwayat transaksi OVO masuk/keluar.
- Bisa dipakai untuk audit saldo/transaksi kalau akun OVO terhubung.

Response penting:

```json
{
  "success": true,
  "data": [
    {
      "description": "Top Up",
      "source": "Bank CIMB",
      "amount": 10000,
      "fee": 2000,
      "date": "2026-05-19",
      "time": "20:54:34",
      "status": "SUCCESS",
      "type": "in"
    }
  ]
}
```

Field:
- `type = in` berarti transaksi masuk.
- `type = out` berarti transaksi keluar.
- `status = SUCCESS/PENDING`.

### 19.2 OVO Pay QRIS

Endpoint:

```http
POST /ovo/qris/pay
```

Request:

```json
{
  "qr_string": "00020101021226...",
  "amount": 5000,
  "pin": "123456"
}
```

Fungsi:
- Membayar QRIS menggunakan saldo OVO Cash.
- Support QRIS statis dan dinamis.
- Perlu akun OVO terhubung via dashboard.
- Perlu fitur di-unlock admin AutoGopay.

### 19.3 Scope Decision untuk Web Voucher

Untuk **Web Pembelian Voucher WiFi**, endpoint OVO ini **tidak masuk MVP v1**.

Alasan:
- Customer membeli voucher dengan QRIS, jadi yang kita butuhkan adalah `POST /qris/generate`, `POST /qris/status`, dan webhook.
- `POST /ovo/qris/pay` adalah fitur untuk akun Bos membayar QRIS pihak lain memakai saldo OVO, bukan menerima pembayaran customer.
- Endpoint ini butuh PIN OVO, sehingga lebih sensitif dan sebaiknya tidak disimpan/dipakai dulu.

OVO history bisa dipertimbangkan nanti untuk:
- audit mutasi
- cek saldo/riwayat
- rekonsiliasi manual jika transaksi bermasalah

OVO Pay QRIS bisa dipertimbangkan jauh nanti untuk fitur terpisah, bukan bagian toko voucher.


---

## 20. Existing Ketantech AppGateway Assessment

Repo audited:

```text
https://github.com/ketanvpn/ketantech-AppGateway
```

Local path:

```text
projects/ketantech-AppGateway
```

### 20.1 Verdict

Aplikasi ini **bukan berbeda dari webhook hub** — justru ini kandidat terbaik untuk menjadi webhook/payment hub pusat.

Ketantech AppGateway sudah punya:

- Multi-provider payment abstraction.
- Endpoint create charge: `POST /api/v1/payments/charge`.
- Endpoint status payment by id/orderId.
- Provider registry.
- SQLite transaction store.
- Webhook route raw body: `POST /api/v1/webhooks/:provider`.
- Signature verification per provider.
- Strict webhook deduplication via payload hash.
- Amount cross-check.
- Idempotency middleware.
- Dashboard admin.
- Runtime credentials/settings encrypted in SQLite.
- Telegram notification service.
- Test suite lengkap.

Test result saat audit:

```text
Test Suites: 14 passed, 14 total
Tests: 127 passed, 127 total
```

### 20.2 Gap untuk AutoGopay

Belum ada provider AutoGopay di codebase saat audit.

Provider saat ini:

- `midtrans`
- `xendit`
- `doku`
- `tripay`
- `orderkuota`

Perlu tambah:

- `autogopay` sebagai `ProviderName` baru.
- `src/providers/autogopayProvider.ts`.
- config/settings credentials:
  - `apiKey`
  - `baseUrl`
- webhook endpoint otomatis akan menjadi:

```text
POST /api/v1/webhooks/autogopay
```

Karena route sudah generic `/:provider`.

### 20.3 AutoGopay Provider Contract

`charge(req)`:
- hanya support `method=qris`.
- call `POST /qris/generate`.
- simpan:
  - `transaction_id` sebagai `providerTransactionId`.
  - `qr_url` sebagai `paymentUrl`.
  - `qr_string`, `order_id`, `expiry_time` di `rawResponse`.
- return status `pending`.

`getStatus(providerTransactionId)`:
- call `POST /qris/status`.
- mapping:
  - `pending` → `pending`
  - `settlement` → `success`
  - `expire` → `expired`
  - `cancel` → `failed` atau `expired` sesuai keputusan final.

`verifyWebhook(rawBody, headers)`:
- verify `X-Signature`.
- expected = `HMAC-SHA256(rawBody, apiKey)`.
- wajib pakai raw body byte-exact.

`parseWebhook(payload)`:
- event `transaction.received` + status `settlement` → `success`.
- `providerTransactionId` dari `transaction.id`.
- `rawPayload` payload asli.

Catatan risiko:
- Docs AutoGopay response generate memakai `transaction_id` UUID.
- Webhook sample memakai `transaction.id` seperti `TRX-001`.
- Perlu test nyata apakah webhook `transaction.id` sama dengan `transaction_id` dari generate. Kalau tidak sama, perlu strategi matching tambahan.

### 20.4 Integrasi Web Voucher

Web voucher tidak perlu langsung call AutoGopay.

Flow rekomendasi:

```text
Web Voucher
↓ POST /api/v1/payments/charge
Ketantech AppGateway provider=autogopay
↓
AutoGopay generate QRIS
↓ webhook satu-satunya ke AppGateway
Ketantech AppGateway update status success
↓
WiFi Voucher worker/listener generate voucher MikroTik
```

Karena AppGateway saat ini hanya update payment status, perlu tambahan mekanisme post-payment untuk produk:

Opsi paling sederhana:
- Web Voucher polling `GET /api/v1/payments?orderId=...`.
- Kalau status `success`, backend Web Voucher generate voucher.

Opsi lebih rapi:
- Tambah `payment_routes` / `product_dispatcher` di AppGateway.
- Saat transaksi success, AppGateway panggil webhook internal produk berdasarkan prefix/order metadata.

Untuk MVP, rekomendasi: **polling dari Web Voucher** dulu, supaya perubahan AppGateway minimal.

### 20.5 Single Webhook Problem Solved

Karena AutoGopay hanya menyediakan 1 webhook URL, set webhook ke:

```text
https://<gateway-domain>/api/v1/webhooks/autogopay
```

Lalu semua aplikasi internal memakai AppGateway untuk create charge.

Produk dibedakan oleh `orderId` prefix, contoh:

- `VPN-...`
- `WIFI-...`

Atau nanti tambah metadata/product table jika perlu.

