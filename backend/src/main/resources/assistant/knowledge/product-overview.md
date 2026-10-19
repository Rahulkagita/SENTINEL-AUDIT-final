# SentinelAudit — Product Overview

SentinelAudit is a prototype **audit-trail and version-history** application for
data assets. It records who changed an asset, when, and what the previous state
was, and it lets an operator browse that history.

## Architecture

- **Frontend:** Next.js 13 (App Router) + TypeScript + Tailwind CSS + TanStack
  Query. It talks to the backend through a transparent `/api` proxy (Next.js
  rewrite) by default; setting `NEXT_PUBLIC_API_BASE_URL` points it directly at
  another origin.
- **Backend:** Spring Boot (Java 21) exposing a JSON REST API under `/api`.
- **Database:** PostgreSQL, accessed through Spring Data JPA. Schema is managed
  with Hibernate `ddl-auto=update` (additive only — it never drops data).
- **Authentication:** stateless JWT (HS256) bearer tokens.

## What the application currently does

- Registers and authenticates users.
- Lets an authenticated user create, update, and soft-delete "protected assets".
- Writes an audit event for every successful asset mutation.
- Keeps a version snapshot each time an asset's state is replaced, and can
  restore an earlier version.
- Presents a dashboard with asset/version/audit/user totals and an
  audit-action breakdown.
- Provides searchable, paginated **Audit Logs** and an **Audit Timeline**
  scoped to a single asset.

## Navigation sections

The main navigation has: Dashboard, Protected Assets, Audit Logs, Audit
Timeline, Settings, and the read-only Assistant.

## Intent

SentinelAudit is an internal-visibility tool. It is **not** an intrusion
detection system, a tamper-evident ledger, or a compliance certification
product. See "Limitations" for the specifics of what it does not do.
