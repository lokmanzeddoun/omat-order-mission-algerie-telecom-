# 06 — Spreadsheet import/export (A08, A03, A06)

Status: ready-for-agent
Type: task
Blocked by: 03

## Do

- **Replace `xlsx@0.18.5`** (CVE-2023-30533 prototype pollution, CVE-2024-22363 ReDoS) with `exceljs`:
  - in `users.service.ts` and `structures.service.ts`,
  - and in the client too, if it imports xlsx.
- **Uploads** (`server/src/utils/upload.ts`):
  - Check the magic bytes (ZIP `PK\x03\x04`) in addition to the extension.
  - Keep the 5 MB limit and in-memory storage.
  - Cap the row count while reading.
- **Validation:**
  - Every row goes through `ImportUserRowDto` / `ImportStructureRowDto` (`plainToInstance` + `validate`).
  - Report per-row errors.
  - Make the import atomic.
- **Users import:**
  - **Ignore role and password columns.** New users get the flow from issue 05.
  - Upsert only within the actor's scope.
  - Never touch SUPER_ADMIN rows.
  - Fix `serviceId` becoming the string `"undefined"`.
- **Exports:** `sanitizeCell()` prefixes `'` to values starting with `= + - @ \t \r`. Apply it to the server exports and to the client CSV (`client/src/components/common/bulk.ts`).

## Tests

- **Rejected workbooks:**
  - a formula cell,
  - an oversized file,
  - a wrong magic number,
  - a role or password column (ignored),
  - an attempt to overwrite a SUPER_ADMIN.
- **Exports:** unit tests for the escaping.
