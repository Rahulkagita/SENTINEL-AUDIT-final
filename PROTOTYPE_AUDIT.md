# Prototype Audit — SentinelAudit

**Date:** 2026-10-19
**Scope:** Full audit and refactor of the SentinelAudit prototype (Next.js 13 frontend + Spring Boot/PostgreSQL backend): removal of all mock/placeholder data, wiring the frontend to the real backend, navigation simplification, honest anomaly-detection decision, security fixes, and tests.

**Outcome in one paragraph:** The frontend no longer contains any mock API routes or fabricated data. Every screen reads from the Spring Boot backend, either through a transparent `/api` proxy (default, zero-config) or via direct calls when `NEXT_PUBLIC_API_BASE_URL` is set. Navigation was reduced to five working sections (Dashboard, Protected Assets, Audit Logs, Audit Timeline, Settings). Anomaly detection was **deferred** (see §4) because no detection engine exists in the backend. One hardcoded credential was removed from the backend configuration. 40 frontend tests and 26 backend tests pass, and an end-to-end smoke test against the running local stack confirmed real backend responses (including 401s) now flow through the frontend.

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
   `spring.datasource.password=${DATABASE_PASSWORD:Rahul@4418}` — a real-looking credential baked in as the default, contradicting `README-ENVIRONMENT.md` ("No default — must be set").
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

### 5.1 Frontend — `cd frontend; npm test` → **PASS: 3 files, 40 tests**

| Suite | Tests | Covers |
|---|---|---|
| `src/lib/pagination.test.ts` | 9 | one-based ⇄ zero-based translation |
| `src/services/list-contract.test.ts` | 7 | wire contract: `page=0` for first UI page, supported-param whitelists, timeline `assetId`, no invented hashes |
| `src/mock-free-contract.test.ts` *(new)* | 24 | **guards the refactor itself:** mock route dir & 17 mock files stay deleted, no source imports deleted modules, `next.config.js` proxy present, `/api` default, no `X-Workspace-Id`/supabase, honest naming |

### 5.2 Frontend — `npm run typecheck` → **PASS** (`tsc --noEmit`, no output)

### 5.3 Frontend — `npm run build` → **PASS** (Next.js 13 production build; 12/12 pages generated)

### 5.4 Backend — `cd backend; .\gradlew.bat test` → **BUILD SUCCESSFUL** — 26 tests, 0 failures/errors

| Suite | Tests |
|---|---|
| `BackendApplicationTests` | 1 |
| `AssetPaginationRegressionTest` | 4 |
| `AuditTimelineRegressionTest` | 9 |
| `TimelineResponseDtoTest` | 3 |
| `UnauthenticatedSecurityRegressionTest` *(new)* | **9** — anonymous requests get JSON **401** on assets (GET+POST), audit logs, timeline, dashboard (summary + recent-activities), versions (list + restore), auth/me; `/api/health` stays public; bad-credential login → 401; malformed login → 4xx |

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
3. **Assets list filtering is client-side** (first 100 rows): `GET /api/assets` supports only `page`/`pageSize` server-side, so search/department/status/risk filters run over the loaded page. The audit-log and timeline searches *are* server-side.
4. **Asset form fields:** the create/edit dialog collects only the fields listed above — `description` and `content` are accepted by the DTOs but no UI input collects them yet (create sends `content` empty), so they remain unset unless written via the API directly.
5. **`recordCount` is always 0** from the backend (no row-counting exists), so it is not displayed; `changeCount`/`version` are real (`version - 1` and version counter respectively).
6. **Runtime verification used the already-running local backend instance** — it predates the `application.properties` password change, so the empty-default behaviour was verified by review + tests (H2 profile) rather than by restarting the production-profile backend.
7. **README files were not rewritten** — `README-ENVIRONMENT.md` already matched the new (empty) password default; other docs contain no references to removed features (verified by search).
8. `.env.local` (gitignored) still sets `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api`, i.e., this developer machine bypasses the proxy via CORS. Both paths work; fresh clones default to the proxy.

## 7. Migrations & environment notes

- **Database schema:** no migration required. The change set contains **no DDL and no new columns/tables**; `spring.jpa.hibernate.ddl-auto=update` remains unchanged and the refactor only removed frontend code and one config default.
- **Configuration migration:** anyone relying on the baked-in `Rahul@4418` default must now export `DATABASE_PASSWORD` (empty default fails fast on connect). `JWT_SECRET` was already mandatory. Optional new var: `API_PROXY_TARGET` (frontend, default `http://localhost:8080`).
- **Frontend env var:** `NEXT_PUBLIC_API_BASE_URL` is now optional (it was previously required to reach any backend at all).

## 8. File-change summary

- **Deleted:** 58 files (18 mock API routes, 6 marketing pages + 5 marketing components + content, 4 dead auth pages, 2 walkthrough docs, workspace trio, 4 dead services, 2 dead hooks, 2 dead feature dirs + 2 pages, 3 unused charts, 2 unused barrels, mock-data, api-helper, social-logins, entity-grid, anomaly/integration components)
- **Modified:** 28 files (wiring, honesty fixes, config)
- **Added:** 4 files — `PROTOTYPE_AUDIT.md`, `backend/.../UnauthenticatedSecurityRegressionTest.java`, `frontend/src/mock-free-contract.test.ts`, `frontend/src/features/dashboard/components/dashboard-refresh-button.tsx`
- **Navigation now:** Dashboard · Protected Assets · Audit Logs · Audit Timeline · Settings
