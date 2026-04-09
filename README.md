# Smart Cart IL

Mobile-first Next.js MVP to optimize grocery shopping in Israel.

## Features

- Accounts and authenticated shopping lists.
- Gmail login via Google OAuth.
- Per-item replacement restrictions (brand, kosher, premium, size tolerance).
- Central feed ingestion endpoint.
- Government catalog full sync (all items) + persistent ingestion history.
- CPFTA retailer-registry sync from configured retailer connection details (daily scan).
- Single-store basket optimization with explainable output.
- Admin clustering review queue.

## Run

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Run tests: `npm run test`
4. Generate Prisma client: `npx prisma generate`

## Government Catalog Sync Setup

Set in `.env`:

- `GOV_CATALOG_BASE_URL` (default `https://data.gov.il`)
- `GOV_CATALOG_RESOURCE_ID` (required)
- `GOV_CATALOG_API_KEY` (optional)
- `CPFTA_SOURCE_OVERRIDES_JSON` (required JSON with retailer links/credentials metadata)
 - `CPFTA_REGISTRY_JSON_URL` (optional: endpoint returning the gov page JSON payload)
  - Each source can include `syncCadenceMinutes` (minimum 15). Example:
  - `[{\"nameHe\":\"שופרסל\",\"storeId\":\"s1\",\"feedUrl\":\"https://...\",\"authHint\":\"token=...\",\"syncCadenceMinutes\":60}]`
- `RETAILER_FEED_URLS` (optional comma-separated JSON feed URLs from supermarket websites)
- `OFFICIAL_RETAIL_SOURCES_JSON` (optional JSON array to override official source registry)
- `ADMIN_API_KEY` (required for `/api/admin/*`)
- `ADMIN_EMAILS` (comma-separated admin users, works with Gmail login)
- `INGESTION_API_KEY` (required for `/api/ingestion/*` and `/api/cron/*`)
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (optional)

Recommended strategy:
- Use government catalog as base truth (coverage + compliance).
- Add retailer feeds to enrich barcode/image fields.
- Use unified sync endpoint to merge and deduplicate.

## API Endpoints

- `POST /api/auth/login`
- `GET /api/lists`
- `POST /api/lists`
- `POST /api/lists/[listId]/items`
- `POST /api/ingestion/sync`
- `POST /api/ingestion/sync-government`
- `POST /api/ingestion/sync-cpfta-sources`
- `POST /api/ingestion/sync-retailers`
- `POST /api/ingestion/sync-all`
- `POST /api/ingestion/sync-official-sources`
- `GET /api/ingestion/history`
- `GET /api/retail-sources`
- `GET /api/cron/registry-sync` (daily metadata sync)
- `GET /api/cron/catalog-sync` (frequent product/price sync by due cadence)
- `POST /api/optimize`
- `GET/PATCH /api/admin/clusters`
- `GET /api/health`
- `GET/POST /api/auth/[...nextauth]`

## Cloud Production

- Vercel cron is configured in `vercel.json`.
- CI pipeline is configured in `.github/workflows/ci.yml`.
- Deployment and migration guide: `DEPLOYMENT.md`.
- On-call and incident runbook: `RUNBOOK.md`.

## Gmail Login Setup

Set in `.env` or cloud env vars:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `ADMIN_EMAILS` (e.g. `you@gmail.com`)

Then use `/login` page to sign in with Gmail.