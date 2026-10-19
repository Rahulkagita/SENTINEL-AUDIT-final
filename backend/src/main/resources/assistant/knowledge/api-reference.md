# API Reference (Core Endpoints)

All endpoints are under `/api`. Everything except `login`, `register`, and
`health` requires `Authorization: Bearer <JWT>`.

## Auth

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account (returns a token). |
| POST | `/api/auth/login` | Authenticate (returns a token). |
| GET | `/api/auth/me` | Current user. |
| POST | `/api/auth/logout` | Client-side sign-out. |

## Assets

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/assets` | Filtered, paginated listing (server-side filters). |
| GET | `/api/assets/{id}` | One asset. |
| POST | `/api/assets` | Create (writes `CREATE`). |
| PUT | `/api/assets/{id}` | Update (snapshots previous state, writes `UPDATE`). |
| DELETE | `/api/assets/{id}` | Soft delete (writes `DELETE`). |

Query parameters for `GET /api/assets`: `page` (zero-based), `pageSize`,
`search`, `department`, `status`, `risk`. Unknown parameters return `400`.

## Audit

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/audit/logs` | Paginated events; `search`, `operation`. |
| GET | `/api/audit/logs/{id}` | One event. |
| GET | `/api/audit/timeline` | Events with optional `assetId` scope. |
| GET | `/api/audit/timeline/entity/{assetId}` | One asset's events. |

## Versions

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/versions/asset/{assetId}` | Paginated version history. |
| GET | `/api/versions/asset/{assetId}/{version}` | One snapshot. |
| POST | `/api/versions/restore` | Restore a version (writes `RESTORE`). |

## Dashboard

`GET /api/dashboard/summary`, `/audit-actions`, `/assets-by-type`, `/activities`,
`/version-growth`.

## Assistant

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/assistant/chat` | Ask a question (grounded, read-only). |
| GET | `/api/assistant/status` | Readiness/config snapshot (no secrets). |
| POST | `/api/assistant/reindex` | Re-index approved docs (idempotent). |

## Pagination convention

List endpoints are **zero-based** (`page=0` is the first page). `total` is the
size of the complete filtered result set. The UI displays one-based page
numbers, translated in the service layer.
