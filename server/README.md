# Server README

This folder contains a small Node.js (ESM) example showing how to connect to Supabase and expose a couple of endpoints.

Setup

1. Install dependencies in the project root:

```powershell
npm install express @supabase/supabase-js dotenv
```

If you want to connect directly to Postgres (instead of Supabase client), also install `pg`:

```powershell
npm install pg
```

2. Create a `.env` file in the project root (or set environment variables) using `.env.example` as a template. You need `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (service role key is required for some server operations).

Postgres notes

- You can either set `DATABASE_URL` (a full Postgres connection string) or set the `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `PGPORT` variables individually.
- If your database requires SSL, set `PGSSLMODE=require`.

The server exposes an additional endpoint when Postgres env vars are present:

- `GET /pg/flights` — returns rows from `flights` table using a direct Postgres connection.

Run

```powershell
node server/index.mjs
```

Endpoints

- `GET /health` — health check
- `GET /flights` — returns rows from `flights` table (example)

Notes

- This example uses ESM modules via `.mjs` files. If you prefer CommonJS, rename files and add a `type` field in `package.json` or adjust imports accordingly.
