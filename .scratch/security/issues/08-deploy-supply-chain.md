# 08 — Deployment and supply chain (A05, A06, A08)

Status: ready-for-agent
Type: task
Blocked by: 02

## Do

- **Docker:**
  - `server/Dockerfile` and `client/Dockerfile`: multi-stage, Node 20 LTS, non-root, `npm ci --omit=dev`.
  - The server entrypoint runs `prisma migrate deploy`.
- **`docker-compose.yml`:**
  - Postgres is not published.
  - Secrets come from an env file that is not committed.
- **`deploy/nginx.conf`:**
  - TLS and HSTS.
  - `client/dist` served under `/omat`, `/api` proxied.
  - CSP: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` (tighten if possible); `img-src 'self' data:`; `object-src 'none'`; `frame-ancestors 'none'`; `base-uri 'self'`.
  - `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`.
  - `client_max_body_size 6m`.
  - `limit_req` on `/api/auth/`.
  - Replace the README's `vite preview` production instructions.
- **CI:**
  - `.github/workflows/ci.yml`: install → lint → typecheck → unit → e2e (Postgres service) → `npm audit --omit=dev --audit-level=high` → build.
  - `codeql.yml`.
  - `dependabot.yml` covering npm (root, server, client), docker and actions.
- **Lint guardrails:**
  - Ban `$queryRawUnsafe`/`$executeRawUnsafe` and `dangerouslySetInnerHTML`.
  - Add `eslint-plugin-security` on the server.
- **Handover docs:** `docs/security/README.md` with:
  - the final Top 10 → control → test matrix,
  - a go-live checklist (secrets, `NODE_ENV=production`, `TRUST_PROXY`, backups, certificate renewal),
  - the SSRF rule (any future outbound call goes through an allow-listed client).

## Done when

- `docker compose up` serves the app over HTTPS, and `curl -I` shows the headers.
- An OWASP ZAP baseline scan has no high findings.
- CI is green.
