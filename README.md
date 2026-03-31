# Astra Ledger

Astra Ledger is a premium personal finance dashboard built with Next.js, Prisma, MongoDB, Plaid, and three.js.

It is designed to showcase:

- Plaid sandbox and live-ready transaction ingestion
- MongoDB-backed storage through Prisma
- Budgeting, savings goals, recurring commitments, and scenario planning
- Manual transaction entry and natural-language quick add
- Motion-rich dashboard UI with anime.js and a pointer-reactive three.js backdrop
- A fallback sample mode so the app still runs before live services are configured

## What This Project Supports

The app can run in two modes:

1. Sample mode
   - Uses bundled sample accounts and transactions for the core dashboard visuals
   - Useful for design demos, local UI work, and quick bootstrapping
2. Live mode
   - Uses MongoDB + Prisma for app-owned data
   - Uses Plaid for linked account balances and categorized transactions
   - Recommended for staging and production

Important:

- Manual transactions, budgets, goals, and recurring items use MongoDB whenever `DATABASE_URL` is configured and reachable.
- If no database is configured, those app-owned records fall back to the local JSON workspace store for development/demo convenience.
- For a real deployment, use MongoDB and set `USE_SAMPLE_DATA=false`.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma
- MongoDB
- Plaid API
- anime.js
- three.js

## Prerequisites

Before you run the project, make sure you have:

- Node.js 20 or newer
- npm 10 or newer
- MongoDB 6+ locally, Docker, or MongoDB Atlas
- Plaid sandbox credentials if you want live transaction sync

## Environment Variables

Copy the example file first:

```bash
cp .env.example .env
```

If you are on PowerShell:

```powershell
Copy-Item .env.example .env
```

Available variables:

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes for live mode | `mongodb://127.0.0.1:27017/astra_ledger` or Atlas `mongodb+srv://...` | Prisma/MongoDB connection string (must start with `mongo`) |
| `PLAID_CLIENT_ID` | Yes for Plaid sync | `...` | Plaid client id |
| `PLAID_SECRET` | Yes for Plaid sync | `...` | Plaid secret |
| `PLAID_ENV` | Recommended | `sandbox` | Plaid environment |
| `PLAID_WEBHOOK_URL` | Optional | `https://your-app.com/api/plaid/webhook` | Reserved for webhook expansion |
| `USE_SAMPLE_DATA` | Yes | `true` or `false` | Controls whether the dashboard uses sample or live account data |
| `NODE_ENV` | Optional | `development` | Standard Node runtime flag |
| `PORT` | Optional | `3000` | Local/server port |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start MongoDB (optional if you use Atlas)

Local Docker:

```bash
docker run --name astra-mongo ^
  -p 27017:27017 ^
  -d mongo:7
```

macOS/Linux:

```bash
docker run --name astra-mongo -p 27017:27017 -d mongo:7
```

Set `DATABASE_URL=mongodb://127.0.0.1:27017/astra_ledger` in `.env`.

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Create database tables

For local development:

```bash
npm run db:push
```

### 5. Start the app

```bash
npm run dev
```

Open:

- [http://localhost:3000](http://localhost:3000)

## How To Run It Locally

### Fastest UI-only path

Use this when you only want the finished interface and interactions:

1. Set `USE_SAMPLE_DATA=true`
2. Leave Plaid credentials empty
3. Start the app with `npm run dev`

You will still get:

- sample balances
- sample transactions
- dashboard animations
- budgeting, goals, recurring items, and manual entry surfaces

### Full local live path

Use this when you want the real database-backed setup:

1. Set a working `DATABASE_URL`
2. Run `npm run db:push`
3. Set `USE_SAMPLE_DATA=false`
4. Optionally add Plaid sandbox credentials
5. Start with `npm run dev`

### Full Plaid sandbox path

1. Create a Plaid sandbox app in the Plaid dashboard
2. Set:
   - `PLAID_CLIENT_ID`
   - `PLAID_SECRET`
   - `PLAID_ENV=sandbox`
3. Set a working `DATABASE_URL`
4. Run:

```bash
npm run db:push
npm run dev
```

5. Open the app
6. Use the Plaid connect panel
7. Link a sandbox institution

Result:

- Plaid accounts are written into MongoDB
- Plaid transactions are written into MongoDB
- Manual entries, goals, budgets, and recurring items also persist in MongoDB

## Useful Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts Next.js in development mode |
| `npm run build` | Creates the production build |
| `npm run start` | Runs the compiled production app |
| `npm run lint` | Runs ESLint |
| `npm run prisma:generate` | Generates Prisma Client |
| `npm run db:push` | Pushes the Prisma schema to the database |
| `npm run db:migrate` | Alias for `prisma db push` (MongoDB has no SQL migrations) |
| `npm run db:deploy` | Same — push schema to MongoDB |

## Production Deployment

### Recommended production stack

The cleanest production setup is:

- Next.js app on Vercel, Render, Railway, Fly.io, or Docker/Kubernetes
- MongoDB Atlas, self-hosted MongoDB, or a managed MongoDB service your host provides
- Plaid in `development` or `production` mode

### Production environment values

At minimum, set:

```env
DATABASE_URL=mongodb+srv://...   # or mongodb://... for self-hosted
USE_SAMPLE_DATA=false
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=development
NODE_ENV=production
```

Use `PLAID_ENV=production` only when your Plaid account is approved for production access.

### Vercel deployment

1. Push this repository to GitHub/GitLab/Bitbucket
2. Import the repo into Vercel
3. Add all environment variables in the Vercel project settings
4. Make sure `DATABASE_URL` points to your hosted MongoDB instance
5. Run the schema bootstrap once against that database:

```bash
npm run db:push
```

6. Deploy

Notes:

- The app already builds successfully with `next build`
- `postinstall` runs `prisma generate`, which helps hosted builds
- `output: "standalone"` is enabled for container-friendly builds

### Docker deployment

This repo includes:

- `Dockerfile`
- `.dockerignore`

Build the image:

```bash
docker build -t astra-ledger .
```

Run the container:

```bash
docker run --rm -p 3000:3000 --env-file .env astra-ledger
```

Before starting the production container, make sure the database schema already exists.

For a first boot, run schema setup from your CI pipeline or a release step:

```bash
npm run db:push
```

If you adopt versioned Prisma migrations later, switch that release step to:

```bash
npm run db:deploy
```

## Health Check

The app exposes a simple health route:

- `GET /api/health`

It reports:

- overall status
- current app mode
- database readiness
- Plaid configuration state

This is useful for:

- uptime monitors
- container readiness checks
- deployment verification

## Production Readiness Checklist

Before calling this production-ready, verify the following:

- `USE_SAMPLE_DATA=false`
- `DATABASE_URL` points to managed MongoDB (e.g. Atlas)
- Plaid environment is correct for your account stage
- `npm run build` passes
- database schema has been applied
- `/api/health` returns `200`
- secrets are stored in your deployment provider, not in source control
- logs and monitoring are enabled on your host

## API Surface

Current app routes:

- `POST /api/plaid/create-link-token`
- `POST /api/plaid/exchange-public-token`
- `GET|POST|DELETE /api/manual-transactions`
- `POST /api/quick-add`
- `GET|POST /api/goals`
- `GET|POST /api/budgets`
- `GET /api/health`

## Project Structure

```text
src/
  app/
    api/
    page.tsx
    globals.css
  components/
    dashboard-shell.tsx
    plaid-connect.tsx
    scene-backdrop.tsx
    workspace-ui.tsx
  lib/
    dashboard.ts
    finance.ts
    goals.ts
    budgets.ts
    manual-transactions.ts
    recurring-items.ts
    quick-add.ts
    db.ts
    env.ts
prisma/
  schema.prisma
Dockerfile
.env.example
```

## Troubleshooting

### The app opens but still shows demo data

Check:

- `USE_SAMPLE_DATA=false`
- `DATABASE_URL` is set
- MongoDB is reachable

### Plaid button says config is missing

Check:

- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV`

### Prisma errors during startup

Try:

```bash
npm run prisma:generate
npm run db:push
```

### Deploy succeeds but persistence does not work

Check:

- the deployed app can reach MongoDB
- `DATABASE_URL` is set in the hosting provider
- you are not relying on local file storage in production

### PowerShell shows `UNC paths are not supported` or `EISDIR: lstat 'C:'`

This happens when PowerShell is running from a provider-qualified path like:

```powershell
PS Microsoft.PowerShell.Core\FileSystem::\\?\C:\project1>
```

`npm` uses `cmd.exe` for scripts on Windows, and `cmd.exe` does not like that path form.

Use one of these fixes:

1. Open a fresh terminal and switch to a normal drive path:

```powershell
Set-Location C:\project1
npm run dev
```

2. If your shell still shows the `\\?\` path form, run through `cmd` explicitly:

```powershell
cmd /c "cd /d C:\project1 && npm run dev"
```

3. If you are launching from an editor terminal, open a new terminal rooted at plain `C:\project1` instead of the provider-qualified path.

For local and production stability on Windows, prefer Node 20 LTS or Node 22 LTS.

## Current State Of Production Support

As of March 27, 2026:

- the app builds cleanly for production
- the production path stores app-owned finance workspace data in MongoDB when configured
- Docker/standalone deployment is supported
- health checks are available

The main remaining hardening step for a larger real-world rollout would be adding versioned Prisma migrations to source control and plugging in centralized logging/monitoring.
