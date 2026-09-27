# OMAT security handover

The ordered implementation and OWASP mapping live in `.scratch/security/`. Production requires HTTPS, `NODE_ENV=production`, a trusted-proxy setting matching the actual proxy, distinct 32-byte JWT secrets, the MFA encryption key, database credentials from the company secret manager, encrypted backups, certificate renewal ownership, incident contacts, and approved retention periods.

Deploy with `docker compose --env-file .env.production up --build`. Place the company certificate at `deploy/certs/tls.crt` and key at `deploy/certs/tls.key`; neither is committed. PostgreSQL is reachable only on the internal Docker network. Confirm migrations and backup/restore before directing users to the service.

Any future outbound HTTP client must use an explicit hostname allowlist, reject redirects to private/link-local addresses, and set short connection and response limits. Run CI, the authorization matrix, production dependency audit, and an authorized ZAP baseline before each production release.
