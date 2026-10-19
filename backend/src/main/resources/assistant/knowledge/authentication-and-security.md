# Authentication and Security

## Sign-in and registration

- `POST /api/auth/register` — creates an account. Requires `fullName`, a valid
  `email`, and a password of at least 6 characters. Self-service sign-up always
  receives the least-privilege role `USER`.
- `POST /api/auth/login` — verifies credentials and returns a bearer token.
- `GET /api/auth/me` — returns the current user (id, name, email, role).
- `POST /api/auth/logout` — client-side only. The JWT is stateless, so the
  server keeps no revocation list; signing out simply discards the token on the
  client.

## Tokens

- Access tokens are **HS256 JWTs** signed with `JWT_SECRET` (a Base64 string
  decoding to at least 32 bytes). The application refuses to start if the secret
  is missing or too weak.
- Each request carries `Authorization: Bearer <token>`. The server validates the
  signature and expiry, loads the user, and puts the **database** role into the
  security context (the token is not trusted for role claims).
- Tokens expire after `jwt.expiration` (default 24 hours). There is no refresh
  token: when it expires, the user signs in again.

## Authorization model

- `/api/auth/login`, `/api/auth/register`, and `/api/health` are public.
- **Every other endpoint requires a valid JWT.** A missing/expired token returns
  JSON `401`.
- The prototype is **single-tenant**: any authenticated user can read and modify
  any asset. There is no per-tenant or per-owner isolation, and this limitation
  is intentional for the prototype. Do not describe SentinelAudit as
  multi-tenant or as enforcing data ownership.

## Passwords

Passwords are stored as BCrypt hashes and are never returned by the API.

## Error handling

Errors are returned as `{ "success": false, "message": "..." }` with a generic,
client-safe message. Internal exception detail and stack traces are logged
server-side only, never returned.

## The assistant's security posture

The SentinelAudit Assistant is **read-only** and respects the same model: it
requires authentication, takes the acting identity from the server principal,
and can only call a fixed allowlist of read-only tools. It cannot create,
update, delete, or restore anything, and it never runs SQL from model output.
