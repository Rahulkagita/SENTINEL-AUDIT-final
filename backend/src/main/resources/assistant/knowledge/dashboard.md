# Dashboard Metrics

The dashboard summarises the deployment. All values are raw database counts, not
model output and not risk scores.

## Summary — `GET /api/dashboard/summary`

- `totalAssets` — total asset rows (including soft-deleted ones, because it is a
  simple table count).
- `totalVersions` — total version rows.
- `totalAuditLogs` — total audit events.
- `totalUsers` — total accounts.

## Audit-action breakdown — `GET /api/dashboard/audit-actions`

The count of audit events grouped by `action` (CREATE/UPDATE/DELETE/RESTORE).

## Assets by type — `GET /api/dashboard/assets-by-type`

Asset counts grouped by `assetType`, excluding soft-deleted assets.

## Recent activity — `GET /api/dashboard/activities`

The ten most recent audit events, newest first.

## Interpreting the numbers

- Counts are literal table counts. A decreasing `totalAssets` means assets were
  soft-deleted (they are excluded from listings but still counted here).
- There is no trend analysis, forecasting, or anomaly detection behind these
  figures. Present them as raw counts.

## Suggested questions that hit these endpoints

- "Summarize the current dashboard metrics."
- "Explain the audit-action breakdown."
- "How many assets, versions and audit events are there?"
