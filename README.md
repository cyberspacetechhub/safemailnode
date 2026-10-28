# MailBridge — Production Gmail & Nodemailer API Gateway (Next.js)

A multi-tenant, production-ready **Next.js App Router** email gateway service that lets users create an account, verify their email, configure their **Gmail address & 16-character Google App Password** (encrypted at rest with AES-256-GCM), and get an `x-api-key` (`ms_live_...`) to send transactional emails over HTTPS from any project.

---

## Key Features

### 1. Dedicated Admin Portal & One-Time Admin Setup
- **One-Time Admin Registration (`/admin/register`)**: Works **only once** when `0` admins exist in the database. As soon as the founding Admin registers, `/admin/register` permanently locks itself.
- **Dedicated Admin Login (`/admin/login`)**: Strict administrator-only login portal.
- **Create Additional Admins (`/admin` → Manage Admins)**: Existing administrators can provision new admin accounts from inside the Admin Command Center.
- **Zero Admin Leakage on User Dashboard**: The regular User Dashboard (`/dashboard`) has no admin links or buttons.

### 2. Default Quotas & Individual Admin Overrides
- **Default New User Quotas**:
  - **Projects Limit**: `2` Gmail/Project configurations per user (`maxProjects: 2`)
  - **Daily Mail Limit**: `100` emails per 24 hours (`dailyQuota: 100`)
- **Admin Overrides**: From `/admin`, an administrator can increase or decrease `maxProjects` and `dailyQuota` for any individual user at any time.

### 3. Email Verification for New Users (`/verify-email`)
- Newly registered users on `/register` receive a **6-digit verification code** and are required to verify their email on `/verify-email` before accessing the dashboard, creating projects, or dispatching emails.
- Admins can configure the **System Verification Mailer** in `/admin` (or click to manually verify any user in one click).

### 4. Production Admin Controls (`/admin`)
- **Freeze Account (`isFrozen`)**: Temporarily pauses all outgoing API emails and new project creation for a user while still allowing them to log into `/dashboard` and see the frozen notice.
- **Lock / Unlock Account (`isLocked`)**: Blocks both login and API key usage (also automatically triggered after 5 consecutive failed password attempts).
- **Suspend / Activate Account (`isActive`)**: Deactivates or reactivates user accounts.
- **Reset User Password**: Set a new password for a user and clear security locks.
- **Delete User**: Permanently deletes a user along with all their `MailProject` configurations and `EmailLog` history.
- **Platform Projects & Logs Oversight**: Inspect, pause/enable, or delete any project across the entire platform and monitor global email logs.

### 5. "Support Our Project" Page (`/support`)
- Public & dashboard-linked support page where users can support the project.
- Configurable by the Admin in `/admin` → **Support Our Project & System Mailer**:
  - Add/remove **Bank Transfer Accounts** (with one-click account number copy)
  - Add/remove **Crypto Wallets** (with one-click wallet address copy)
  - Add/remove **External Payment / Donation Links** (Paystack, Flutterwave, BuyMeACoffee, Stripe, etc.)

### 6. Built-In Rate Limiting (`src/lib/rateLimit.ts`)
- Sliding-window rate limiting on `/api/auth/*`, `/api/admin/auth/*`, `/api/send-email`, `/api/projects`, and `/api/projects/[id]/test` with standard `429 Too Many Requests` and `Retry-After` headers.
