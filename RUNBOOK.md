# Production Runbook

## On-call quick checks

1. Check `/api/health`.
2. Check latest ingestion runs via `GET /api/ingestion/history`.
3. Check error logs (Sentry + platform logs).

## Ingestion incident playbook

1. Identify failing source from `sourceDetails`.
2. Retry with same `x-idempotency-key` only if prior run failed.
3. If source feed is down, disable source in `OFFICIAL_RETAIL_SOURCES_JSON`.
4. Run `POST /api/ingestion/sync-all` after recovery.

## Backup and restore cadence

- Enable automatic provider backups.
- Monthly restore drill:
  1. Restore backup to temporary database.
  2. Run smoke test (`/api/health`, ingestion history query).
  3. Document result and timestamp.

## Secret rotation

- Rotate `ADMIN_API_KEY` and `INGESTION_API_KEY` every 90 days.
- Update cloud env vars first, then restart deployments.

## Rollback procedure

1. Roll back app to previous release.
2. Verify health endpoint and core API endpoints.
3. Resume scheduled jobs.
