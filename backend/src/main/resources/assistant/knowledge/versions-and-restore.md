# Versions and Restoration

SentinelAudit keeps a lightweight version history so an asset's earlier state
can be inspected and restored.

## When a version snapshot is written

A snapshot is stored **before** an asset's stored state is replaced:

- On **update**: the pre-update state is saved as version `v{n}` (where `n` is
  the asset's version number *before* the update), then the asset's `version` is
  incremented.
- On **delete**: the final state is snapshotted, preserving history after the
  asset is soft-deleted.
- On **restore**: the current state is snapshotted first, the target version's
  content is applied, the `version` is incremented, and the new state is
  snapshotted.

## Version rows

Each row stores: asset id, version number, the captured `assetName`,
`assetType`, `description`, `content`, `status`, who modified it
(`modifiedBy` = actor email), and when (`modifiedAt`).

Version numbers are unique per asset. Indexing/snapshotting **upserts** on
`(assetId, version)`, so consecutive restores cannot create two rows with the
same version number.

## Reading versions

- `GET /api/versions/asset/{assetId}` — paginated history, newest first
  (`page` zero-based, `pageSize` up to 200).
- `GET /api/versions/asset/{assetId}/{version}` — one snapshot.
- Version history stays readable after a soft delete; restoring is blocked for
  deleted assets.

## Restoring

`POST /api/versions/restore` with `{ "assetId": "12", "versionName": "v2" }`:

- Existing history is preserved (the pre-restore state is snapshotted).
- A **new** version row holds the restored content.
- A `RESTORE` audit event is written with the real actor.
- The live asset returns to the captured values of the target version.

## Limits

- Version rows capture asset fields only — there are no field-level diffs and no
  cryptographic hashes.
- The `operation` shown on a version row is not recorded per version (a version
  is a snapshot, not an event), so it is intentionally blank rather than guessed.
