# 04 — Import with `path` and dry run

Status: resolved
Type: task
Blocked by: 01

## Do

- Spreadsheet columns: `Code`, `Name` (a root) and `Path` (a child). The code and name of a path row must be empty or match the path.
- `POST /structures/upload?dryRun=true` returns `{ willCreate, willUpdate, errors, rows }` and writes nothing; applying rejects the whole file on any error.
- Roots declared in the same file count as existing roots; parents must exist or be in the file.
- The export writes `Path` and `Responsible`.
