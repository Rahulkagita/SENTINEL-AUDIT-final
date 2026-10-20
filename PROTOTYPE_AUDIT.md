# Prototype Audit — SentinelAudit

**Date:** 2026-10-19
**Scope:** Full audit and refactor of the SentinelAudit prototype (Next.js 13 frontend + Spring Boot/PostgreSQL backend): removal of all mock/placeholder data, wiring the frontend to the real backend, navigation simplification, honest anomaly-detection decision, security fixes, and tests.

**Outcome in one paragraph:** The frontend no longer contains any mock API routes or fabricated data. Every screen reads from the Spring Boot backend, either through a transparent `/api` proxy (default, zero-config) or via direct calls when `NEXT_PUBLIC_API_BASE_URL` is set. Navigation was reduced to five working sections (Dashboard, Protected Assets, Audit Logs, Audit Timeline, Settings). Anomaly detection was **deferred** (see §4) because no detection engine exists in the backend. One hardcoded credential was removed from the backend configuration. A follow-up validation pass (§9) closed the remaining MVP gaps: asset filtering/pagination is now server-side, the `description` field is captured in the UI, a fabricated version "operation" badge was removed, and the dashboard→audit-log deep link was made functional. **46 frontend tests and 34 backend tests pass**, and an end-to-end smoke test against the running local stack confirmed real backend responses (including 401s) now flow through the frontend.

---

## 1. What was removed (mock & dead code)

### 1.1 Mock API layer (the core problem)

The frontend shipped its own Next.js API route handlers under `frontend/src/app/api/**` that returned fabricated data from `services/mock-data.ts`. Because these filesystem routes shadowed everything, the app **never talked to the Spring Boot backend at all** — it served fake dashboards, fake audit logs, fake auth, and fake anomalies.

**Deleted (18 route handlers + their data source):**

| Group | Deleted files |
|---|---|
| Mock auth | `app/api/auth/login/route.ts`, `auth/register`, `auth/me`, `auth/[...path]` |
| Mock assets | `app/api/assets/route.ts`, `assets/[id]` |
| Mock audit | `app/api/audit/logs`, `audit/timeline`, `audit/timeline/entity/[entityId]` |
| Mock versions | `app/api/versions/asset/[id]`, `versions/restore` |
| Mock dashboard | `app/api/dashboard/route.ts` |
| Mock extras | `app/api/analytics/anomalies(+/[id])`, `integrations(+/[id])`, `reports`, `settings/system` |
| Data source | `services/mock-data.ts`, `lib/api-helper.ts` |

### 1.2 Fake multi-tenant workspace system

The backend ignores workspace headers entirely; the whole workspace layer was frontend theater.

- Deleted: `providers/workspace-provider.tsx`, `components/layout/workspace-switcher.tsx`, `hooks/use-workspace.ts`
- Removed the `X-Workspace-Id` header from `services/http-client.ts` (previously sent from a localStorage key)
- Removed `WorkspaceProvider` from `providers/app-providers.tsx`

### 1.3 Anomalies / Integrations / Reports / Analytics / Settings services

No backend endpoints exist for any of these.

- Deleted hooks: `use-anomalies.ts`, `use-integrations.ts`
- Deleted services: `analytics.ts`, `integration.service.ts`, `reports.ts`, `settings.ts`
- Deleted pages + features: `app/anomalies`, `app/integrations`, `features/anomalies`, `features/integrations`
- Pruned the `features/index.ts` and `services/index.ts` barrels (verified unimported before deletion)

### 1.4 Marketing & fabricated-claims pages

- Deleted pages: `/about`, `/contact`, `/faq`, `/features`, `/industries`, `/pricing` + `content/marketing.ts` + `components/marketing/*` (including the fake `ProductScreenshot` component rendering invented UI)
- Deleted walkthrough docs for the removed mock workspace system (`components/layout/walkthrough.md`, `app/entities/versions/walkthrough.md`)

### 1.5 Dead auth placeholders

Backend implements only `login`, `register`, `me`, `logout`. These pages offered flows that could never work:

- Deleted: `auth/otp`, `auth/forgot-password`, `auth/reset-password`, `auth/verify-email`, `social-logins.tsx`
- Removed the dead "Forgot password?" link from the login page

### 1.6 Other dead code

- `features/entities/components/entity-grid.tsx` (unused), `components/charts/*` (3 unused chart components), `hooks`/`services` pruned as above

---

## 2. Frontend wired to the real backend

### 2.1 Transport: transparent proxy with env override

`frontend/next.config.js` now adds a rewrite:

```
/api/:path*  →  ${API_PROXY_TARGET}/api/:path*   (default: http://localhost:8080)
```

- **Default (zero-config):** `src/lib/env.ts` keeps `apiBaseUrl = '/api'`; the Next server proxies to the backend. A fresh clone works with no env vars as long as the backend runs locally. Override the target with `API_PROXY_TARGET` at build/start time.
- **Override honored:** setting `NEXT_PUBLIC_API_BASE_URL` points the client directly at another origin (backend CORS already allows `http://localhost:3000` and the Vercel frontend).
- No silent fallback: there is no code path that returns mock data when the backend is unreachable.

### 2.2 Backend endpoints reused (all real, all authenticated except auth/health)

| UI area | Endpoint(s) |
|---|---|
| Sign in / register / session | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Dashboard stats | `GET /api/dashboard/summary`, `/audit-actions`, `/assets-by-type`, `/version-growth`, `/recent-activities` |
| Assets (CRUD) | `GET/POST /api/assets`, `GET/PUT/DELETE /api/assets/{id}` |
| Audit logs (+ server-side search/filter) | `GET /api/audit/logs?page&pageSize&search&operation` |
| Timeline (+ per-asset scope) | `GET /api/audit/timeline?page&pageSize&search&operation&assetId` |
| Version history / restore | `GET /api/versions/asset/{id}`, `POST /api/versions/restore` |
| Health (public) | `GET /api/health` |

### 2.3 Pagination contract

Zero-based on the wire, one-based in the UI, translated exactly once in `frontend/src/lib/pagination.ts` (`toApiPage`/`toApiListParams`). Services whitelist supported query params per endpoint (`ASSET_LIST_KEYS`, `AUDIT_LOG_LIST_KEYS`, `TIMELINE_LIST_KEYS`, `VERSION_LIST_KEYS`), so unsupported params (`sort`, `order`, `filter`, …) are never sent pretending to work. Pinned by `src/services/list-contract.test.ts`.

### 2.4 UI honesty fixes (fake claims removed)

- **Homepage (`/`):** marketing landing with fabricated stats (34,000+ logs, logos, industries) replaced with: authenticated → redirect to `/dashboard`; unauthenticated → minimal sign-in entry point. No metrics shown.
- **Sidebar:** now exactly Dashboard, Protected Assets, Audit Logs, Audit Timeline, Settings. Removed Anomalies/Integrations links, the fake "All systems operational" status, and the workspace switcher.
- **Topbar:** removed the dead global search, command-palette hint, notification bell (nothing implemented them); account menu Settings now navigates to `/settings`; sign-out works.
- **Dashboard:** removed `console.log`, dead Export button, and fabricated claims; **Refresh button now actually invalidates/refetches** all dashboard queries (`dashboard-refresh-button.tsx`); explicit loading / error (+retry) / empty (CTA) states; activity feed shows only real `recent-activities` rows.
- **Assets table:** removed the **simulated CSV import**, form fields `name`/`version` that the backend silently ignored (backend derives both itself), hardcoded department filter options (now derived from loaded data), and "hash-chain-v1"/"cryptographic ledger" claims. Create/Edit now send only fields `CreateAssetRequest`/`UpdateAssetRequest` accept: `assetName, assetType, description, content, status, department, ownerName, ownerEmail, risk, sourceApplication`. CSV **export kept** — it genuinely exports the loaded rows client-side. Delete dialog text matches backend behaviour (soft delete + DELETE audit event; history preserved).
- **Versions page:** removed the hardcoded mock asset id `'e1'` (now selects the first real asset or shows an empty state), fake "Client Terminal: macOS • Chrome", "CRYPTO-SECURE"/"VERIFIED SECURE" badges, empty hash slices, and fabricated parent-hash strings. Snapshot preview/compare use the **real** `afterSnapshot` from `VersionResponseDto`; restore dialog accurately states the backend preserves history and records a RESTORE audit event.
- **Audit log table & drawer:** removed Severity/Status columns (backend hardcodes `info`/`verified` — no detection/verification engine exists behind them) and the always-empty hash column; the drawer's fabricated **"Tamper-Evident Proof"** block was replaced with an explicit note that this platform implements no hash chain, plus honest "not captured" placeholders for IP, and a plain statement that per-field diffs aren't recorded.
- **Settings page:** was a "ready for implementation" placeholder; now shows the real profile from `GET /api/auth/me`, local theme preference (explicitly stated as local-only), and sign-out.
- **Auth layout / session loader / page metadata:** replaced "Cryptographically secure, AI-powered… 34,000+ logs checked", "Cryptographic hash-linked ledger blocks", rotating fake loader messages ("Checking tamper-evident registry…") and "Universal Change Intelligence"/"tamper-evident" metadata with accurate copy.
- **Naming:** `APP_NAME` changed `'SentinelAudit AI'` → **`SentinelAudit`** (no AI exists); tagline/description now state what the product does (audit trail + version history).

---

## 3. Security fixes

1. **Hardcoded database password removed (main finding).**
   `backend/src/main/resources/application.properties` line 9 was
   `spring.datasource.password=${DATABASE_PASSWORD:<redacted>}` — a real-looking credential baked in as the default, contradicting `README-ENVIRONMENT.md` ("No default — must be set"). (The literal value is intentionally not reproduced here; it was removed from the repository and should be treated as compromised — rotate it anywhere it was ever used.)
   Now: `spring.datasource.password=${DATABASE_PASSWORD:}` (empty default → connection fails fast unless the env var is provided). Test runs are unaffected: `src/test/resources/application.properties` overrides the datasource with in-memory H2.
2. **JWT posture verified (no change needed):** stateless HS256 with fail-fast `JWT_SECRET` requirement, BCrypt password hashing, `/api/auth/login`, `/api/auth/register`, `/api/health` public, JSON 401/403 bodies (not HTML redirects) for everything else, CORS restricted to the two known frontends. Regression-tested (§5).
3. **Header hygiene:** removed the non-functional `X-Workspace-Id` header; requests now carry only `Content-Type`, `Accept`, and the `Authorization: Bearer` JWT.
4. **Auth surface reduced:** removed OTP/password-reset/verify-email/social-login UI that implied flows the backend never implemented (the "Forgot password?" link pointed at a deleted, never-functional page).

---

## 4. Anomaly detection — deferred (decision)

**Decision: anomaly detection was not implemented; all anomaly UI/nav was removed and the deferral is documented here.**

Rationale:

- The backend has **no detection engine of any kind** — no rules, no scoring, no signal extraction. `AuditLogResponseDto` returns a constant `severity: "info"`; there is no anomaly data source to build a real feature on.
- The former frontend "anomalies" were pure mock data (`mock-data.ts`), including fake `detectedBy: 'ai'`, confidence scores, and signal weights. Re-shipping them would have been a fabricated feature.
- Honest detection rules require product decisions (what baseline, which actors, what thresholds, false-positive handling) and dedicated backend work — out of scope for this audit pass.

**What would make it real later (suggested rules, none implemented):** velocity rules (N updates to one asset within T minutes), off-hours activity by role, delete-then-recreate sequences, mass-update bursts across assets owned by one actor — each computed server-side from existing `audit_log` rows and surfaced as a new `/api/anomalies` endpoint with its own persisted records. Until such an endpoint exists, the nav item stays hidden.

---

## 5. Tests & verification (actual results — nothing fabricated)

### 5.1 Frontend — `cd frontend; npm test` → **PASS: 8 files, 60 tests**

| Suite | Tests | Covers |
|---|---|---|
| `src/lib/pagination.test.ts` | 9 | one-based ⇄ zero-based translation |
| `src/services/list-contract.test.ts` | 7 | wire contract: `page=0` for first UI page, supported-param whitelists (`search`/`department`/`status`/`risk` are forwarded, `sort`/`order`/`filter` never), timeline `assetId`, no invented hashes |
| `src/services/http-client.test.ts` *(new)* | 5 | error handling: JSON error carries status+message, 401 status preserved, non-JSON body still surfaces the status, 204 → `undefined`, Bearer token attached from storage |
| `src/hooks/use-entities.test.ts` *(new)* | 1 | `invalidateAssetSideEffects` invalidates entity/timeline/audit-log caches via a real `QueryClient`, leaves unrelated (`dashboard`) caches untouched |
| `src/mock-free-contract.test.ts` | 24 | **guards the refactor itself:** mock route dir & 17 mock files stay deleted, no source imports deleted modules, `next.config.js` proxy present, `/api` default, no `X-Workspace-Id`/supabase, honest naming |
| `src/services/assistant.test.ts` *(new)* | 5 | assistant wire contract: chat POSTs to `/api/assistant/chat`, **no client-supplied user id** (actor comes from the JWT), 503/400 map to typed `HttpClientError`, status GETs `/api/assistant/status` |
| `src/features/assistant/lib/citations.test.ts` *(new)* | 6 | citation rendering: validated `[n]` → source, **out-of-range marker stays plain text** (no dead link), empty/plain answers, and `safeHref` rejects `javascript:`/`data:` while allowing relative + http(s) |
| `src/features/assistant/lib/suggested-questions.test.ts` *(new)* | 3 | suggested prompts span all five categories, contain **no pre-baked answers or citation markers**, and have unique ids |

### 5.2 Frontend — `npm run typecheck` → **PASS** (`tsc --noEmit`, no output)

### 5.3 Frontend — `npm run build` → **PASS** (Next.js 13 production build; 13/13 pages generated, including `/assistant`)

### 5.4 Backend — `cd backend; .\gradlew.bat test` → **BUILD SUCCESSFUL** — 73 tests, 0 failures/errors

| Suite | Tests |
|---|---|
| `BackendApplicationTests` | 1 |
| `AssetPaginationRegressionTest` | 4 |
| `AssetFilteringRegressionTest` *(new)* | **5** — seeds 130 rows via the repository (isolated H2), then proves: a match beyond the first 100 rows is found, department is a case-insensitive substring, status filter matches the UI-mapped value incl. legacy raw `ACTIVE`/`INACTIVE`, `total`/`totalPages` reflect the complete filtered set with **zero-based** page slicing, and unknown/invalid params (`bogus`, `sort`, bad `status`/`risk`) return **400** |
| `AuthenticatedCoreWorkflowIntegrationTest` *(new)* | **3** — full lifecycle with a **real JWT** (register → token → create → update → version snapshot of pre-update state → restore (content restored, history preserved, `RESTORE` event) → update after restore (no duplicate version names) → delete → 404 on re-read/re-delete → version history still readable); asserts every audit row's actor equals the authenticated email; unauthenticated requests get **401**; a failed `PUT` writes **no** audit event |
| `AuditTimelineRegressionTest` | 9 |
| `TimelineResponseDtoTest` | 3 |
| `UnauthenticatedSecurityRegressionTest` | 9 |
| `assistant.DocumentChunkerTest` *(new)* | 4 — headings + overlap metadata, bounded chunk size, no empty chunks |
| `assistant.KnowledgeIndexerTest` *(new)* | 3 — idempotent re-index (hash/model skip), stale-chunk removal, embedding failure surfaces |
| `assistant.CitationFormatterTest` *(new)* | 4 — renumbers valid citations, **drops fabricated/out-of-range ones**, empty when nothing is grounded |
| `assistant.RetrieverTest` *(new)* | 3 — cosine ranking, `top-k`/min-score, source metadata carried through |
| `assistant.AssistantToolCatalogTest` *(new)* | 6 — allowlist, **asset-id/date-range validation**, date filtering, unknown tool rejected |
| `assistant.SystemPromptBuilderTest` *(new)* | 3 — grounding rules, untrusted-content guard, insufficient-evidence sentence |
| `assistant.AssistantServiceTest` *(new)* | 8 — grounded answer, citation drop, refusal, **provider failure never fabricates**, tool loop, history bound |
| `assistant.AssistantControllerTest` *(new)* | 4 — DTO validation, actor from principal, error mapping |
| `assistant.AssistantEndpointSecurityTest` *(new)* | 4 — **401 without JWT**, 503 when unconfigured, 400 on blank message, status endpoint |

### 5.5 End-to-end smoke test (live local stack)

Postgres (`:5432`), backend (`:8080`), and frontend (`:3000`) were already running, so the wiring was verified live:

| Request | Result | Proves |
|---|---|---|
| `GET localhost:8080/api/health` | **200** `SentinelAudit Backend Running Successfully!` | backend up |
| `GET localhost:8080/api/assets` (no token) | **401** | backend auth enforced |
| `GET localhost:3000/api/health` (through Next) | **200** backend body | **proxy rewrite forwards to the backend; no mock route shadows it** |
| `GET localhost:3000/api/dashboard/summary` (no token) | **401** | mock dashboard route gone; real auth flows through |
| `POST localhost:3000/api/auth/login` (bad creds) | **401** | auth endpoint proxied correctly |

### 5.6 Whitespace check

`git diff --check` → **clean** (only line-ending notices, no whitespace errors).

> Note: no commit or push was made (not requested). All changes are uncommitted working-tree modifications plus 4 new files (this document included).

---

## 6. Limitations

1. **Anomaly detection is absent by design** (§4) — not hidden behind a disabled toggle; the feature does not exist.
2. **No hash chain / tamper evidence / IP / user-agent / field-level diffs.** The backend persists operation, actor, asset reference, and full field snapshots for versions — that's it. The UI now says so explicitly instead of implying otherwise. Severity is always `info` and status always `verified` server-side; the UI no longer renders them.
3. **Asset filtering/pagination is now server-side** (§9.1) — `GET /api/assets` accepts `search`/`department`/`status`/`risk` plus zero-based `page`/`pageSize`; `total` is the complete filtered set, so matches beyond the first 100 rows are found. `department` is a case-insensitive substring (a text box, not a data-derived dropdown) precisely so it works beyond the loaded page. Column sorting was **removed** rather than faked, because the API does not support it — sorting only the current page would misrepresent the order.
4. **Asset form fields:** the create/edit dialog collects `assetName, assetType, description, status, department, ownerName, ownerEmail, risk, sourceApplication`. `content` (a raw payload with no viewer in the MVP) is deliberately **not** collected — see §9.3 — but it is still accepted via the API and is preserved on edit (a partial body keeps the stored value; an explicit `""` clears it).
5. **`recordCount` is always 0** from the backend (no row-counting exists), so it is not displayed; `changeCount`/`version` are real (`version - 1` and version counter respectively).
6. **Runtime verification used the already-running local backend instance** — it predates the `application.properties` password change, so the empty-default behaviour was verified by review + tests (H2 profile) rather than by restarting the production-profile backend.
7. **README files were not rewritten** — `README-ENVIRONMENT.md` already matched the new (empty) password default; other docs contain no references to removed features (verified by search).
8. `.env.local` (gitignored) still sets `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api`, i.e., this developer machine bypasses the proxy via CORS. Both paths work; fresh clones default to the proxy.
9. **No DB migration for `(assetId, version)` uniqueness** (§9.2). `AssetVersion` has no unique constraint on `(assetId, version)`; the service now upserts on that pair so new duplicates cannot be created, but **pre-existing duplicate rows already in the development PostgreSQL database are not cleaned up or constrained by this pass**.
10. **JWT logout is client-side only.** `POST /api/auth/logout` is a stateless no-op; the token remains valid until it expires (there is no revocation list). Removing it from the client is the full extent of "sign out". The UI does not claim otherwise.
11. **Audit data is single-tenant.** Every authenticated user can read every audit log, timeline and version row; there is no per-user or per-tenant scoping. `RegistrationRequest` self-signup always assigns `ROLE_USER` (no privilege escalation), but that role is not used to isolate data.
12. **This pass validated the workflows with automated tests (real JWT through the security filter chain) and not by click-through in a browser.** Browser-level checks (visual states, keyboard/focus, actual network tab) were **not** performed; the automated results above are the evidence.

## 7. Migrations & environment notes

- **Database schema:** no migration required. The change set contains **no DDL and no new columns/tables**; `spring.jpa.hibernate.ddl-auto=update` remains unchanged and the refactor only removed frontend code and one config default.
- **Configuration migration:** anyone relying on the previously baked-in database-password default (redacted here; it also exists in Git history and must be rotated) must now export `DATABASE_PASSWORD` (empty default fails fast on connect). `JWT_SECRET` was already mandatory. Optional new var: `API_PROXY_TARGET` (frontend, default `http://localhost:8080`).
- **Frontend env var:** `NEXT_PUBLIC_API_BASE_URL` is now optional (it was previously required to reach any backend at all).

## 8. File-change summary

- **Deleted:** 58 files (18 mock API routes, 6 marketing pages + 5 marketing components + content, 4 dead auth pages, 2 walkthrough docs, workspace trio, 4 dead services, 2 dead hooks, 2 dead feature dirs + 2 pages, 3 unused charts, 2 unused barrels, mock-data, api-helper, social-logins, entity-grid, anomaly/integration components)
- **Modified:** 28 files (wiring, honesty fixes, config)
- **Added:** 4 files — `PROTOTYPE_AUDIT.md`, `backend/.../UnauthenticatedSecurityRegressionTest.java`, `frontend/src/mock-free-contract.test.ts`, `frontend/src/features/dashboard/components/dashboard-refresh-button.tsx`
- **Navigation now:** Dashboard · Protected Assets · Audit Logs · Audit Timeline · Settings

---

## 9. Post-refactor validation pass (2026-10-19)

A second pass validated the refactored app end-to-end (via automated tests, see §5) and closed the remaining MVP gaps. No mock data was reintroduced; no destructive operations were run against the development PostgreSQL database (all database-touching tests use an isolated in-memory H2 database).

### 9.1 Asset filtering & pagination moved to the server (Priority 2)

Defect: the assets table fetched a single 100-row page and then filtered/paginated/sorted **in the browser**, so `total` was not the real total, matches past row 100 were invisible, and the department dropdown only offered values that happened to be on the loaded page.

Fix:
- `GET /api/assets` now accepts `search`, `department`, `status`, `risk` (in addition to zero-based `page`/`pageSize`) and returns a JPA `Page`, so `total`/`totalPages` describe the **complete filtered set**. Implemented with Spring Data's built-in `JpaSpecificationExecutor` (no third-party filtering framework, no repository rewrite).
- `search` matches name/type/department/owner-name/owner-email (case-insensitive substring) and an exact numeric id. `department` is a case-insensitive substring. `status` maps the UI value back to its raw stored synonyms (`connected`→`connected|active`, `disconnected`→`disconnected|inactive`, plus `error`/`syncing`) so legacy rows still filter correctly. `risk` is an exact match.
- Unknown query parameters and invalid `status`/`risk` values are rejected with **400** instead of being silently ignored; filter lengths are capped at 200 chars.
- Frontend: the search box is debounced (300 ms), filter changes reset to page 1, the department filter became a server-side text input (works beyond the loaded page), and the page is clamped if a mutation empties the last page. **Column sorting was removed** — the API does not support server-side sorting, and sorting only the visible page would be misleading.
- The CSV export now says what it does: it exports the **rows currently loaded** ("Export Page CSV"), not a full-dataset export.

### 9.2 Restore / version-history defects (priority 1)

- Version snapshots are written through a single `recordSnapshot(assetId, version, …)` that **upserts** on `(assetId, version)`. Previously two consecutive restores could both snapshot the same version number and create duplicate rows that a lookup could not resolve deterministically. (No unique constraint was added — see limitation #9.)
- Version history (`GET /api/versions/asset/{id}`) stays **readable for a soft-deleted asset** (rows are preserved); restore remains blocked for deleted assets. Reads only require the asset row to exist.
- The `VersionResponseDto` no longer reports a hardcoded operation: a version row stores a snapshot, not the operation that produced it, so the fabricated badge/filter was removed from the UI rather than shown as `UPDATE`.

### 9.3 `description` in the MVP; `content` excluded (Priority 3)

**Decision (unchanged, now documented):** `description` **is** in the MVP; `content` is **excluded from the UI**.

- `description` is exposed on `AssetResponseDto`, collected by validated create/edit form inputs (≤ 1000 chars), loaded on edit, persisted through the API, and included in version snapshots so it survives a restore (covered by the new workflow test).
- `content` (a raw payload with **no viewer/editor** in the MVP) is deliberately not collected: offering an input for a blob the user can never inspect would be a dead control. The API still accepts it and `updateCurrentAsset` preserves it on ordinary edits (a `null`/absent field keeps the stored value; an explicit `""` clears it), so the field is not silently destroyed.
- Backend null-guard added for `assetName`, `assetType`, `description` and `content`: a partial `PUT` body keeps stored values instead of blanking them.

### 9.4 Audit-trail correctness & honesty (Priority 4)

- Every audit row's actor is the **authenticated server principal's email** (`UserService.getAuthenticatedUser()`), identical across `CREATE`/`UPDATE`/`DELETE`/`RESTORE`; there is no client-supplied actor. Audit writes happen inside the mutation transaction, so a failed mutation rolls back and writes **no** success event (asserted by test).
- Removed the last fabricated bit of provenance: the version card/header "operation" badge that always read `UPDATE`.
- Fixed a dead link: the dashboard activity **"View in audit logs"** action built `?search=<audit-row-id>`, but audit search matches name/actor/action/remarks/asset-id — not the log id — and the audit table ignored the URL param entirely. It now passes `event.assetId` and `AuditLogTable` seeds its search box from `?search=`, so the link actually filters.

### 9.5 Final UX / security pass (Priority 5)

- Registration validation on the backend now mirrors the frontend (`@NotBlank`, `@Email`, password `@Size(min = 6, max = 100)` with `@Valid` on the controller), so the API cannot create accounts the UI would reject.
- Removed dead auth schemas (`phone`/forgot-password/reset-password/otp) that were exported but unused.
- Re-confirmed the security posture (stateless JWT, BCrypt, public surface limited to `login`/`register`/`health`, JSON 401/403, CORS allow-list) — no secrets were printed anywhere in this report or the logs.
- All new work remains **uncommitted**; nothing was committed or pushed.

### 9.6 Files added/changed in this pass

- **Added:** `backend/.../AuthenticatedCoreWorkflowIntegrationTest.java`, `backend/.../AssetFilteringRegressionTest.java`, `frontend/src/services/http-client.test.ts`, `frontend/src/hooks/use-entities.test.ts`.
- **Changed (backend):** `ProtectedAssetController` (filters + 400s), `ProtectedAssetService` (filtered listing, null-guard, snapshot delegation), `AssetVersionService` (upsert snapshots, deleted-asset reads), `ProtectedAssetRepository` (`JpaSpecificationExecutor`), `AssetResponseDto` (`description`), `VersionResponseDto` (no fabricated operation), `RegisterRequest`/`AuthController` (validation).
- **Changed (frontend):** `features/entities/components/entity-table.tsx` (server-side filters/pagination, description input, page/CSV labels), `app/entities/versions/page.tsx` (removed fabricated operation UI), `features/dashboard/components/dashboard-activity-feed.tsx` + `features/audit-logs/components/audit-log-table.tsx` (working deep link), `services/assets.ts` + `types/index.ts` + `hooks/use-entities.ts` + `services/list-contract.test.ts` (contract), `features/auth/lib/validation.ts` (dead-schema prune).

---

## 10. SentinelAudit Assistant — read-only RAG (2026-10-19)

A genuine, provider-backed retrieval-augmented assistant was added to the **existing** app (§1–§9 unchanged). It answers from a small curated documentation corpus **and** live, allowlisted read-only queries over the real database, grounds every claim in a validated citation, and refuses when it has no verified evidence. It is **read-only**: it cannot create, update, delete or restore anything. Nothing here is mock data, and no answer is hardcoded.

### 10.1 Architecture (real pipeline, no shortcuts)

```
POST /api/assistant/chat  (JWT required; actor = authenticated principal)
        │
        ▼
AssistantService ──► Retriever ──► VectorStore (assistant_knowledge_chunks)
        │                 │  query embedding via EmbeddingProvider
        │                 ▼
        │            top-k chunks (score ≥ min-score) + source metadata
        │
        ├─► SystemPromptBuilder  (grounding rules + prompt-injection guard)
        │
        ├─► LlmClient (OpenAI-compatible function-calling loop, bounded iterations)
        │        └─► AssistantToolCatalog  (fixed 6-tool allowlist → live DB reads)
        │
        └─► CitationFormatter  (validate markers → renumber to [n] → drop fabrications)
        │
        ▼
AssistantChatResponse { answer, sources[], toolsUsed[], provider, model, insufficientEvidence }
```

- **RAG is real:** documents are loaded, normalised, chunked (**section-aware, with overlap**), embedded, and stored with file + section + content hash. Retrieval is **semantic** (cosine similarity over stored vectors), not keyword `grep`.
- **Grounded generation:** the model receives only the retrieved excerpts and tool outputs, plus instructions to refuse rather than guess.
- **Citation validation:** the model emits `[doc:<sourceId>#<chunkIndex>]`, `[asset:<id>]`, `[event:<id>]` markers; `CitationFormatter` keeps only markers that match something actually retrieved and rewrites them to compact `[n]` indices into the returned `sources` array. Invented references are silently dropped, never rendered.
- **Honest refusal:** when evidence is thin the answer carries the exact refusal sentence and `insufficientEvidence: true`; the UI labels it "could not find enough verified information".

### 10.2 RAG sources and indexing process

Indexed corpus (versioned in the repo, non-secret):

- `backend/src/main/resources/assistant/knowledge/*.md` (8 curated docs): `product-overview.md`, `assets.md`, `audit-and-timeline.md`, `versions-and-restore.md`, `authentication-and-security.md`, `dashboard.md`, `api-reference.md`, `limitations.md`.
- Optionally, files listed in `ASSISTANT_KNOWLEDGE_DOCS` under the directory given by `ASSISTANT_KNOWLEDGE_ROOT` (both empty by default).

**What is deliberately *not* indexed:** `.env`/`.env.local`, secrets/keys/tokens/credentials, `node_modules`, build outputs (`build/`, `.next/`), binaries, and user uploads. The loader only reads allowlisted text/markdown paths — it does not walk the whole source tree.

Process:

1. `DocumentLoader` reads each configured path (classpath + optional filesystem), rejecting anything outside the allowlist.
2. `DocumentChunker` splits on headings and packs to `max-chunk-chars` (default 1000) with `chunk-overlap-chars` (default 150); each chunk keeps its section title and a content hash.
3. `KnowledgeIndexer` is **idempotent**: it skips chunks whose content hash + embedding model already match, embeds only changed text, and removes chunks that no longer exist in the source. Re-indexing is safe to run repeatedly.
4. Indexing runs on demand via `POST /api/assistant/reindex` (JWT + `assistant.indexing.allow-api`) and, optionally, at startup (`ASSISTANT_INDEX_ON_STARTUP`, default off, best-effort).

### 10.3 Vector storage and provider

- **Storage:** a plain PostgreSQL table `assistant_knowledge_chunks` (created automatically by `ddl-auto=update`), storing the chunk text, source file, section, content hash and the **JSON-encoded embedding**, with in-process cosine similarity at query time. No extension is required. **pgvector is the documented scale-up path**; it is *not* used here because it cannot be assumed installed, and this is stated rather than faked.
- **Provider:** exactly **one** provider family — OpenAI-compatible HTTP (`openai`). The LLM (`assistant.llm.*`) and embeddings (`assistant.embedding.*`) are independently configurable (base URL, model, key, timeout, dimensions).
- **Keys:** read only from environment variables; never in `NEXT_PUBLIC_*`; all provider calls happen **backend-only**. Requests have connect/read **timeouts**, an output-token cap, and a per-message/history/tool-result character budget.
- **Unconfigured = honest failure:** with no key the provider reports `isConfigured() == false`; chat returns **503** and the UI shows a "not configured" banner. The assistant **never fabricates an answer** on provider error, timeout, or embedding failure.
- **Tests/dev:** a deterministic `LocalHashEmbeddingProvider` (`ASSISTANT_EMBEDDING_PROVIDER=local`) exercises the full pipeline without a network call. It is lexical (bag-of-words), **non-semantic**, and intended for tests only — not a production embedding model.

### 10.4 Live-data tools (read-only allowlist)

Counts and current-state questions are answered from **live database reads**, never from stale semantic retrieval. The fixed allowlist (no generic query tool, no model-generated or arbitrary SQL):

| Tool | Reads | Validation |
|---|---|---|
| `list_assets` | paged assets via `ProtectedAssetService` | status/risk enum-checked, `pageSize` 1–50 |
| `get_asset` | one asset by id | positive integer id |
| `list_audit_events` | `AuditLogService.getTimeline` + in-tool date filter | operation enum, ISO `from`/`to`, `limit` 1–100 |
| `asset_versions` | version history for an asset | positive id, `limit` 1–100 |
| `dashboard_summary` | `DashboardService` totals | none (no args) — flagged "raw totals, no anomaly scoring" |
| `audit_action_breakdown` | audit action counts | none (no args) |

Every tool call is re-authorized against the server principal; there is no body-supplied user id anywhere in the flow.

### 10.5 Security boundaries

- **Auth required** for `/api/assistant/chat`, `/reindex`; the actor is taken from the JWT principal, never the request body.
- **Input limits:** message chars, history messages/chars, retrieved chunks, tool-result chars and output tokens are all bounded.
- **Untrusted content:** retrieved docs and audit text are wrapped and labelled as untrusted data in the prompt (prompt-injection guard); the model is told to ignore instructions found inside them.
- **Errors:** provider/service failures surface as generic messages (503/400) with **no stack traces or secrets**.
- **Citations:** distinguished by type (document vs live asset vs audit event); `href`s are validated to relative paths / http(s) so the renderer cannot emit `javascript:` links. The UI never claims anomaly detection, hash-chain/tamper-proofing, field diffs, IP capture or AI risk scores — because none exist.
- **Scope honesty:** audit data is single-tenant (§6 #11). No tenant isolation is claimed.

### 10.6 Frontend

- New **`/assistant`** page linked from the sidebar (Dashboard · Protected Assets · Audit Logs · Audit Timeline · **Assistant** · Settings).
- Chat UI consistent with the existing design system: welcome panel with **clickable suggested questions grouped by category** (Product · Live data · Investigating changes · Versions & dashboard · Limitations), message bubbles with timestamps, a loading indicator, error states with **Retry**, per-answer **Copy**, **New conversation** reset, and a source list linking to docs/pages and known assets/audit logs.
- A **safe, dependency-free Markdown renderer** (`AssistantMarkdown`) — no `dangerouslySetInnerHTML`, so HTML in a model answer renders as text; only relative/http(s) links are allowed.
- Suggested questions call the **real** `/api/assistant/chat` endpoint — they carry no pre-baked answers or citations.
- Reuses the existing HTTP client (JWT), React Query setup, and UI primitives. **No mock replies** and no fake typing animation.
- Multi-turn context is bounded (last 8 turns) and is **not** an auth mechanism — every request re-authenticates and re-checks tool permissions. No tokens or private data are stored in `localStorage`; the conversation lives only in component state and is cleared by "New conversation".

### 10.7 Example questions exercised by the pipeline

- Product knowledge: "What is SentinelAudit and what does it record?", "What information does an audit event contain?" → documentation citations.
- Live data: "How many protected assets are there right now?", "List the protected assets currently tracked." → `list_assets` / `dashboard_summary`, live counts.
- Investigation: "What were the most recent changes to assets?", "Who made the latest change and what did they change?", "Show me the change history for the most recently updated asset." → `list_audit_events` / `asset_versions` with asset/event citations.
- Versions/dashboard: "How does version history and restore work?", "Summarize the current dashboard metrics."
- Limitations: "Does it track IP addresses or detect anomalies?", "Can SentinelAudit tell me if a change was suspicious or tampered with?" → honest "not implemented" answers.

> These are the flows covered by automated tests (§5). **No live model provider was configured or billed during this pass** — the pipeline was verified with mocked providers in unit tests plus the deterministic local embedding provider. A real-provider answer has **not** been observed end-to-end.

### 10.8 Files added/changed

- **Added (backend):** `assistant/` package — `AssistantProperties`, `AssistantConfig`, `AssistantController`, `AssistantService`, `AssistantStartup`, `AssistantExceptionHandler`, DTOs, `provider/` (`EmbeddingProvider`, `LlmClient`, `OpenAiEmbeddingProvider`, `OpenAiLlmClient`, `LocalHashEmbeddingProvider`, exceptions), `knowledge/` (`DocumentLoader`, `DocumentChunker`, `KnowledgeIndexer`, `KnowledgeChunk`, repository, `EmbeddingCodec`), `vector/VectorStore`, `retrieval/Retriever`, `citation/` (`AnswerSource`, `CitationFormatter`), `tools/` (`ToolDefinition`, `ToolOutcome`, `AssistantToolCatalog`), `prompt/SystemPromptBuilder`; 8 curated docs under `resources/assistant/knowledge/`.
- **Added (backend tests):** `assistant/**` (9 suites, 39 tests) + `support/InMemoryVectorStore`.
- **Changed (backend):** `application.properties` (`assistant.*`, env-overridable).
- **Added (frontend):** `services/assistant.ts`, `hooks/use-assistant.ts`, `features/assistant/lib/{citations,suggested-questions}.ts`, `features/assistant/components/{assistant-chat,assistant-markdown}.tsx`, `app/assistant/page.tsx`, and three test files.
- **Changed (frontend):** `components/layout/sidebar.tsx` (Assistant link), `lib/constants.ts` (`assistantStatus` query key).

### 10.9 Exact env vars and setup

Enable a live assistant (all optional; absent keys ⇒ assistant reports "not configured"):

| Variable | Default | Notes |
|---|---|---|
| `ASSISTANT_LLM_API_KEY` | *(empty)* | **Required to enable answering**; backend-only |
| `ASSISTANT_LLM_PROVIDER` | `openai` | OpenAI-compatible HTTP |
| `ASSISTANT_LLM_BASE_URL` | `https://api.openai.com/v1` | Point at any compatible endpoint |
| `ASSISTANT_LLM_MODEL` | `gpt-4o-mini` | |
| `ASSISTANT_LLM_TIMEOUT_SECONDS` | `30` | |
| `ASSISTANT_LLM_MAX_OUTPUT_TOKENS` | `900` | |
| `ASSISTANT_LLM_TEMPERATURE` | `0.2` | |
| `ASSISTANT_EMBEDDING_PROVIDER` | `openai` | `local` for offline dev/tests (lexical, non-semantic) |
| `ASSISTANT_EMBEDDING_API_KEY` | falls back to `ASSISTANT_LLM_API_KEY` | |
| `ASSISTANT_EMBEDDING_BASE_URL` | `https://api.openai.com/v1` | |
| `ASSISTANT_EMBEDDING_MODEL` | `text-embedding-3-small` | changing it triggers a re-embed |
| `ASSISTANT_EMBEDDING_DIMENSIONS` | `1536` | |
| `ASSISTANT_EMBEDDING_TIMEOUT_SECONDS` | `30` | |
| `ASSISTANT_RETRIEVAL_TOP_K` | `6` | |
| `ASSISTANT_RETRIEVAL_MIN_SCORE` | `0.12` | |
| `ASSISTANT_RETRIEVAL_MAX_CHUNKS` | `5000` | |
| `ASSISTANT_CHAT_MAX_MESSAGE_CHARS` | `4000` | |
| `ASSISTANT_CHAT_MAX_HISTORY_MESSAGES` | `12` | |
| `ASSISTANT_CHAT_MAX_HISTORY_CHARS` | `8000` | |
| `ASSISTANT_CHAT_MAX_TOOL_ITERATIONS` | `3` | bounds the function-calling loop |
| `ASSISTANT_CHAT_MAX_TOOL_RESULT_CHARS` | `6000` | |
| `ASSISTANT_INDEXING_ALLOW_API` | `true` | gate for `POST /api/assistant/reindex` (still JWT-required) |
| `ASSISTANT_INDEX_ON_STARTUP` | `false` | best-effort startup index |
| `ASSISTANT_KNOWLEDGE_ROOT` | *(empty)* | optional filesystem corpus root |
| `ASSISTANT_KNOWLEDGE_DOCS` | `PROTOTYPE_AUDIT.md,README-ENVIRONMENT.md` | files under the root, **only when the root is set** |
| `ASSISTANT_INDEX_MAX_CHUNK_CHARS` | `1000` | |
| `ASSISTANT_INDEX_CHUNK_OVERLAP_CHARS` | `150` | |

Setup / verification:

```bash
# 1. Configure a provider (backend process environment; never NEXT_PUBLIC_*)
$env:ASSISTANT_LLM_API_KEY   = "<your-key>"
$env:ASSISTANT_LLM_MODEL     = "gpt-4o-mini"
$env:ASSISTANT_EMBEDDING_MODEL = "text-embedding-3-small"

cd backend; .\gradlew.bat bootRun     # creates assistant_knowledge_chunks via ddl-auto=update

# 2. Build the index (authenticated; idempotent) — use a real JWT from /api/auth/login
curl -X POST http://localhost:8080/api/assistant/chat  -H "Authorization: Bearer <jwt>" -H "Content-Type: application/json" -d "{\"message\":\"How many protected assets are there right now?\",\"history\":[]}"
curl -X POST http://localhost:8080/api/assistant/reindex -H "Authorization: Bearer <jwt>"
curl        http://localhost:8080/api/assistant/status   -H "Authorization: Bearer <jwt>"

cd ../frontend; npm run dev           # open http://localhost:3000/assistant
```

**Deployment readiness**

- **Required for the assistant:** a model key + an embedding key (or `local` embeddings), and network egress to the provider base URL. The rest of the app runs without any of it.
- **Vector storage:** the `assistant_knowledge_chunks` table (Hibernate `update`) — persists in the same PostgreSQL volume; if the DB volume is ephemeral, the index must be rebuilt (call `reindex` or set `ASSISTANT_INDEX_ON_STARTUP=true`).
- **Indexing:** run `POST /api/assistant/reindex` after a docs change, or enable startup indexing. Re-indexing is idempotent.
- **Proxy/CORS/health:** the frontend reaches the backend through the existing Next proxy (or direct CORS); `/api/health` is unchanged; an unconfigured assistant degrades to a 503 + UI banner rather than breaking the app.
- **Data sharing:** prompts (the question, retrieved doc excerpts and tool results) are sent to the configured provider endpoint — document this in any privacy review.

### 10.10 Remaining gaps / not implemented

1. **No live provider was exercised in this pass** (§10.7) — unit tests use mocks; the deterministic local embedding provider is lexical, so retrieval quality with a real embedding model is unverified here.
2. **`pgvector` / external vector DB not used** — in-process cosine over JSON embeddings; this scans up to `assistant.retrieval.max-chunks` rows and is not built for large corpora.
3. **No streaming responses** — answers arrive complete.
4. **Single provider family only** (OpenAI-compatible) — no multi-provider routing or local model support is claimed.
5. **Conversations are in-memory only** — no transcript persistence, retention policy, or cross-device history (deliberate; avoids storing sensitive content).
6. **No admin/RBAC gating on `reindex`** — guarded by authentication + `ASSISTANT_INDEXING_ALLOW_API` because the app has no admin role; review before exposing publicly.
7. **Browser-level checks not performed** — assistant UI states are covered by unit tests and a production build, not by manual click-through (§6 #12).
8. All work remains **uncommitted**; nothing was committed or pushed.

## 11. Assistant 503 diagnosis + restricted-demo registration (2026-10-20)

This section records a live diagnosis of the "assistant is temporarily unavailable" 503 and a
backend-enforced registration switch. The same constraints applied: no deploy, no push, no commit,
no secret printed, no destructive DB operation.

### 11.1 Exact cause of the 503 (evidence, not inference)

Reproduced against the **running** backend with a real JWT and read-only DB probes:

- `GET /api/assistant/status` returned
  `configured=true, llmProvider=gemini, llmModel=gemini-3.8-flash, embeddingProvider=gemini,
  embeddingModel=gemini-embedding-001@768, indexedChunks=0`.
  So the failure is **not** "not configured" and **not** a missing or bad credential.
- A direct, correctly-formatted Gemini `generateContent` call — same wire format the client uses
  (`systemInstruction` + `contents` + `tools.functionDeclarations` + `generationConfig`,
  `x-goog-api-key` header) — returned **HTTP 200** with `finishReason=STOP`. The model id and the
  request format are valid.
- That same call took **60–106 seconds** (≈60 s without tools, ≈106 s with the real tool
  declarations); Gemini 3.8 Flash has a documented ~13 s time-to-first-token and is tuned to think
  before answering.
- The client read timeout was **30 s**, so the call aborted with
  `ResourceAccessException` → the generic catch → `AssistantProviderException("Gemini request
  failed")` → **503 "The assistant is temporarily unavailable. Please try again."**

**Cause: a too-short read timeout on a slow-but-successful provider call.** The 503 text was
accurate but undiagnosable; the request format, model and credentials were all fine.

### 11.2 Fix (smallest correct change)

- Raised the default provider read timeout `30 s → 120 s` (`assistant.llm.timeout-seconds` /
  `ASSISTANT_LLM_TIMEOUT_SECONDS`, and the embedding timeout likewise), because a tool-using
  Gemini turn can exceed 60 s.
- `GeminiLlmClient` / `OpenAiLlmClient` now handle `ResourceAccessException` separately and log/throw
  a **timeout-classified** message, so the cause is visible in logs. No fabricated answer, no change
  to the client-facing 503 text.
- `AssistantExceptionHandler` now also returns a machine-readable `data.code` and a random,
  non-sensitive `data.reference`, and logs `Assistant 503 code=… ref=… cause=<root type>`. The
  provider message, prompt, URL and key are still never logged or returned.
- `AssistantStartup` now logs an explicit `ASSISTANT_DIAG …` line when startup indexing is enabled
  yet produces **no chunks**, making an empty index visible.

Verified by the added regression test
`assistant.provider.GeminiLlmClientTest#readTimeoutBecomesATimeoutProviderExceptionNotAFabricatedAnswer`.

### 11.3 Secondary issue — the knowledge index is empty

The live DB has **0 rows** in `assistant_knowledge_chunks`. With an empty index, retrieval returns
nothing (no embedding call is even made) and the assistant legitimately answers with its
"insufficient evidence" refusal. This is separate from the 503. Indexing is intentionally off by
default (`ASSISTANT_INDEXING_ALLOW_API=false`, `ASSISTANT_INDEX_ON_STARTUP=false`); build it once:

1. Set `ASSISTANT_INDEXING_ALLOW_API=true`, restart.
2. `POST /api/assistant/reindex` with a valid JWT.
3. Set `ASSISTANT_INDEXING_ALLOW_API=false` again.

### 11.4 Restricted-demo registration (backend-enforced)

New setting **`registration.enabled`** (env **`REGISTRATION_ENABLED`**, default `true`):

- Enforced in `UserService.register()` — a disabled deployment returns **403** with the message
  "Registration is disabled on this deployment." even when the API is called directly (the frontend
  form is not the security boundary).
- `GET /api/auth/config` (public) returns `{ "registrationEnabled": <bool> }` so the UI hides the
  signup form; the backend remains the source of truth.
- **Existing-user login is unaffected.**
- Local development keeps the default (`true`).
- This is **not** tenant isolation and creates **no** hardcoded demo account or password.
- Tests: `controller.RegistrationConfigurationTest` (disabled → 403 + no account + config false +
  login still 401 for a missing user; enabled → 201 + real JWT + config true).

### 11.5 Validation performed (2026-10-20)

| Check | Command | Result |
|---|---|---|
| Backend unit/integration tests | `.\gradlew.bat test` | **BUILD SUCCESSFUL — 110 tests, 0 failures, 0 errors** (was 104) |
| Backend tests with a `GEMINI_API_KEY` in the env | `.\gradlew.bat test --rerun-tasks` | **BUILD SUCCESSFUL** (env-isolation still holds) |
| Frontend lint | `npm run lint` | ✔ no warnings or errors |
| Frontend types | `npx tsc --noEmit` | clean |
| Frontend tests | `npm test` | **68 passed** |
| Frontend production build | `npm run build` | ✔ compiled, 13/13 pages |

### 11.6 Still not verified / blockers

1. **Live Gemini answer quality** was not asserted — only that the call returns 200 and that a slow
   call now survives the timeout. Retrieval quality with the real embedding model is unverified.
2. **Live Postgres end-to-end after the fix** was not re-run on a rebuilt backend (the running
   instance predates these edits); validation was via the test suite.
3. The knowledge index must be built once (§11.3) or the assistant will keep saying "not enough
   evidence".
4. All work remains **uncommitted**; nothing was committed or pushed.
