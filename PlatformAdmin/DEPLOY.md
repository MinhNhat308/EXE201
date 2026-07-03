# Deploy EXE201

Kiến trúc production:thêm d

- Frontend Next.js: Vercel
- Backend NestJS: Render
- Database: MongoDB Atlas

## 1. MongoDB Atlas

Tạo cluster và database user trên MongoDB Atlas. Trong Network Access, cho phép
backend Render kết nối. Lấy connection string có dạng:

```text
mongodb+srv://<user>:<password>@<cluster>/exe201?retryWrites=true&w=majority
```

Không commit connection string hoặc mật khẩu vào Git.

## 2. Backend trên Render

1. Push repository `exe201_bobas` lên GitHub.
2. Trong Render, chọn **New > Blueprint** và kết nối repository.
3. Render đọc file `render.yaml` ở thư mục gốc.
4. Nhập các biến được yêu cầu:

```text
MONGODB_URI=mongodb+srv://...
FRONTEND_ORIGIN=https://<vercel-domain>
WEBAUTHN_RP_ID=<vercel-domain-khong-co-https>
```

Sau khi deploy, kiểm tra:

```text
https://<render-domain>/api/health
```

## 3. Frontend trên Vercel

1. Import cùng GitHub repository `exe201_bobas` vào Vercel.
2. Giữ **Root Directory** là thư mục gốc của repository.
3. Framework Preset: **Next.js**.
4. Thêm biến môi trường cho **Production** (và Preview nếu cần):

**Cách 1 — khuyên dùng (proxy, tránh lỗi CORS):**

```text
API_PROXY_TARGET=https://<render-domain>/api
NEXT_PUBLIC_APP_NAME=TeaFlow BobaPOS
```

Frontend trên Vercel sẽ gọi `/api/...` (cùng domain), Next.js rewrite sang backend Render.

**Cách 2 — gọi thẳng backend:**

```text
NEXT_PUBLIC_API_BASE_URL=https://<render-domain>/api
NEXT_PUBLIC_APP_NAME=TeaFlow BobaPOS
```

5. **Redeploy** frontend sau khi thêm/sửa biến môi trường (bắt buộc — Next.js embed env lúc build).

> Lỗi thường gặp: `POST http://localhost:4000/api/auth/login net::ERR_CONNECTION_REFUSED`  
> Nguyên nhân: chưa set `API_PROXY_TARGET` hoặc `NEXT_PUBLIC_API_BASE_URL` trên Vercel.

## 4. Đồng bộ domain cuối cùng

Khi Vercel đã cấp domain chính thức, cập nhật trên Render:

```text
FRONTEND_ORIGIN=https://<vercel-domain>
WEBAUTHN_RP_ID=<vercel-domain-khong-co-https>
```

Sau đó redeploy backend. `FRONTEND_ORIGIN` phải khớp chính xác origin của
frontend để CORS và passkey hoạt động. Nếu dùng nhiều domain Vercel
Production/Preview, có thể khai báo nhiều origin bằng dấu phẩy:

```text
FRONTEND_ORIGIN=https://exe201-bobapos.vercel.app,https://exe201-bobapos-git-main-thormas-projects.vercel.app
```
