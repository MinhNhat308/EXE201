# BOBAPOS ↔ Platform Admin — Tích hợp DB

Nguồn gốc admin portal: [Thormastran/exe201_bobapos](https://github.com/Thormastran/exe201_bobapos.git)  
Đã copy vào `PlatformAdmin/` và gắn **BOBAPOS Bridge** đọc chung MongoDB với `BE/`.

## Kiến trúc

| Thành phần | Thư mục | Port | Vai trò |
|------------|---------|------|---------|
| POS + SaaS tenant | `BE/` + `FE/` | 3001 / 3000 | Khách đăng ký, vận hành quán |
| Platform Admin | `PlatformAdmin/backend` + `PlatformAdmin/src` | 4000 / 3001 | Admin xem toàn bộ cửa hàng & gói |

**Cùng một `MONGODB_URI`** — admin không dùng collection tenant demo riêng khi `BOBAPOS_BRIDGE=true`.

## Collection mapping

| Admin UI | BOBAPOS MongoDB | Ghi chú |
|----------|-----------------|---------|
| Owners / Stores | `tenants` | `storeName` → `name`, join `ownerUserId` |
| Gói đăng ký | `subscriptions` | `plan`: SOLO / STANDARD / PREMIUM |
| Hóa đơn / Contracts | `billing_invoices` | PAID → active |
| Nhân viên | `users` (role ≠ ADMIN) | STAFF, KITCHEN, … |
| Đăng nhập admin | `platform_users` | **Tách** khỏi `users` POS |

## Map gói & trạng thái

| BOBAPOS | Admin portal |
|---------|--------------|
| SOLO | solo (Solo · 99k) |
| STANDARD | standard (Store · 299k) |
| PREMIUM | premium (Chain · 599k) |
| TRIAL | pending |
| ACTIVE | active |
| EXPIRED | inactive |
| SUSPENDED | suspended |

## Chạy local (chung DB)

```bash
# 1. BOBAPOS BE (đã có data demo)
cd BE && npm run start:dev

# 2. Platform Admin API
cd PlatformAdmin/backend
cp .env.example .env
# Sửa MONGODB_URI = giống BE/.env
npm install && npm run start:dev

# 3. Platform Admin UI
cd PlatformAdmin
cp .env.example .env.local
npm install && npm run dev
```

**Đăng nhập admin:** `admin@bobapos.io` / `Admin@123456` (seed lần đầu)

## Khớp / chưa khớp

### Đã khớp
- Danh sách cửa hàng, chủ quán, gói, trạng thái trial/active
- Dashboard: số cửa hàng, NV, phân bố gói, doanh thu từ `billing_invoices`
- Nhân viên từng tenant
- Hóa đơn thanh toán gói SaaS

### Chưa có trên BOBAPOS (admin hiển thị rỗng / read-only)
- **Licenses** — BOBAPOS dùng subscription, không có license key
- **Contracts PDF** — map từ invoice, không tạo/sửa từ admin
- **Tạo cửa hàng từ admin** — dùng `/register` trên BOBAPOS FE

### Khác biệt schema (đã xử lý trong bridge)
- Tenant: `storeName` vs `name`
- Owner: `ownerUserId` → join `users` thay vì `ownerEmail` trên tenant
- Plan: `starter/premium/enterprise` (repo gốc) → `solo/standard/premium` (BOBAPOS)

## Tắt bridge (dùng data demo cũ của repo gốc)

```env
BOBAPOS_BRIDGE=false
```

## Upstream

```bash
git remote add thormastran https://github.com/Thormastran/exe201_bobapos.git
git fetch thormastran
```

Cập nhật: 2026-07-03
