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

## SentinelAudit Assistant (optional, read-only RAG)

The assistant answers questions from a curated documentation corpus **and**
live, allowlisted read-only database queries. It is entirely optional: with no
provider key it stays in a "not configured" state (chat returns `503`) and the
rest of the app is unaffected. It never writes to the database.

All assistant settings are read from environment variables and are
**backend-only** — none of them may be exposed via `NEXT_PUBLIC_*`.

### Enabling the assistant

At minimum, set a model key (and, unless you opt into local embeddings, an
embedding key). The embedding key falls back to the LLM key.

| Variable | Default | Notes |
|---|---|---|
| `ASSISTANT_LLM_API_KEY` | *(empty)* | **Required to enable answering** |
| `ASSISTANT_LLM_PROVIDER` | `openai` | OpenAI-compatible HTTP |
| `ASSISTANT_LLM_BASE_URL` | `https://api.openai.com/v1` | Any compatible endpoint |
| `ASSISTANT_LLM_MODEL` | `gpt-4o-mini` | |
| `ASSISTANT_LLM_TIMEOUT_SECONDS` | `30` | |
| `ASSISTANT_LLM_MAX_OUTPUT_TOKENS` | `900` | |
| `ASSISTANT_LLM_TEMPERATURE` | `0.2` | |
| `ASSISTANT_EMBEDDING_PROVIDER` | `openai` | `local` = offline deterministic (lexical, non-semantic; dev/tests only) |
| `ASSISTANT_EMBEDDING_API_KEY` | *falls back to `ASSISTANT_LLM_API_KEY`* | |
| `ASSISTANT_EMBEDDING_BASE_URL` | `https://api.openai.com/v1` | |
| `ASSISTANT_EMBEDDING_MODEL` | `text-embedding-3-small` | Changing this forces a re-embed |
| `ASSISTANT_EMBEDDING_DIMENSIONS` | `1536` | |
| `ASSISTANT_EMBEDDING_TIMEOUT_SECONDS` | `30` | |

### Retrieval, limits and indexing

| Variable | Default | Notes |
|---|---|---|
| `ASSISTANT_RETRIEVAL_TOP_K` | `6` | Chunks passed to the model |
| `ASSISTANT_RETRIEVAL_MIN_SCORE` | `0.12` | Minimum cosine similarity |
| `ASSISTANT_RETRIEVAL_MAX_CHUNKS` | `5000` | Upper bound on chunks scanned |
| `ASSISTANT_CHAT_MAX_MESSAGE_CHARS` | `4000` | |
| `ASSISTANT_CHAT_MAX_HISTORY_MESSAGES` | `12` | |
| `ASSISTANT_CHAT_MAX_HISTORY_CHARS` | `8000` | |
| `ASSISTANT_CHAT_MAX_TOOL_ITERATIONS` | `3` | Bounds the function-calling loop |
| `ASSISTANT_CHAT_MAX_TOOL_RESULT_CHARS` | `6000` | |
| `ASSISTANT_INDEXING_ALLOW_API` | `true` | Allows `POST /api/assistant/reindex` (still JWT-required) |
| `ASSISTANT_INDEX_ON_STARTUP` | `false` | Best-effort index at boot |
| `ASSISTANT_KNOWLEDGE_ROOT` | *(empty)* | Optional filesystem corpus root |
| `ASSISTANT_KNOWLEDGE_DOCS` | `PROTOTYPE_AUDIT.md,README-ENVIRONMENT.md` | Files under the root, applied only when the root is set |
| `ASSISTANT_INDEX_MAX_CHUNK_CHARS` | `1000` | |
| `ASSISTANT_INDEX_CHUNK_OVERLAP_CHARS` | `150` | |

### Vector storage

Embeddings are stored as JSON in a plain PostgreSQL table
`assistant_knowledge_chunks` (created by `ddl-auto=update`) and compared with
in-process cosine similarity. **No extension is required.** `pgvector` is the
documented scale-up path for large corpora, but it is not assumed here.

### Indexing

Index the curated docs (idempotent — safe to repeat) after any docs change:

```bash
# <jwt> = access token from POST /api/auth/login
curl -X POST http://localhost:8080/api/assistant/reindex -H "Authorization: Bearer <jwt>"
```

Or set `ASSISTANT_INDEX_ON_STARTUP=true` to build it at boot.

### What gets indexed

Only the curated, non-secret Markdown under
`backend/src/main/resources/assistant/knowledge/` (plus, if configured, the
allowlisted files under `ASSISTANT_KNOWLEDGE_ROOT`). Secrets, `.env` files,
`node_modules`, build outputs, binaries and user uploads are never indexed.

### Data sharing

Prompts — the question, the retrieved documentation excerpts and the live-query
results — are sent to the configured provider endpoint. Account for that in any
privacy review before enabling the assistant in production.

### Verify

```bash
curl http://localhost:8080/api/assistant/status -H "Authorization: Bearer <jwt>"
```

`configured: true` + a non-zero `indexedChunks` means the assistant is ready.
With no key configured, `/api/assistant/chat` returns `503` and the UI shows a
"not configured" banner — it will not fabricate an answer.

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
