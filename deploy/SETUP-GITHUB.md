# Deploy BOBAPOS — đăng nhập GitHub (1 lần)

Repo: **MinhNhat308/EXE201**

## Bước 1 — Backend (Render) ~5 phút

1. Mở **[render.com](https://render.com)** → **Get Started** → **Sign in with GitHub**
2. **New +** → **Blueprint** → chọn repo **EXE201**
3. Render đọc `render.yaml` → tạo service **bobapos-api**
4. Nhập 3 biến (copy từ `BE/.env` local):

| Biến | Giá trị |
|------|---------|
| `MONGODB_URI` | URI MongoDB DigitalOcean |
| `SEPAY_WEBHOOK_SECRET` | `whsec_...` từ SePay |
| `CORS_ORIGIN` | *(tạm để trống, cập nhật sau bước 2)* |

5. **Apply** → đợi deploy xong
6. Copy URL backend, ví dụ: `https://bobapos-api.onrender.com`
7. Vào **Environment** → thêm:
   - `PUBLIC_API_URL` = `https://bobapos-api.onrender.com/api`
   - `CORS_ORIGIN` = URL Vercel (bước 2)
8. **Settings → Deploy Hook** → copy URL → GitHub repo **Settings → Secrets → Actions** → `RENDER_DEPLOY_HOOK`

**SePay webhook:** `https://bobapos-api.onrender.com/api/payments/sepay/webhook`

---

## Bước 2 — Frontend (Vercel) ~3 phút

1. Mở **[vercel.com](https://vercel.com)** → **Sign Up** → **Continue with GitHub**
2. **Add New → Project** → import **MinhNhat308/EXE201**
3. **Root Directory:** chọn `FE` → **Edit**
4. **Environment Variables** (Production):

```env
API_PROXY_TARGET=https://bobapos-api.onrender.com/api
```

5. **Deploy**
6. Copy domain Vercel, ví dụ: `https://exe201.vercel.app`
7. Quay lại Render → sửa `CORS_ORIGIN` = URL Vercel → **Manual Deploy**

### (Tuỳ chọn) Auto-deploy qua GitHub Actions

Vercel → **Settings → Tokens** → tạo token → GitHub Secrets:

| Secret | Lấy ở đâu |
|--------|-----------|
| `VERCEL_TOKEN` | Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | Vercel project → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel project → Settings → General |
| `API_PROXY_TARGET` | `https://<render>/api` |

---

## Bước 3 — Test production

1. `https://<vercel>/register` → đăng ký gói 99k/299k/599k
2. Đăng nhập → **Billing** → tạo hóa đơn → chuyển khoản
3. SePay webhook → gói **ACTIVE 30 ngày**

---

## Link nhanh

- [Render — Deploy Blueprint](https://dashboard.render.com/select-repo?type=blueprint)
- [Vercel — Import GitHub](https://vercel.com/new)
