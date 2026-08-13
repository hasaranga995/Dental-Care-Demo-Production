# Dental Care — Private Dental Hospital Web App

A production-grade, full-stack web application for **Dental Care**, a private dental
hospital. Patients can browse services, book appointments, and manage their visits;
doctors and admins get dedicated portals to run the clinic's day-to-day schedule.

## Tech Stack

| Concern | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, `proxy.ts` middleware) |
| Language | TypeScript (strict) |
| Auth & RBAC | Clerk (`@clerk/nextjs`) — roles: `patient`, `doctor`, `admin` |
| Database | Neon PostgreSQL + Drizzle ORM |
| Caching / rate limiting | Upstash Redis |
| Background jobs | Upstash QStash (appointment confirmation emails) |
| Email | Resend |
| UI | Tailwind CSS + shadcn/ui (`base-nova` style, built on Base UI) + Lucide icons |
| Validation | Zod |

## Features

- **Marketing site**: home, services hub with category filters, dynamic service detail
  pages, about, FAQ, and a contact page with a live open/closed status badge and an
  emergency banner.
- **Booking engine**: a 5-step wizard (service → doctor → date/time → details → confirm)
  that only shows real availability (derived from each doctor's working hours minus
  already-booked slots), backed by a Zod-validated Server Action.
- **Notifications**: booking a visit enqueues a QStash job that calls back into
  `/api/webhooks/qstash`, which sends a branded HTML confirmation email via Resend.
  QStash isn't required in local dev — the queue gracefully falls back to an
  unsigned, best-effort direct call so the whole flow still works end to end.
- **Patient dashboard** (`/dashboard`): upcoming/past appointments, reschedule (with
  live slot picking) and cancel.
- **Admin dashboard** (`/admin`): clinic-wide stats, a full appointment table with
  inline status updates and cancellation.
- **VIP recognition** (`/admin/patients`, `/admin/vip-desk`): mark a patient VIP or VVIP
  once and every future booking is recognized automatically across WhatsApp, the website,
  and reception. See [VIP recognition & the back-office desk](#vip-recognition--the-back-office-desk).
- **Doctor portal** (`/doctor-portal`): a doctor's own patient queue and history.
- **Auth sync**: a Clerk webhook (`/api/webhooks/clerk`) keeps the Postgres `users`
  table in sync with Clerk on create/update/delete.
- Loading skeletons, `not-found` pages, and error boundaries across every route.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in real credentials:

```bash
cp .env.local.example .env.local
```

You'll need accounts for:

- **[Clerk](https://dashboard.clerk.com)** — create an application, copy the
  publishable/secret keys, and add a webhook pointing at
  `https://<your-domain>/api/webhooks/clerk` (events: `user.created`, `user.updated`,
  `user.deleted`) to get a signing secret.
- **[Neon](https://console.neon.tech)** — create a Postgres project and copy the
  pooled connection string into `DATABASE_URL`.
- **[Upstash](https://console.upstash.com)** — create a Redis database (for caching
  and rate limiting) and a QStash instance (for the email queue).
- **[Resend](https://resend.com/api-keys)** — create an API key for transactional
  email.

The app is designed to **degrade gracefully** without any of these — pages that read
from the database return empty lists instead of crashing, and the email/queue/cache
integrations no-op — so you can run `npm run dev` immediately after `npm install` to
explore the UI before wiring up real services.

### 3. Set up the database

```bash
npm run db:push    # push the Drizzle schema to your Neon database
npm run db:seed    # seed realistic services, doctors, and an admin account
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## VIP recognition & the back-office desk

Marking a patient as VIP is a **one-time act with lasting effect**. The tier lives on the
patient record, so nobody has to re-flag them on the next visit.

### How a patient is recognized across channels

Every patient record carries a normalized phone identity built with
`libphonenumber-js`: `phone_normalized` and `phone_key` are the **full E.164 digits
including the country code**. That keeps Sri Lankan (`+94`), Maldivian (`+960`), UK
(`+44`), and Gulf VIPs from colliding on a shared national subscriber portion.

Local Sri Lankan forms without a country code (`077…`) still resolve correctly by
defaulting to country `LK`.

| Channel | Identity source | Confidence | Concierge handling |
| --- | --- | --- | --- |
| WhatsApp | Sender number, verified by Meta | `verified` | Yes |
| Website, signed in | Clerk session | `verified` | Yes |
| Website, anonymous | None | `none` | No |
| Phone/email typed into chat | Self-declared | `probable` | No |

Only `verified` identities unlock VIP handling. This is deliberate — otherwise anyone who
guessed a VIP's phone number could pull up their preferences and history.

### What happens when a VIP books

1. The booking snapshots the tier onto the appointment (`appointments.patient_tier`), so
   history stays accurate even if the patient is promoted or demoted later.
2. A `vip_alerts` outbox row is written **before** any message is sent.
3. Each opted-in staff phone gets an arrival brief; every attempt is recorded in
   `vip_alert_deliveries`.
4. `appointments.vip_alert_sent_at` makes the whole thing idempotent under QStash retries.

A failed broadcast never blocks the booking, and it stays visible in the alert history at
`/admin/vip-desk` instead of disappearing into logs.

### Subscribing back-office staff

Two steps — guessing the join code alone is not enough:

1. An admin pre-approves the staff WhatsApp number under `/admin/vip-desk`.
2. That staff member texts the join command **from the same phone** (Meta opt-in):

```
JOIN VIPDESK Nuwan Silva
```

Other commands (pre-approved phones only): `TODAY`, `NEXT`, `STATUS`, `STOP`, `HELP`.

### Production notes

- **Use a second WhatsApp number** for the staff desk (`WHATSAPP_STAFF_PHONE_NUMBER_ID`).
  With one, patients physically cannot reach the staff bot. Without one, the app shares the
  patient number and only routes commands from *pre-approved* staff phones to the VIP desk.
- **Register an approved Utility template** named `vip_arrival_alert` in Meta WhatsApp
  Manager (category **Utility**, not Marketing), then set
  `WHATSAPP_STAFF_TEMPLATE_NAME=vip_arrival_alert`. Body placeholders, in order:
  `{{1}}` tier, `{{2}}` patient, `{{3}}` service, `{{4}}` doctor, `{{5}}` date & time,
  `{{6}}` booking channel. Without this, WhatsApp blocks free-form alerts outside the
  24-hour customer service window.

If you're upgrading an older VIP install, run `npm run db:backfill-phones` once to rewrite
identity keys from the old last-9 format to full E.164.

## Linking seeded doctor/admin accounts to real logins

`npm run db:seed` creates doctor and admin rows with placeholder Clerk ids (since they
aren't tied to real Clerk accounts) so the site has realistic data to show immediately.
To actually sign in as one of them:

1. Sign up normally through `/sign-up` using the **same email** as a seeded doctor/admin
   (see `src/db/seed.ts` for the list).
2. Update that user's `role` column in Postgres (or call `setUserRole()` from
   `src/lib/auth.ts`) to `doctor` or `admin`, and update `doctors.user_id` to point at
   the new row if you promoted a doctor.

In production, you'd instead invite staff and assign roles through an internal admin
tool — `setUserRole()` keeps Postgres and Clerk's `publicMetadata` in sync either way.

## Useful scripts

```bash
npm run dev          # start the dev server
npm run build        # production build
npm run lint          # ESLint
npm run db:generate   # generate Drizzle migrations from schema changes
npm run db:push       # push schema directly to the database (dev-friendly)
npm run db:studio     # open Drizzle Studio to browse data
npm run db:seed       # seed demo data
npm run db:backfill-phones  # one-off: populate VIP phone identity keys on existing patients
```

## Project structure

```
src/
  actions/            Server Actions (appointments, contact form)
  app/
    (marketing)/      Public site: home, services, about, contact, FAQ
    (auth)/           Clerk-branded sign-in / sign-up
    admin/            Admin dashboard (role: admin)
    doctor-portal/    Doctor dashboard (role: doctor)
    dashboard/        Patient dashboard (role: patient)
    book/             Booking wizard
    api/webhooks/     Clerk + QStash webhook handlers
  components/         UI components, grouped by feature
  db/                 Drizzle schema, client, and seed script
  lib/                Auth helpers, Redis, QStash, Resend, Zod schemas, clinic config
```

Route protection is enforced in `src/proxy.ts` (Next.js 16's `middleware.ts`
successor) with a layered approach: public marketing routes need no auth, `/dashboard`
and `/book` require any signed-in user, and `/admin` / `/doctor-portal` require a
staff role — re-checked again in each layout via `requireRole()` for defense in depth.
