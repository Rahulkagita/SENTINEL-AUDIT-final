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
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,https://sentinelauditfrontend.vercel.app` | Comma-separated browser origins allowed to call the API. Set this to your real frontend origin(s) in production |
| `REGISTRATION_ENABLED` | `true` | Public self-service signup. Set `false` for a restricted demo: the backend then rejects `POST /api/auth/register` with `403` and `GET /api/auth/config` reports `registrationEnabled=false` so the UI hides the form. Existing-user login is unaffected. This is **not** tenant isolation — see "Limitations" |

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

At minimum, set a model key. **Two backends are supported** — pick either one:

**Option A — Gemini (simplest: one key for chat and embeddings)**

| Variable | Default | Notes |
|---|---|---|
| `GEMINI_API_KEY` | *(empty)* | **Required to enable answering.** From https://aistudio.google.com/apikey. Backend-only; never expose via `NEXT_PUBLIC_*` |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Any currently supported Gemini chat model id |

When `GEMINI_API_KEY` is present and no provider is explicitly set, both chat
and embeddings use Google's native Gemini API
(`generativelanguage.googleapis.com/v1beta`, key in the `x-goog-api-key`
header). Embeddings default to `gemini-embedding-001` at **768 dimensions** —
a Gemini chat key is never sent to OpenAI's embedding endpoint.

```bash
export GEMINI_API_KEY="<your key>"
export GEMINI_MODEL="gemini-3.8-flash"   # optional; this is the default
cd backend && ./gradlew bootRun
```

**Option B — OpenAI-compatible HTTP (or any compatible endpoint)**

| Variable | Default | Notes |
|---|---|---|
| `ASSISTANT_LLM_API_KEY` | *(empty)* | **Required to enable answering** (e.g. `sk-...`) |
| `ASSISTANT_LLM_PROVIDER` | *(auto)* | `openai` (OpenAI-compatible HTTP) or `gemini`. Auto = gemini when `GEMINI_API_KEY` is set, else openai |
| `ASSISTANT_LLM_BASE_URL` | provider default | Any OpenAI-compatible endpoint |
| `ASSISTANT_LLM_MODEL` | provider default (`gpt-4o-mini`, or `GEMINI_MODEL`/`gemini-3.8-flash` for Gemini) | |
| `ASSISTANT_LLM_TIMEOUT_SECONDS` | `120` | Read timeout for one model turn. Gemini 3.8 Flash has a documented ~13s time-to-first-token and a tool-using turn can exceed 60s; a short timeout turns a slow-but-successful call into a `503` |
| `ASSISTANT_LLM_MAX_OUTPUT_TOKENS` | `900` | |
| `ASSISTANT_LLM_TEMPERATURE` | `0.2` | |
| `ASSISTANT_EMBEDDING_PROVIDER` | *(auto: follows the chat provider)* | `openai`, `gemini`, or `local` = offline deterministic (lexical, non-semantic; dev/tests only) |
| `ASSISTANT_EMBEDDING_API_KEY` | *falls back to the chat key* | |
| `ASSISTANT_EMBEDDING_BASE_URL` | provider default | |
| `ASSISTANT_EMBEDDING_MODEL` | provider default (`text-embedding-3-small`, or `gemini-embedding-001`) | Changing this forces a re-embed |
| `ASSISTANT_EMBEDDING_DIMENSIONS` | provider default (`1536` OpenAI / `768` Gemini) | |
| `ASSISTANT_EMBEDDING_TIMEOUT_SECONDS` | `120` | Read timeout for one embedding call (a whole document is slower than a query) |

All `ASSISTANT_*` variables act as explicit overrides and take precedence over
the Gemini defaults when both are set. Vectors from different embedding
models/dimensions are never compared: switching providers re-embeds the corpus
on the next re-index.

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
| `ASSISTANT_INDEXING_ALLOW_API` | `false` | Enables `POST /api/assistant/reindex` for **any authenticated user** (there is no admin role). Set to `true` deliberately, e.g. during initial setup |
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

Index the curated docs (idempotent — safe to repeat) after any docs change.
The re-index API is **disabled by default**; enable it with
`ASSISTANT_INDEXING_ALLOW_API=true` (it stays JWT-protected — this app has no
admin role, so treat enabling it as granting re-index access to every
authenticated user), or set `ASSISTANT_INDEX_ON_STARTUP=true` to build the
index at boot:

```bash
# <jwt> = access token from POST /api/auth/login
curl -X POST http://localhost:8080/api/assistant/reindex -H "Authorization: Bearer <jwt>"
```

Switching embedding provider/model/dimensions (e.g. from OpenAI to Gemini)
requires one re-index; the next run re-embeds every chunk automatically.

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
The payload also reports `llmProvider` (`gemini` or `openai-compatible`) and
`embeddingProvider` — verify they match what you configured. With no key
configured, `/api/assistant/chat` returns `503` and the UI shows a
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
| Assistant chat returns 503 "not configured" | No model key set | Set `GEMINI_API_KEY` (Gemini) or `ASSISTANT_LLM_API_KEY` (OpenAI-compatible) |
| Assistant chat returns 503 "temporarily unavailable" | Provider error (HTTP error, timeout, or empty response) | The 503 body now carries `data.code` and `data.reference`; the backend log line `Assistant 503 code=… ref=… cause=…` names the failure class. For a timeout (`ResourceAccessException`), raise `ASSISTANT_LLM_TIMEOUT_SECONDS` (Gemini 3.8 Flash can take 60s+ for a tool-using turn) |
| Assistant answers every question with "not enough evidence" | Knowledge index is empty | Index once: set `ASSISTANT_INDEXING_ALLOW_API=true`, call `POST /api/assistant/reindex`, then set it back to `false`. Startup logs print `ASSISTANT_DIAG indexing …` when the index stays empty |
| Gemini 400 `INVALID_ARGUMENT` on chat | Unsupported `GEMINI_MODEL` id | Use a currently supported chat model, e.g. `gemini-3.8-flash` |
| `POST /api/auth/register` returns 403 | Registration disabled | Expected when `REGISTRATION_ENABLED=false`; set it to `true` to allow self-service signup |
| `/api/assistant/reindex` returns 403 | Re-index API disabled | Set `ASSISTANT_INDEXING_ALLOW_API=true` (deliberate: any authenticated user may then re-index) |
