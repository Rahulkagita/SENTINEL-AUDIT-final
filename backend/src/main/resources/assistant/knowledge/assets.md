# Protected Assets

A **protected asset** is a named record SentinelAudit tracks. Assets are the
subject of the audit trail: every change to an asset produces an audit event and,
for state-replacing changes, a version snapshot.

## Fields

- `assetName` — human-readable name (required).
- `assetType` — category/type (required), shown as the asset "category".
- `description` — optional short free-text metadata (max 1000 characters).
- `content` — optional longer free text (max 5000 characters), accepted by the
  API but not shown in the asset UI (there is no document viewer yet).
- `status` — lifecycle status. Stored values are normalised for display to
  `connected`, `syncing`, `disconnected`, or `error`. New assets default to the
  raw status `ACTIVE`, which displays as `connected`.
- `department` — owning department.
- `ownerName` / `ownerEmail` — the recorded owner.
- `risk` — `low`, `medium`, or `high` (default `low`). This is a manually
  recorded label, **not** a computed score.
- `sourceApplication` — defaults to `SentinelAudit`.
- `version` — integer, starts at 1 and increments on each update/restore.
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`.
- `deleted` — soft-delete flag. Deleted assets are excluded from listings and
  single-asset reads.

## Listing, filtering and pagination

`GET /api/assets` is **server-side** filtered and paginated.

- `page` is **zero-based** (`page=0` is the first page).
- `pageSize` is between 1 and 200 (default 50).
- `search` matches, case-insensitively, against name, type, department, owner
  name, owner email, or an exact numeric id.
- `department` is a case-insensitive "contains" match.
- `status` accepts `connected`, `syncing`, `disconnected`, `error` and maps to
  the raw stored values it represents (e.g. `connected` also matches `ACTIVE`).
- `risk` accepts `low`, `medium`, `high`.
- The response `total` is the size of the **whole filtered set**, not just the
  returned page.
- Any unsupported query parameter, or an invalid `status`/`risk` value, is
  rejected with HTTP 400 rather than silently ignored.

Soft-deleted assets are never listed.

## Create / update / delete behaviour

- **Create** writes one `CREATE` audit event with the authenticated actor.
- **Update** snapshots the *previous* state as a version, applies the change,
  increments `version`, and writes an `UPDATE` audit event. A partial request
  body keeps the stored value for omitted fields; an explicit empty string
  clears `description`/`content`.
- **Delete** is a **soft delete**: the final state is snapshotted, `deleted` is
  set, status becomes `DELETED`, and a `DELETE` audit event is written.

## Ownership vs identity

`ownerName`/`ownerEmail` are stored attributes. They are **not** an
authorization boundary: this prototype is single-tenant, and any authenticated
user can read and modify any asset. Do not treat the owner field as access
control.
