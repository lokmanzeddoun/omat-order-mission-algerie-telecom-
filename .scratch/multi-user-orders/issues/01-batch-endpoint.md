# 01 — Batch endpoint with one transaction

Status: done
Type: task

## Do

- Migration `20261003120000_mission_batch_id` adds nullable `Mission.batch_id` (indexed).
- Extract the per-user rules of `MissionsService.create` into `assertCanTargetUser` (existence + `AccessPolicy.canActInStructure`) and `buildMissionFields` (dates, 30-day cap, transport). `create` and `createBatch` both use them; `POST /missions` behaviour is unchanged.
- `POST /missions/batch` (`@Auth('ADMIN', 'SUPER_ADMIN')`, `CreateMissionsBatchDto`): validate every user, collect errors per matricule, create all missions in one `$transaction`, audit `MISSION_BATCH_CREATED`.

## Acceptance

- One refused user (other structure, unknown matricule) creates nothing and is named in `errors`.
- A failure inside the transaction rolls back the ordres already inserted.
- 401 anonymous, 403 plain user, 400 over the 30-day cap.
