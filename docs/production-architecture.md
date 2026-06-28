# Production Architecture

This project now has a deployable split between the static annotation UI and request-scoped API handlers.

## Runtime Shape

- Static UI: built by `npm run build` into `dist/`.
- Local development server: `node src/server.mjs`.
- Vercel API entrypoints: files under `api/`, all delegating to `src/vercel/api-handler.mjs`.
- Shared API policy: `src/server.mjs`.
- Local audit storage: `src/storage/local-audit-store.mjs`, backed by append-only JSONL files.
- Production audit storage: `src/storage/postgres-audit-store.mjs`, backed by the append-only `audit_events` table in `db/production-schema.sql`.

## Environment

Use these environment variables for production:

- `LMCA_SESSION_SECRET`: required; use a strong random value.
- `LMCA_AUTH_MODE=external_jwt`: enables real identity tokens instead of local demo sessions.
- `LMCA_AUTH_ISSUER`: exact issuer URL from the identity provider.
- `LMCA_AUTH_AUDIENCE`: expected API audience for annotation-platform access tokens.
- `LMCA_AUTH_JWKS_URL`: identity-provider JWKS endpoint for RS256 token verification.
- `LMCA_AUTH_ROLE_CLAIM`: optional, defaults to `lmca_role`. For default simple claim names, the server first reads the top-level JWT claim, then Clerk-style `public_metadata`, `metadata`, or `user_metadata`.
- `LMCA_AUTH_ASSIGNMENTS_CLAIM`: optional, defaults to `lmca_assignments`. For default simple claim names, the same metadata fallback applies.
- `LMCA_REQUIRE_REAL_AUTH=true`: fail closed if the deployment is not configured for external JWT auth.
- `LMCA_AUDIT_STORE=postgres`: routes all persisted rating/audit/certification/benchmark events to Postgres.
- `POSTGRES_URL` or `DATABASE_URL`: Postgres connection string.
- `POSTGRES_CONNECTION_LIMIT`: optional, defaults to `5`.
- `POSTGRES_RLS_ROLE`: optional trusted database RLS role for the server audit adapter, defaults to `service`.
- `POSTGRES_SSL=disable`: optional local-only override.
- `LMCA_REQUIRE_PRODUCTION_STORAGE=true`: fail closed if the deployment is not configured for Postgres.

If `LMCA_AUDIT_STORE` is not `postgres`, Vercel functions fall back to `/tmp/rlhf-audit` with `auditMode=local_jsonl_ephemeral_vercel_preview`. That mode is acceptable for preview demos only; it is not durable production storage.

Local development still defaults to signed demo sessions. In production, set `LMCA_AUTH_MODE=external_jwt` and `LMCA_REQUIRE_REAL_AUTH=true` after the identity provider issues access tokens containing an allowed role and assignment list.

## Database Setup

Apply `db/production-schema.sql` before enabling `LMCA_AUDIT_STORE=postgres`.

The first production-critical table is `audit_events`. It stores append-only event streams for:

- `rating`
- `certification`
- `benchmark_exposure`
- `source_style_audit`

The remaining tables in the schema are the initial normalized backbone for users, position/critique text versions, assignments, context snapshots, label snapshots, and release reports.

The schema enables row-level security on all production tables and defines helper policies under `app_auth`. Trusted API connections set transaction-local values:

- `app.current_role`: one of `rater`, `graduate`, `phd`, `expert`, `admin`, `auditor`, or the internal `service` role for server-side audit storage.
- `app.current_external_auth_id`: the identity-provider subject, matched to `users.external_auth_id`.

The current server audit adapter sets the internal `service` context for append-only `audit_events`. Future normalized-table adapters should set the authenticated user context before querying assignment, text-version, snapshot, or report tables. Do not expose a SQL connection that lets browser clients set these variables directly.

Use a least-privilege app database role when you move normalized reads/writes behind Postgres RLS. Keep the owner/admin database credential out of browser-exposed code and reserve it for migrations.

## Deployment Checklist

1. Provision Postgres close to the Vercel function region.
2. Apply `db/production-schema.sql`.
3. Set `LMCA_SESSION_SECRET`.
4. Configure the identity provider to issue RS256 access tokens with role and assignment claims.
5. Set `LMCA_AUTH_MODE=external_jwt`, `LMCA_AUTH_ISSUER`, `LMCA_AUTH_AUDIENCE`, `LMCA_AUTH_JWKS_URL`, and `LMCA_REQUIRE_REAL_AUTH=true`.
6. Set `LMCA_AUDIT_STORE=postgres`.
7. Set `LMCA_REQUIRE_PRODUCTION_STORAGE=true`.
8. Set `POSTGRES_URL` or `DATABASE_URL`.
9. Deploy with `vercel.json` using `npm run build` and `dist`.
10. Check `/api/health`; production should report `auditMode=postgres_append_only` and `authMode=external_jwt_rbac`.

## Auth And RBAC

Protected API routes now authenticate through the configured auth mode. Demo sessions are only available when `LMCA_AUTH_MODE=demo`; `/api/sessions` returns `demo_sessions_disabled` when external JWT auth is enabled.

External tokens must pass issuer, audience, expiry, and RS256 JWKS signature checks. The role claim drives server-side route authorization, and the assignment claim drives rater write authorization. With Clerk, the `lmca` JWT template can emit top-level `lmca_role` and `lmca_assignments` claims or include those default names in `public_metadata`. Admin-only hidden benchmark routes remain admin-only; append-only audit reads accept `admin` or `auditor`.
