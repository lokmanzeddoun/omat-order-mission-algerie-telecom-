# 02 — Subtree access policy

Status: resolved
Type: task
Blocked by: 01

## Do

- `AccessPolicy`: `scopeUsers/Missions/Decomptes/Comments/Structures`, `canActInStructure`, `canAccessUser` use the subtree (`code startsWith own + ' / '`, plus own structure when it has a responsible).
- The JWT strategy puts `serviceHasResponsible` on the request user.
- `users.service.ts`: an admin creates and moves users anywhere in their subtree (single and import); a responsible cannot be moved, and an archived user stops being one.
- Ancestors' admins validate ordres and décomptes of descendants; self-approval stays forbidden.
- Update the access-control fixture (responsibles) and add the visibility matrix e2e.
