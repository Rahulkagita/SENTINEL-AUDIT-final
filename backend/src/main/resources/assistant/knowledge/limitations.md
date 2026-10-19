# Known Limitations (Honest List)

These are the real, current limitations of SentinelAudit. Do not claim any of
these features exists.

1. **No anomaly detection.** There is no detection engine, no risk scoring, and
   no ML model. Audit severity is a constant `info`; asset `risk` is a manually
   recorded label.
2. **No cryptographic integrity.** There is no hash chain and no tamper-evident
   storage. `hash` and `previousHash` are empty by design.
3. **No IP or user-agent capture.** Audit events do not record source IPs,
   geolocation, or device information.
4. **No field-level diffs.** Audit events store a remark, not before/after field
   values. Version rows capture whole asset states, not per-field changes.
5. **Single-tenant authorization.** Any authenticated user can read or modify any
   asset. There is no tenant or owner isolation, and asset `ownerEmail` is not an
   access-control boundary.
6. **No token revocation.** JWTs are stateless with no blacklist; logout is
   client-side only. A leaked token stays valid until it expires.
7. **No refresh tokens.** Only a single access token is issued.
8. **Soft delete only.** Deleting an asset flags it; rows remain in the database.
   There is no hard-delete or retention policy.
9. **Version `operation` is not stored.** A version row is a snapshot, so no
   operation is attributed to it.
10. **Duplicate historical version rows.** A unique constraint on
    `(assetId, version)` was not added to the existing schema; new snapshots
    upsert, but pre-existing duplicate rows from before that fix may remain in an
    older database.
11. **`content` is not shown in the UI.** It is accepted and preserved by the
    API, but there is no document viewer.
12. **The assistant depends on an external model provider.** Without a
    configured API key the assistant returns a "not configured" error; it does
    not answer offline. It is read-only and cannot act on the system.

When a question touches any of these areas, state the limitation plainly rather
than inventing a capability.
