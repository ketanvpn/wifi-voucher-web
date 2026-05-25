# Deploy WiFi Voucher Web ke VPS

## 1. Clone repo

```bash
cd /root
git clone https://github.com/ketanvpn/wifi-voucher-web.git
cd wifi-voucher-web
```

## 2. Install dependency

```bash
npm ci
```

## 3. Isi environment

```bash
cp .env.example .env.local
nano .env.local
chmod 600 .env.local
```

Minimal production:

```env
NEXT_PUBLIC_SITE_NAME=TAPEKETAN WiFi
KETANTECHPAY_BASE_URL=https://pay.ketantech.my.id
KETANTECHPAY_CLIENT_KEY=isi_client_key_dari_dashboard
BOT_INTERNAL_GENERATE_URL=http://127.0.0.1:8099/internal/generate-voucher
BOT_INTERNAL_TOKEN=isi_token_internal
WIFI_VOUCHER_MOCK_GENERATE=false
```

## 4. Build

```bash
npm run build
```

## 5. Systemd service contoh

```ini
[Unit]
Description=WiFi Voucher Web
After=network.target ketantech-payment.service mikrotik-voucher-bot.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/wifi-voucher-web
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3010

[Install]
WantedBy=multi-user.target
```

Simpan sebagai:

```bash
/etc/systemd/system/wifi-voucher-web.service
```

Lalu:

```bash
systemctl daemon-reload
systemctl enable --now wifi-voucher-web.service
systemctl status wifi-voucher-web.service --no-pager -l
```

## 6. Update deploy

```bash
cd /root/wifi-voucher-web
git pull --ff-only origin main
npm ci
npm run build
systemctl restart wifi-voucher-web.service
```

## 7. Catatan security

- Jangan commit `.env.local`.
- Jangan expose `BOT_INTERNAL_GENERATE_URL` ke publik; endpoint bot harus bind localhost + bearer token.
- Jangan simpan AutoGoPay key di web voucher. Pakai KetantechPay client key saja.
- Backup `data/orders.json` kalau masih pakai file store MVP.
