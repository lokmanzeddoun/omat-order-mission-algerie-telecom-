# Security data retention

Company IT must approve the final periods before production. Recommended defaults:

- Audit events: 24 months, append-only access for authorized administrators.
- Revoked and expired sessions: 90 days after expiry, then delete.
- Application security logs: 12 months, with access restricted to operations staff.
- Backups: encrypted, access logged, and expired according to the company retention policy.

Run and record a restore drill at least annually. Legal holds override deletion. Audit exports must use employee matricules rather than names or email addresses wherever possible.
