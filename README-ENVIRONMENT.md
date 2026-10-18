# SentinelAudit — Environment Configuration

The backend reads all configuration from environment variables. Nothing
sensitive is hardcoded in the repository.

## Required environment variables

### `JWT_SECRET` — REQUIRED

The HMAC-SHA signing key for access tokens. **The application refuses to
start if this is missing or weaker than 32 bytes.**

It must be a **Base64-encoded** string that decodes to at least 32 bytes
(256 bits).

Generate one:

```bash
# Linux / macOS
openssl rand -base64 64

# Windows (PowerShell)
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Set it:

```bash
# Linux / macOS  (add to ~/.bashrc, ~/.zshrc, or your service manager)
export JWT_SECRET="<paste the generated value>"

# Windows PowerShell (current session)
$env:JWT_SECRET = "<paste the generated value>"

# Windows (persist for your user)
setx JWT_SECRET "<paste the generated value>"
```

> **Rotate this value before deploying to production.** Any token signed
> with a leaked secret can be forged.

### `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` — REQUIRED

Connection details for PostgreSQL.

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/sentinelaudit` | Full JDBC URL |
| `DATABASE_USERNAME` | `postgres` | Database user |
| `DATABASE_PASSWORD` | *(empty)* | **No default — must be set** |

```bash
export DATABASE_URL="jdbc:postgresql://localhost:5432/sentinelaudit"
export DATABASE_USERNAME="postgres"
export DATABASE_PASSWORD="your-real-password"
```

For managed hosts (Supabase, RDS, Heroku, Neon) the URL is usually given
to you in `postgres://user:pass@host:port/db` form. Convert it to JDBC:

```
postgres://user:pass@host:5432/db  ->  jdbc:postgresql://host:5432/db
```

### Optional

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `8080` | HTTP port |
| `JWT_EXPIRATION` | `86400000` | Access-token lifetime in **milliseconds** (default 24h) |

## Minimal run

```bash
export JWT_SECRET="$(openssl rand -base64 64)"
export DATABASE_URL="jdbc:postgresql://localhost:5432/sentinelaudit"
export DATABASE_USERNAME="postgres"
export DATABASE_PASSWORD="postgres"      # <-- your real password

cd backend
./gradlew bootRun
```

## Schema management

`spring.jpa.hibernate.ddl-auto=update` — Hibernate **only adds** missing
tables/columns at startup. It never drops or truncates. Your existing
PostgreSQL data is preserved.

To inspect the schema Hibernate expects, see the entities under
`backend/src/main/java/com/sentinelaudit/backend/entity/`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `JWT_SECRET environment variable is not set` | Secret missing | Set `JWT_SECRET` (see above) |
| `JWT_SECRET is not valid Base64` | Secret not Base64 | Regenerate with `openssl rand -base64 64` |
| `JWT_SECRET decodes to only N bytes` | Secret too short | Use a 64-char `openssl rand -base64 64` value |
| `password authentication failed for user "postgres"` | Wrong DB password | Set `DATABASE_PASSWORD` to your real password |
| `connection refused` on `localhost:5432` | PostgreSQL not running | Start PostgreSQL, or point `DATABASE_URL` at your host |
| `database "sentinelaudit" does not exist` | Missing database | `createdb sentinelaudit` (or set `DATABASE_URL` to an existing DB) |
