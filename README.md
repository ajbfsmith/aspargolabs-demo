This is a [Next.js](https://nextjs.org) landing site for Accelerate Health with Bask attribution, blog (Sanity), and email visit tracking (`/go`).

## Getting Started

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Bask attribution

- Inbound tracked links: `/go?utm_*` → `attribution_visits`
- Intake handoff: `/checkout`, `/r/{clickId}` → `link_clicks`
- Bask webhooks: `POST /api/webhooks/bask` — stores **bf-hezkue** journeys only

See `docs/attribution-utm-conventions.md`.

## Database

```bash
npm run db:migrate
```

## Tests

```bash
npm run test:integration
```

## Deploy on Vercel

Set env vars from `.env.example` (Supabase, Bask webhook secret, Sanity, `NEXT_PUBLIC_SITE_URL`).
