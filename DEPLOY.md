# Deploy BOBAPOS (FE + BE)

## Kiến trúc

| Thành phần | Nền tảng | Thư mục | Port local |
|------------|----------|---------|------------|
| Frontend POS | Vercel | `FE/` | 3000 |
| Backend API | Render | `BE/` | 3001 |

## 1. Backend — Render

1. [Render Dashboard](https://dashboard.render.com) → **New Blueprint** → repo `MinhNhat308/EXE201`
2. File `render.yaml` ở root — service `bobapos-api`
3. Nhập biến bắt buộc:

```env
MONGODB_URI=<giống BE/.env local>
CORS_ORIGIN=https://<vercel-domain>
SEPAY_WEBHOOK_SECRET=<whsec từ SePay>
PUBLIC_API_URL=https://<render-domain>/api
```

4. Sau deploy, kiểm tra: `https://<render-domain>/api/health`
5. SePay webhook: `https://<render-domain>/api/payments/sepay/webhook`

## 2. Frontend — Vercel

1. Import repo → **Root Directory: `FE`**
2. Biến Production:

```env
API_PROXY_TARGET=https://<render-domain>/api
```

3. Redeploy sau khi thêm env

## 3. Luồng production cần test

- `/register` → chọn gói 99k / 299k / 599k → trial 7 ngày
- `/dashboard/admin/billing` → tạo hóa đơn → CK → SePay webhook → **ACTIVE 30 ngày**
- Mỗi lần thanh toán = **30 ngày** (không gộp nhiều tháng)

## 4. Platform Admin (tùy chọn)

Xem `PlatformAdmin/DEPLOY.md` — port 3002 local, Vercel/Render riêng.
