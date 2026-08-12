# Expense Tracker

A multi-user expense tracking web portal built with Next.js.

## Features

- Email/password sign up and sign in (server-side auth, no third-party/cloud auth providers)
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

2. Copy `.env` and set your own `AUTH_SECRET` for production (a default dev value is already included):

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

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

All authentication logic — password hashing/verification and session issuance — runs entirely server-side (`lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/api/signup/route.ts`). There are no third-party OAuth providers, hosted auth services, or externally-sent verification codes. Sessions are JWTs stored in an `httpOnly`, `SameSite=Lax` cookie set by the server (`Secure` is added automatically in production over HTTPS) — it's never readable from client-side JavaScript. A cookie-consent banner (`components/CookieConsentBanner.tsx`) informs users on first visit; the session cookie itself is strictly necessary so it isn't gated behind consent.

Route protection is handled by `middleware.ts`, which verifies the session JWT (no database access needed) and redirects unauthenticated users away from `/dashboard`, `/expenses`, and `/budgets`.

## Project structure

```
app/
  api/            API routes (expenses, categories, budgets, upload, export, auth, signup)
  (dashboard)/    Protected pages: dashboard, expenses, budgets (shared nav layout)
  login/, signup/ Auth pages
components/       Reusable UI (forms, tables, charts, badges, modal)
lib/              Prisma client, auth config, shared helpers/types
prisma/           Schema and migrations
```

## Notes for production

- Receipt images are stored on local disk under `public/uploads/`. For a real deployment, swap this for object storage (e.g. S3) — see `app/api/upload/route.ts`.
- SQLite is used for simplicity. To move to Postgres, update the `datasource` in `prisma/schema.prisma`, swap the driver adapter in `lib/prisma.ts`, and re-run migrations.
- Set a strong, unique `AUTH_SECRET` and run behind HTTPS so the session cookie gets the `Secure` flag.
