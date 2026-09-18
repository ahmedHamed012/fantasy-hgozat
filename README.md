# ⚽ Weekly Football

Turn casual weekly 5-a-side matches into a season-long competition. Admins
record live match stats with fast tap counters; the app calculates team scores,
match points, Man of the Match, career rankings and achievement badges
automatically.

Bilingual out of the box: **English (LTR)** and **العربية (RTL)**.

---

## Features

- **Fast live scoring** — per-player `+`/`−` counters for goals, assists, saves
  and own goals; team scores update automatically (own goals credit the
  opponent). No page reloads.
- **Match lifecycle** — DRAFT → LIVE → FINISHED (or CANCELLED), enforced.
- **Points, MOTM & rankings** — centralized scoring, deterministic Man of the
  Match with tie-breakers, a dynamic global leaderboard.
- **Player profiles** — career stats (aggregated, never denormalized), recent
  form, unlocked badges.
- **Achievements** — data-driven catalog (Hat Trick, Double Hat Trick,
  Playmaker, Wall, Century, On Fire), evaluated when a match is finished.
- **Bilingual + responsive** — Arabic/English with full RTL; large touch
  targets for phone/tablet use during matches.

## Tech stack

- **Backend:** Node.js, Express, TypeScript
- **Views:** Pug (server-rendered) + vanilla JS for the live counters
- **Database:** PostgreSQL (Supabase) via Prisma ORM + migrations
- **Auth:** stateless JWT session cookie, bcrypt password hashing, CSRF
  protection — serverless-friendly (no session store)
- **Deploy:** Vercel

## Requirements

- **Node.js ≥ 18.18** (developed on Node 22)
- **npm**
- A **PostgreSQL** database — a free **Supabase** project works well

## Installation

```bash
npm install
```

## Environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable          | Purpose                                                        |
| ----------------- | ------------------------------------------------------------- |
| `DATABASE_URL`    | Pooled connection (PgBouncer, port `6543`) — used at runtime  |
| `DIRECT_URL`      | Direct connection (port `5432`) — used by Prisma Migrate       |
| `SESSION_SECRET`  | Signs the JWT session cookie (long random string)             |
| `CSRF_SECRET`     | Signs CSRF tokens (a different long random string)            |
| `ADMIN_EMAIL`     | Bootstrap admin email (used by the seed / create-admin)       |
| `ADMIN_PASSWORD`  | Bootstrap admin password                                      |
| `NODE_ENV`        | `development` or `production`                                 |
| `PORT`            | Local port (default `3000`)                                   |

> Never commit `.env`. On Supabase, the pooled `DATABASE_URL` (6543) and direct
> `DIRECT_URL` (5432) are both required — pooled for the app, direct for
> migrations.

## Database (Prisma)

Generate the client, apply migrations and seed demo data:

```bash
npx prisma generate
npx prisma migrate dev      # local development (creates/updates the schema)
npm run db:seed             # 12 players, 5 finished matches, badges
```

Create the first admin without seeding demo data:

```bash
npm run create-admin        # uses ADMIN_EMAIL / ADMIN_PASSWORD
```

## Development

```bash
npm run dev                 # tsx watch on http://localhost:3000
```

- Public: `/` (home), `/leaderboard`, `/players/:id`
- Admin: `/auth/login`, then `/admin`

## Testing

Critical business logic (scoring, team scores, own goals, MOTM, ranking order,
achievement rules, lifecycle guards) is covered by Vitest:

```bash
npm test
```

## Type-check & build

```bash
npm run typecheck
npm run build               # tsc -> dist (for `npm start`)
npm start
```

## Deployment (Vercel)

The app runs as a single serverless function (`api/index.ts` exports the
Express app; `vercel.json` rewrites all routes to it and bundles the Pug views
and static assets via `includeFiles`).

1. Push the repo to GitHub and import it into Vercel.
2. Set the environment variables (above) in **Project → Settings → Environment
   Variables**. Use the Supabase pooled `DATABASE_URL` and direct `DIRECT_URL`.
3. Deploy. The build step runs:

   ```bash
   npm run vercel-build     # prisma generate && prisma migrate deploy
   ```

   `prisma migrate deploy` applies the committed migrations to the database —
   the schema is created/updated from the migration history, never from manual
   changes.

### Applying migrations manually

```bash
npx prisma migrate deploy
```

## Project structure

```
api/            Vercel serverless entry (exports the Express app)
prisma/         schema.prisma, migrations/, seed.ts
src/
  config/       env-validated configuration
  controllers/  request handlers (thin)
  services/     business logic (Player, Match, LiveMatch, Scoring, Ranking,
                Statistics, Achievement, Auth)
  repositories/ (data access is via Prisma in services for the MVP)
  middleware/   auth, locale, CSRF, rate-limit, errors
  routes/       route definitions
  i18n/         en/ar dictionaries + translator
  views/        Pug templates (layouts, partials, admin, players, matches)
  public/       css / js / images
  lib/          prisma client, jwt, bcrypt, csrf
tests/          Vitest suites
```

Scoring, ranking and achievement rules live in services (not controllers or
templates), so the same logic can back a future mobile API without a rewrite.
