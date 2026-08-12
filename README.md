# Expense Tracker

A multi-user expense tracking web portal built with Next.js.

## Features

- Email/password sign up and sign in (server-side auth, no third-party/cloud auth providers)
- Email verification on sign up: a 6-digit code is emailed via Gmail and must be entered before the account can sign in
- Add, edit, delete expenses with amount, date, category, note, and an optional receipt photo
- Custom categories, seeded with sensible defaults on sign up
- Filter expenses by date range, category, amount range, and note text
- Dashboard with this month's total, spend-by-category chart, 6-month trend, and recent transactions
- Per-category monthly budgets with progress bars
- CSV export of all expenses

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://prisma.io) + SQLite (via the `better-sqlite3` driver adapter)
- [Auth.js / NextAuth v5](https://authjs.dev) (Credentials provider) for server-side authentication
- [Recharts](https://recharts.org) for charts

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set your own `AUTH_SECRET` for production (a default dev value is already included in `.env`):

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Then set `GMAIL_USER` / `GMAIL_APP_PASSWORD` so signup verification emails can be sent — see [Email verification](#email-verification) below.

3. Apply the database schema (creates `dev.db`):

   ```bash
   npx prisma migrate dev
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000). You'll be redirected to sign up / sign in, then to the dashboard.

## Authentication & cookies

All authentication logic — password hashing/verification and session issuance — runs entirely server-side (`lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/api/signup/route.ts`). There are no third-party OAuth providers or hosted auth services. Sessions are JWTs stored in an `httpOnly`, `SameSite=Lax` cookie set by the server (`Secure` is added automatically in production over HTTPS) — it's never readable from client-side JavaScript. A cookie-consent banner (`components/CookieConsentBanner.tsx`) informs users on first visit; the session cookie itself is strictly necessary so it isn't gated behind consent.

Route protection is handled by `middleware.ts`, which verifies the session JWT (no database access needed) and redirects unauthenticated users away from `/dashboard`, `/expenses`, and `/budgets`.

Login is rate-limited by IP and by email (`lib/rate-limit.ts`, an in-memory limiter — fine for a single process, but won't coordinate across multiple server instances without a shared store), and the credential check runs at constant time whether or not the email exists, to avoid leaking account existence via response timing.

## Email verification

New accounts start unverified and can't sign in until a 6-digit code, emailed on signup, is entered. Sending goes through the Gmail API via OAuth2 (`nodemailer`'s XOAuth2 transport, `lib/mailer.ts`) rather than a password — the app authenticates as a Google Cloud OAuth client using a refresh token scoped to `gmail.send`, not the account's actual login credentials.

**One-time setup** (use a **dedicated** Gmail account for this, not your personal one — anything holding this refresh token can send mail as that account):

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Gmail API** for it (APIs & Services → Enable APIs & Services → search "Gmail API").
3. Configure the **OAuth consent screen** (External is fine; add the dedicated Gmail account as a test user — test-mode apps don't need Google review).
4. Under APIs & Services → Credentials, create an **OAuth client ID** of type "Web application". Add `https://developers.google.com/oauthplayground` as an authorized redirect URI. Note the Client ID and Client Secret.
5. Go to the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground):
   - Click the gear icon → check "Use your own OAuth credentials" → paste the Client ID/Secret from step 4.
   - In Step 1, find and select the scope `https://www.googleapis.com/auth/gmail.send`, then Authorize (sign in as the dedicated Gmail account).
   - In Step 2, click "Exchange authorization code for tokens" and copy the **Refresh token**.
6. Set `GMAIL_USER` (the address), `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` in `.env`.

Codes expire after 10 minutes and are capped at 5 incorrect attempts (`lib/otp.ts`); resend requests are rate-limited (`app/api/resend-otp/route.ts`). If the Gmail env vars aren't fully set, signup fails with a 502 until they're configured.

## Project structure

```
app/
  api/            API routes (expenses, categories, budgets, upload, export, auth, signup, verify-otp, resend-otp)
  (dashboard)/    Protected pages: dashboard, expenses, budgets (shared nav layout)
  login/, signup/, verify/  Auth pages
components/       Reusable UI (forms, tables, charts, badges, modal)
lib/              Prisma client, auth config, shared helpers/types
prisma/           Schema and migrations
```

## Notes for production

- Receipt images are stored on local disk under `public/uploads/`. For a real deployment, swap this for object storage (e.g. S3) — see `app/api/upload/route.ts`.
- SQLite is used for simplicity. To move to Postgres, update the `datasource` in `prisma/schema.prisma`, swap the driver adapter in `lib/prisma.ts`, and re-run migrations.
- Set a strong, unique `AUTH_SECRET` and run behind HTTPS so the session cookie gets the `Secure` flag.
