# BOBAPOS — Quản lý cửa hàng trà sữa (Multi-Tenant SaaS)



Hệ thống quản lý cửa hàng trà sữa với phân quyền theo vai trò và lớp **SaaS multi-tenant** (đăng ký cửa hàng, trial 7 ngày Premium, gói Standard/Premium, hóa đơn). Giao diện thống nhất màu **#2F80ED** (sidebar `AppShellLayout`).

**Luồng POS / Bếp / Kho / Kế toán giữ nguyên** — chỉ bổ sung tenant, subscription và billing.



## Cấu trúc dự án



```

EXE201/

├── BE/          # NestJS (MVC) - API Backend

└── FE/          # Next.js (MVC) - Frontend

```



## Vai trò (Roles)



| Role | Mô tả | Dashboard |

|------|-------|-----------|

| ADMIN | Quản trị viên | `/dashboard/admin` |

| STAFF | Nhân viên bán hàng | `/dashboard/staff` |

| KITCHEN | Bếp | `/dashboard/kitchen` |

| WAREHOUSE | Nhân viên kho | `/dashboard/warehouse` |

| **STORE_MANAGER** | **Quản lý cửa hàng** | `/dashboard/manager` |

| ACCOUNTING | Kế toán | `/dashboard/accounting` |



## Hai luồng kho



| Luồng | Ai lập phiếu | Loại phiếu | Ghi chú |

|-------|----------------|------------|---------|

| **Ca / quầy** | Quản lý cửa hàng | Cấp phát trong ngày + Hoàn trả cuối ca | Hoàn trả bắt buộc gắn PXK cấp phát |

| **Tồn / bổ sung** | Nhân viên kho (QL hỗ trợ) | Bổ sung tồn (`REPLENISH_FROM_CENTRAL`) | Không yêu cầu hoàn trả cuối ca |



Kế toán **duyệt** mọi phiếu trước khi cập nhật tồn.



## BOBAPOS SaaS



| Tính năng | Mô tả |
|-----------|--------|
| Đăng ký công khai | `POST /api/public/register` — tạo tenant + trial Premium 7 ngày |
| Bảng giá | `/pricing` — Standard (10 NV, 1 CN) / Premium |
| Đăng nhập | Chủ: **email** · Nhân viên: **username** + **slug** cửa hàng |
| Gói hết hạn | Xem được dữ liệu; API chặn POST/PUT/PATCH/DELETE |
| Admin SaaS | `/dashboard/admin/subscription`, `/dashboard/admin/billing` |

Dữ liệu demo cũ gắn tenant `teaflow-legacy` (slug dùng khi NV đăng nhập).

### Tài khoản demo — 3 phân khúc

Danh sách đầy đủ (chủ quán + nhân viên): **[TAI-KHOAN-DEMO.txt](./TAI-KHOAN-DEMO.txt)**. Seed tự chạy khi BE khởi động (trừ khi `SEED_DEMO_TENANTS=false`).



## Tài khoản mặc định (tự seed khi BE khởi động)



| Vai trò | Email | Mật khẩu |

|---------|-------|----------|

| Admin | `admin@bubbletea.com` | `Admin@123` |

| Staff | `staff@bubbletea.com` | `Staff@123` |

| Bếp | `kitchen@bubbletea.com` | `Kitchen@123` |

| Kho | `warehouse@bubbletea.com` | `Warehouse@123` |

| **Quản lý** | `manager@bubbletea.com` | `Manager@123` |

| Kế toán | `accounting@bubbletea.com` | `Accounting@123` |



## Luồng Staff (POS)



1. Đăng nhập → Chọn **ca** (sáng/trưa/chiều/tối)

2. Chọn **Thu ngân** hoặc **Phục vụ**

3. **Thu ngân**: Chọn món → Thanh toán → Hóa đơn → In → Xác nhận → Bếp nhận đơn

4. **Phục vụ**: Đơn READY → Giao khách → COMPLETED

5. **Quản lý** theo dõi `/dashboard/manager/orders` (doanh thu ca, trạng thái bếp)



## Luồng Bếp



1. PENDING → PREPARING → **READY** (tự trừ NL KHO1 theo công thức)

2. Menu sidebar đồng bộ với các role khác



## Dữ liệu mẫu



- `SEED_DEMO_INVENTORY=true` — NCC, phiếu cấp/hoàn trả demo

- `SEED_DEMO_ORDERS=true` — DEMO-001/002/003 cho bếp & phục vụ



## Chạy dự án



### Backend — Port 3001



```bash

cd BE

npm install

npm run start:dev

```



### Frontend — Port 3000



```bash

cd FE

npm install

npm run dev

```



`npm run dev` dùng **webpack**. Nếu port treo: `taskkill /F /IM node.exe` rồi chạy lại.



## Gợi ý hoàn thiện (so với POS chuẩn)



| Ưu tiên | Đề xuất |

|---------|---------|

| Cao | Middleware chặn URL theo role |

| Cao | Báo cáo doanh thu / chốt ca PDF cho quản lý |

| Cao | WebSocket thay polling (bếp, phục vụ) |

| Trung bình | Khuyến mãi, combo, loyalty |

| Trung bình | Kiểm kê tồn & chênh lệch (cấp − tiêu hao − hoàn) |

| Trung bình | Upload chứng từ / ảnh món |

| Thấp | Đa chi nhánh |



## Database



MongoDB trong `BE/.env`. Nếu `querySrv ECONNREFUSED`, dùng `MONGODB_URI_DIRECT`.


