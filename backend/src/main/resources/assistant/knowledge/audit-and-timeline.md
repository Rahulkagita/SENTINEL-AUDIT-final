# Audit Events and Timeline

The audit trail is the core record of SentinelAudit. When an asset is created,
updated, deleted, or restored, the backend writes a row to the `audit_logs`
table.

## What an audit event records

- `action` — one of `CREATE`, `UPDATE`, `DELETE`, `RESTORE`.
- `assetId` and `assetName` — the asset the event refers to.
- `username` — the **email of the authenticated principal** that performed the
  action, taken from the server-side JWT identity (or `SYSTEM` when no user
  context exists).
- `timestamp` — when the event was written.
- `remarks` — a short human-readable note (e.g. `Asset created`,
  `Asset updated successfully`, `Restored version v2`).

## What an audit event does NOT record

The backend does **not** capture:

- IP addresses or user-agent headers;
- before/after field-level diffs;
- cryptographic hashes or any hash chain (the `hash`/`previousHash` fields are
  intentionally empty);
- severity or anomaly scores (severity is a constant `info`).

The frontend must never present those empty fields as evidence of tampering,
provenance, or detection.

## Reading the log

`GET /api/audit/logs` — newest first, paginated. Parameters: `page` (zero-based),
`pageSize`, `search` (asset name, actor, action, remarks, or asset id) and
`operation` (exact action). `total` reflects the filtered set.

`GET /api/audit/timeline` — the same events with an optional `assetId` scope, so
you can view one asset's history.

## Answering "who changed asset X?"

To answer this honestly:

1. Read the audit events for the asset (`list_audit_events` with the asset id).
2. Report the recorded `username` and `timestamp` of the relevant event.
3. State clearly that the actor is the authenticated account recorded at the
   time. Do not infer intent.

## Answering "was this suspicious?"

The records can show *what* changed, by whom, and when. They cannot establish
malicious intent. There is **no automated anomaly detection** in SentinelAudit.
An honest answer describes the observed events and explicitly says that
maliciousness cannot be established from the stored evidence.
