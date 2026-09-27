# 05 — Passwords and onboarding (A07)

Status: ready-for-agent
Type: task
Blocked by: 04

## Do

- **User creation** (`users.service.ts` create):
  - The password is `crypto.randomBytes`-generated, returned once to the admin, and never logged.
  - Set `User.mustChangePassword=true`.
  - A guard blocks every route except change-password and logout until the password is changed.
- **Shared password validator** (`server/src/common/validators/password.ts`):
  - 12 to 128 characters.
  - Rejected if on a bundled common-password list.
  - No composition rules.
  - Used by change and reset.
- **bcrypt:**
  - bcryptjs cost 12.
  - Drop the unused native `bcrypt` dependency.
  - Re-hash on login when the cost is lower.
- **Seeding:**
  - `prisma/seed.ts` refuses to run in production, like `seed-demo.ts`.
  - `setup-workspace.sh` and `setup-db.sh` stop printing passwords outside development.
- **No enumeration:** remove "User not found" / "Invalid Password" and similar distinguishing messages on user-facing paths.
- **Client:** change-password page and the forced-change redirect.

## Tests

- A new user can't call `/missions` until they change their password.
- Weak and common passwords are rejected.
- Seeding refuses when `NODE_ENV=production`.
