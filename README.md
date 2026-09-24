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
| `npm run e2e` | Playwright smoke test with screenshots (`e2e/screenshots`) |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |

## Deploying on Replit

1. Import this repository into Replit. The `.replit` file configures the dev server and an Autoscale deployment.
2. Open **Database** and create a PostgreSQL database. This sets `DATABASE_URL`.
3. Add secrets: `ADMIN_PASSWORD`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, and optionally the Stripe and Resend keys.
4. Deploy. Tables are created automatically on first request.

## How reservations work

- The catalog in `src/lib/content/catalog.ts` defines bookable experiences (lanes, suites, training, simulator bays, member services). Each references a **resource** in `src/lib/config/site.ts` with a capacity (for example, 12 signature lanes). Capacity is shared by every experience using that resource.
- A booking consumes `ceil(guests / maxGuestsPerUnit)` units. Availability for a slot is `capacity − units in use` at the worst moment inside the slot.
- Creation runs inside a transaction with a Postgres advisory lock per resource and day, so two guests cannot take the last lane.
- With `STRIPE_SECRET_KEY` unset, reservations confirm immediately as pay-on-arrival. With it set, a Stripe Checkout session is created, the slot is held for 30 minutes, and the webhook (or the confirmation page) marks it paid.
- Guests can cancel online up to 24 hours before start via the confirmation page.

## Members

- Staff create members at `/admin/members` after vetting; the app generates a member number and a one-time activation code.
- Members activate at `/members/activate`, then sign in at `/members/login`.
- Signed-in members see member-only experiences, member pricing, a longer booking window, and can request lockers, guest passes, storage and concierge services from `/members`.
- Tiers and perks live in `src/lib/content/membership.ts`; tier gating uses `minTier` on catalog items.

## Content and brand

All copy lives in `src/lib/content/*`. Colors are CSS tokens in `src/app/globals.css`; the accent is the gold from the logo, and `--color-accent-deep` is the darker gold used for small text on white. The logo lockup ("GUN | SPA", tagline "Ready? Aim. Relax!") is rebuilt as SVG in `src/components/Wordmark.tsx`. Photo placeholders and how to replace the wordmark with the original artwork are listed in `MEDIA.md`.
