# The Gun Spa

Luxury indoor shooting range and private members club in Jamaica, Queens.
An apple.com-style marketing site with real-time reservations, a members portal, and a front-desk admin.
Built with Next.js 16, React 19, Tailwind CSS 4, Drizzle ORM, and Postgres (PGlite in development).

## Quick start

```bash
npm install
cp .env.example .env.local     # optional — everything works with no env vars
npm run dev                    # http://localhost:5000
```

Set `ADMIN_PASSWORD` in `.env.local` to use the front desk at `/admin`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 5000 |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit + integration tests (booking engine, members, timezones) against in-memory Postgres |
| `npm run e2e` | Playwright smoke test with screenshots (`e2e/screenshots`). One-time setup: `npm run e2e:setup` installs Chromium. Needs either a built app (`npm run build`) or a running dev server on port 5000 (or `E2E_BASE_URL`). The booking test writes one test reservation into the local `./.data` dev DB. |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |

## Deploying on Replit

1. Import this repository into Replit. The `.replit` file configures the dev server and an Autoscale deployment.
2. Open **Database** and create a PostgreSQL database. This sets `DATABASE_URL`.
3. Add secrets: `ADMIN_PASSWORD`, `SESSION_SECRET` (a long random value, e.g. `openssl rand -base64 32`; member sign-in refuses to run in production without it), and optionally the Stripe and Resend keys. The public origin for Stripe redirects, emails, the sitemap and Open Graph tags is `canonicalUrl` in `src/lib/config/site.ts` (`https://gunspa.com`); `NEXT_PUBLIC_SITE_URL` overrides it for a staging address. Replit's deployment builder does not pass secrets to `next build`, so keep the canonical domain in the config rather than in a secret.
4. Deploy. Tables are created automatically on first request. A deployment without `DATABASE_URL` refuses to start rather than silently using the embedded, per-instance database.
5. For the day-before reminder email, add a `CRON_SECRET` secret (a long random value) and create a Scheduled Deployment that runs `curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://gunspa.com/api/cron/reminders` once a day at 10:00 America/New_York. Each confirmed reservation starting the next day is mailed once (`bookings.reminder_sent_at` records it).

## How reservations work

- The catalog in `src/lib/content/catalog.ts` defines bookable experiences (lanes, suites, training, simulator bays, member services). Each references a **resource** in `src/lib/config/site.ts` with a capacity (for example, 12 signature lanes). Capacity is shared by every experience using that resource.
- A booking consumes `ceil(guests / maxGuestsPerUnit)` units. Availability for a slot is `capacity − units in use` at the worst moment inside the slot.
- Creation runs inside a transaction with a Postgres advisory lock per resource and day, so two guests cannot take the last lane.
- With `STRIPE_SECRET_KEY` unset, reservations confirm immediately as pay-on-arrival. With it set, a Stripe Checkout session is created for the booking's computed total, the slot is held for 30 minutes (plus a short grace so a last-second payment still lands), and the webhook (or the confirmation page) marks it paid. Member-included ($0) services confirm without Checkout.
- Guests can cancel online up to 24 hours before start (72 hours for suites) via the confirmation page. A card payment cancelled online is refunded automatically; staff cancellations never refund by themselves, and a cancelled-but-paid row is flagged "Refund owed" in the front desk.
- Email (`src/lib/email.ts`, sent through Resend when `RESEND_API_KEY` is set, logged otherwise): the confirmation attaches an `.ics` built by `src/lib/ics.ts` (New York timezone block, alarm an hour before the free-cancel window closes) and links Google Calendar and the map; a cancellation goes out when a guest cancels or a Stripe hold expires unpaid; the reminder goes out the day before from `/api/cron/reminders`. Reply-To is the desk address.

## Members

- Staff create members at `/admin/members` after vetting; the app generates a member number and a one-time activation code.
- Members activate at `/members/activate`, then sign in at `/members/login`.
- Signed-in members see member-only experiences, member pricing, a longer booking window, and can request lockers, guest passes, storage and concierge services from `/members`.
- Tiers and perks live in `src/lib/content/membership.ts`; tier gating uses `minTier` on catalog items.

## Content and brand

All copy lives in `src/lib/content/*`. Colors are CSS tokens in `src/app/globals.css`; the accent is the gold from the logo, and `--color-accent-deep` is the darker gold used for small text on white. The logo lockup ("GUN | SPA", tagline "Ready? Aim. Relax!") is rebuilt as SVG in `src/components/Wordmark.tsx`. Photo placeholders and how to replace the wordmark with the original artwork are listed in `MEDIA.md`.
