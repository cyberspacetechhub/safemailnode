# SafeMailNode — Production Gmail & Nodemailer API Gateway (Next.js)

A multi-tenant, production-ready **Next.js App Router** email gateway that lets users register, verify their email, configure a **Gmail address + 16-character Google App Password** (encrypted at rest with AES-256-GCM), and get a `ms_live_...` API key to send transactional emails over HTTPS from any project.

---

## Key Features

### 1. Dedicated Admin Portal & One-Time Admin Setup

- **One-Time Admin Registration (`/admin/register`)**: Works only once when `0` admins exist. Permanently locks itself after the first admin registers.
- **Dedicated Admin Login (`/admin/login`)**: Admin-only login portal.
- **Create Additional Admins (`/admin` → Manage Admins)**: Existing admins can provision new admin accounts.
- **`ADMIN_EMAIL` env var**: Any user who registers with this email automatically receives the `admin` role, `enterprise` plan, and elevated limits — no manual step required.

### 2. Default Quotas & Individual Admin Overrides

- **Default New User Quotas**: `maxProjects: 2`, `dailyQuota: 100` emails/24 h
- **Admin Overrides**: Adjust `maxProjects` and `dailyQuota` per user from `/admin`.

### 3. Email Verification (`/verify-email`)

- New users receive a **6-digit code** valid for 30 minutes.
- Required before accessing the dashboard, creating projects, or sending emails.
- Admins can configure the System Mailer in `/admin` or manually verify any user in one click.

### 4. Forgot / Reset Password

- `/forgot-password` — user submits their email; a reset link (valid 30 min) is sent via the system mailer.
- `/reset-password?token=...` — user sets a new password; also clears any account lock.
- Email enumeration is prevented — the endpoint always returns the same response regardless of whether the email exists.

### 5. API Key Security (Show-Once + Bcrypt)

- API keys are **bcrypt-hashed** before storage — the raw key is returned **once** at creation/regeneration and never stored in plain text.
- The UI shows only the `apiKeyPrefix` (first 20 chars + `...`) after initial reveal.
- Keys can be revoked or regenerated from the dashboard.
- `POST /api/admin/migrate-projects` — admin-only endpoint to migrate legacy projects that predate the hashing scheme; returns new raw keys once.

### 6. Production Admin Controls (`/admin`)

- **Freeze (`isFrozen`)**: Pauses outgoing API emails and project creation; user can still log in.
- **Lock / Unlock (`isLocked`)**: Blocks login and API usage. Auto-triggered after 5 failed login attempts.
- **Suspend / Activate (`isActive`)**: Deactivates or reactivates accounts.
- **Reset Password**: Set a new password for any user and clear security locks.
- **Delete User**: Permanently removes the user, all their projects, and email logs.
- **Platform Oversight**: Inspect, pause/enable, or delete any project; monitor global email logs.

### 7. "Support Our Project" Page (`/support`)

- Configurable from `/admin` → **Support Our Project & System Mailer**:
  - Bank Transfer Accounts (one-click copy)
  - Crypto Wallets (one-click copy)
  - External payment/donation links (Paystack, Flutterwave, BuyMeACoffee, Stripe, etc.)

### 8. Built-In Rate Limiting (`src/lib/rateLimit.ts`)

- Sliding-window rate limiting on all `/api/auth/*`, `/api/admin/auth/*`, `/api/send-email`, `/api/projects`, and `/api/projects/[id]/test` endpoints.
- Uses **Upstash Redis** when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set; falls back to in-memory for local development.
- Returns standard `429 Too Many Requests` with `Retry-After` header.

### 9. Pagination

- `GET /api/logs`, `GET /api/admin/logs`, `GET /api/admin/users` all support `?page=1&limit=50`.
- Responses include a `pagination` object: `{ total, page, limit, totalPages }`.

---

## API Reference

### Authentication

| Method | Endpoint                        | Description                      |
| ------ | ------------------------------- | -------------------------------- |
| POST   | `/api/auth/register`            | Register a new user              |
| POST   | `/api/auth/login`               | Log in                           |
| POST   | `/api/auth/logout`              | Log out (clears cookie)          |
| GET    | `/api/auth/me`                  | Get current session user         |
| POST   | `/api/auth/verify-email`        | Submit 6-digit verification code |
| POST   | `/api/auth/resend-verification` | Resend verification code         |
| POST   | `/api/auth/forgot-password`     | Request a password reset link    |
| POST   | `/api/auth/reset-password`      | Reset password with token        |

### Projects

| Method | Endpoint                  | Description                                           |
| ------ | ------------------------- | ----------------------------------------------------- |
| GET    | `/api/projects`           | List all projects (excludes credentials)              |
| POST   | `/api/projects`           | Create a project — returns `rawApiKey` once           |
| GET    | `/api/projects/[id]`      | Get a single project (excludes credentials)           |
| PATCH  | `/api/projects/[id]`      | Update project; `{ regenerateKey: true }` rotates key |
| DELETE | `/api/projects/[id]`      | Wipe credentials then delete project                  |
| POST   | `/api/projects/[id]/test` | Send a test email via the project                     |

### Send Email

| Method | Endpoint          | Description                              |
| ------ | ----------------- | ---------------------------------------- |
| POST   | `/api/send-email` | Send email — requires `x-api-key` header |

### Logs

| Method | Endpoint    | Description                                                             |
| ------ | ----------- | ----------------------------------------------------------------------- |
| GET    | `/api/logs` | User's email logs — supports `?projectId`, `?status`, `?page`, `?limit` |

### Admin

| Method          | Endpoint                      | Description                                    |
| --------------- | ----------------------------- | ---------------------------------------------- |
| POST            | `/api/admin/auth/register`    | Register first admin (locked after first use)  |
| POST            | `/api/admin/auth/login`       | Admin login                                    |
| POST            | `/api/admin/auth/logout`      | Admin logout                                   |
| GET             | `/api/admin/users`            | List all users — supports `?page`, `?limit`    |
| PATCH           | `/api/admin/users/[id]`       | Update user (limits, flags, password reset)    |
| DELETE          | `/api/admin/users/[id]`       | Delete user + all their data                   |
| GET             | `/api/admin/projects`         | List all projects platform-wide                |
| PATCH           | `/api/admin/projects/[id]`    | Update any project                             |
| DELETE          | `/api/admin/projects/[id]`    | Delete any project                             |
| GET             | `/api/admin/logs`             | Global email logs — supports `?page`, `?limit` |
| GET/POST/DELETE | `/api/admin/settings`         | Read/write system settings                     |
| GET/POST        | `/api/admin/admins`           | List / create additional admins                |
| POST            | `/api/admin/migrate-projects` | Migrate legacy projects to hashed API keys     |

---

## Environment Variables

See `.env.example` for a full annotated list. Required variables:

| Variable            | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `MONGO_URI`         | MongoDB connection string                                   |
| `JWT_SECRET`        | 32+ char secret for signing session JWTs                    |
| `ENCRYPTION_SECRET` | 32+ char secret for AES-256-GCM encryption of App Passwords |

Optional but recommended:

| Variable                    | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `ADMIN_EMAIL`               | Email that auto-receives admin role on registration            |
| `SYSTEM_GMAIL_USER`         | Gmail address for system emails (verification, password reset) |
| `SYSTEM_GMAIL_APP_PASSWORD` | 16-char Google App Password for the system mailer              |
| `NEXT_PUBLIC_APP_URL`       | Public base URL — used in password reset links                 |
| `UPSTASH_REDIS_REST_URL`    | Upstash Redis URL for distributed rate limiting                |
| `UPSTASH_REDIS_REST_TOKEN`  | Upstash Redis token                                            |

---

## Getting Started

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

Visit `http://localhost:3000/admin/register` to create the first admin account.
