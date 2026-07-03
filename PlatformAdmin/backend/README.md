# EXE201 Backend

NestJS API for the EXE201 frontend. It connects to local MongoDB, including the same MongoDB instance you inspect with MongoDB Compass.

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Default API URL:

```text
http://localhost:4000/api
```

MongoDB Compass connection string:

```text
mongodb://127.0.0.1:27017/exe201
```

The app upserts a complete test dataset whenever the backend starts. Existing custom records
are preserved, while seeded records are updated by stable keys.

Test accounts:

```text
System admin:       admin@teaflow.io / Admin@123456
Active owner:       owner.emerald@teaflow.test / Test@123456
Enterprise owner:   owner.azure@teaflow.test / Test@123456
Manager:            manager@teaflow.test / Test@123456
Inactive user:      inactive@teaflow.test / Test@123456 (login must fail)
Password reset QA:  reset@teaflow.test / Test@123456
Verification code:  123456
```

Seed coverage:

- 4 subscription plans, including an inactive legacy plan
- 8 tenants across active, pending, inactive, and suspended states
- Owner users for every tenant, plus admin, manager, inactive, and password-reset accounts
- 12 employees across admin, manager, and staff roles and every employee state
- 8 contracts across active, pending, completed, and expired states
- Contracts expiring within 10 and 20 days for dashboard alert testing
- 8 licenses across active, pending, expired, and suspended states
- Historical creation dates for dashboard trends, revenue, pagination, filters, and global search

Seeded users are only assigned their documented password when first created. Restarting the
backend does not overwrite passwords changed through the application.

Authentication endpoints:

```text
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/sso
POST /api/auth/passkey/login-options
POST /api/auth/passkey/login
POST /api/auth/passkey/register-options
POST /api/auth/passkey/register
GET  /api/auth/me
POST /api/auth/logout
```

Other endpoints:

```text
GET  /api/search?q=
GET  /api/contracts/:id/pdf
GET  /api/licenses
```

Protected endpoints require:

```text
Authorization: Bearer <accessToken>
```

## Connect Frontend

The frontend should use:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

Then restart the Next.js dev server.
