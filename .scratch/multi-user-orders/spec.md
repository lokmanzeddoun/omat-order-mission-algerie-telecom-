# Multi-user ordres de mission

Goal: an admin creates the same ordre de mission for several agents at once, instead of repeating the form per person. Work ships as small ordered PRs; each is one issue under `issues/`.

Decisions: [ADR 0001 access control](../../docs/adr/0001-access-control-policy.md) (who may act for whom), [CONTEXT.md](../../CONTEXT.md) (**Lot d'ordres**).

## Rules

- **Who:** ADMIN and SUPER_ADMIN only. A plain USER keeps the single form for themselves and gets 403 on the batch route.
- **Shared fields:** destination, dates, motif, transport and direction are the same for every ordre of the batch.
- **Independent ordres:** each user gets their own `Mission` row, status, validation and décompte. Rows only share a nullable `Mission.batch_id` (a UUID) so a lot can be traced.
- **All-or-nothing:** every user goes through the same checks as `POST /missions`; the inserts run in one transaction. If any user is refused, nothing is created.
- **Per-user checks** (one shared validator, `MissionsService.assertCanTargetUser`):
  - the user exists (400);
  - the actor may act in the user's structure through `AccessPolicy.canActInStructure` (403): an ADMIN only for their own structure, a SUPER_ADMIN for anyone. The actor may always include themselves.
- **Batch-wide checks** (400, no per-user list because they do not depend on the user): 30-day cap (`assertMissionDuration`), return strictly after departure, 1 to 100 distinct matricules.
- **50 km personal-car rule:** not checked at creation. The distance (parcours) is only known when the ordre is validated, so the rule stays in the décompte (`MIN_PARCOURS_KM`) and applies to each ordre of a lot separately.
- **Errors:** `400 { message, errors: [{ matricule, message }] }`, one entry per refused user.
- **Response:** `201` with one PDF holding every ordre in the order of `userMatricules`. Each ordre keeps its two pages (ordre, then compte rendu), so N users give 2N pages. If the ordres are saved but the render fails, the response is empty (the client warns instead of inviting a duplicating retry), like `POST /missions`.
- **Unchanged:** `POST /missions` and `GET /missions/:id/download` behave as before; downloading one ordre of a lot gives that ordre alone.
- **Audit:** `MISSION_BATCH_CREATED` (entity `Mission`, entityId = batch id, `after` lists `{ n_mission, userId }` of every ordre).
- **Visibility:** unchanged; every read still goes through `AccessPolicy.scopeMissions`. This feature only calls `canActInStructure`, so it follows a future change of that rule (for example a subtree scope) without edits.

## Interface

- `POST /missions/batch` body: the `POST /missions` fields minus `userMatricule`, plus `userMatricules: number[]`.
- Dialog "Nouvel ordre de mission" (shell button, ADMIN / SUPER_ADMIN): a searchable multi-select of the scoped `/users` list (inactive users hidden), with "Sélectionner toute ma structure" (adds the signed-in user's structure; never removes) and "Tout désélectionner". The signed-in user is selected by default.
  - One person selected: the existing single creation (`POST /missions`).
  - Several: `POST /missions/batch`. A refusal is shown under each refused user and the dialog stays open.
- French and Arabic strings under `ordres:form.*`, `ordres:batch.*`, `toasts:missionsBatchCreated*`.

## Migration

`20261003120000_mission_batch_id`: `Mission.batch_id TEXT NULL` + index. Existing rows stay `NULL`.

## Order

01 batch endpoint → 02 batch PDF → 03 picker UI.
