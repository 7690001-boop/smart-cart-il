# Deployment Guide

## Cloud Baseline (Free Tier)

1. Create Vercel project from this repository.
2. Provision managed Postgres (Neon/Supabase free tier).
3. Provision Redis/queue free tier if needed (Upstash).
4. Set all environment variables in Vercel project settings.

## Required Environment Variables

- `DATABASE_URL`
- `ADMIN_API_KEY`
- `INGESTION_API_KEY`
- `GOV_CATALOG_BASE_URL`
- `GOV_CATALOG_RESOURCE_ID`
- `GOV_CATALOG_API_KEY` (optional)
- `RETAILER_FEED_URLS` (optional)
- `OFFICIAL_RETAIL_SOURCES_JSON` (optional)
- `SENTRY_DSN` (optional)
- `NEXT_PUBLIC_SENTRY_DSN` (optional)

## Database Migration

1. Run `npx prisma generate`
2. Run `npx prisma migrate deploy`

## Scheduler

`vercel.json` triggers `/api/cron/sync-prices` daily.
Pass `x-api-key` header using `INGESTION_API_KEY` from scheduler integration.

## Rollback

1. Re-deploy previous successful Vercel deployment.
2. Run DB restore from managed provider backup.
3. Validate `/api/health`.

## Vendor Migration (Render/Fly/Railway)

1. Reuse same Dockerfile.
2. Point to new Postgres via `DATABASE_URL`.
3. Set same env vars.
4. Configure equivalent cron job endpoint.
