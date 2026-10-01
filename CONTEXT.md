# OMAT — Ordres de Mission Algérie Télécom

Manages the lifecycle of business-trip requests for Algérie Télécom employees: from the ordre de mission, through admin validation, to the expense settlement (décompte).

## Language

### Missions

**Ordre de mission**:
A request to send an employee on a business trip; one record per trip.
_Avoid_: Mission, Order (code aliases only — never in UI text)

**Validation**:
An admin's approval of an ordre de mission; a validated ordre is shown as "Validé" and gives rise to a décompte.
_Avoid_: Completed, Terminé

**Lot d'ordres**:
Ordres de mission created together by an admin for several agents with the same destination, dates, motif, transport and direction; they are independent ordres (own validation and décompte) sharing a `batch_id`, created all-or-nothing and printed in one PDF.
_Avoid_: Mission groupée, bulk order (in UI text)

**En cours**:
The state of an ordre de mission that has not yet been validated.
_Avoid_: In progress (in UI text)

### Settlement

**Décompte**:
The expense settlement attached to a validated ordre de mission; it is En attente, Accepté, or Rejeté.
_Avoid_: Reimbursement, claim

**Rejet**:
An admin's refusal of a décompte; always accompanied by a commentaire giving the reason.
_Avoid_: Regected, refusal

**Commentaire**:
A message attached to a décompte decision or a support request, visible to the employee.
_Avoid_: Comment, message (in UI text)

### Organisation

**Direction**:
The zone of Algérie Télécom (Nord or Sud) an ordre de mission is spent in; an ordre spent partly in each is "Nord et Sud" (code `MIXTE`), and its décompte records each repas and nuitée in the zone where it was spent.
_Avoid_: confusing it with text direction (LTR/RTL)

**Exercice**:
The fiscal year that scopes ordres de mission and décomptes; one exercice is always selected, defaulting to the current one.
_Avoid_: Year, Année (as a free-standing filter)

**Structure** (also Service):
A unit of the organisation an agent belongs to. Structures form a tree of at most 3 levels: a root is shown by its full name (code = its abbreviation, e.g. `SDC`), a sub-structure by its path (code = the path, e.g. `SDC / ERSTC / Section Réseau Intranet AT`).
_Avoid_: Direction (that is the Nord/Sud zone), Département

**Sous-structure**:
A structure with a parent. Its code is its full path, so renaming or moving it changes the code of everything below it.
_Avoid_: Child service in UI text

**Responsable**:
The user a structure designates as its head; they must belong to the structure and lead only one. A structure without a responsable is visible only to the admins of its parent structures and to super admins.
_Avoid_: Chef, Manager

**Périmètre** (subtree):
A structure and all its descendants. An admin acts on the périmètre of their structure, downward only: never on a parent or sibling structure.
_Avoid_: Scope (in UI text)

**Barème**:
The per-category rates (meals, lodging, per-km) applied to a décompte, differing by Direction; each repas and nuitée is paid at the rate of the zone where it was spent.
_Avoid_: Barem, grille, tarif

### Périodes de grade

**Période**:
A bounded stretch of days during which an agent holds a higher category than their own (CADRE or CADRE_SUPERIEUR). Created and ended by a super admin, never deleted. Ending it early stops it that day; the agent's own category is never edited.
_Avoid_: Grade assignment (code name only), promotion

**Intérim**:
A période granted for a vacant post; 12 months at most. Printed "(Intérim)" after the grade on the PDFs.
_Avoid_: Interim (without accent) in UI text

**Remplaçant**:
A période granted to stand in for an absent agent; 4 months at most. Printed "(Remplaçant)" after the grade on the PDFs.
_Avoid_: Replacement, suppléant

**Catégorie effective**:
The category an ordre de mission is priced at: the target category of the période that covers its date de sortie, otherwise the agent's own. It is frozen on the ordre when created, and the barème rates are frozen on the décompte when settled, so later changes never move an existing amount. A renewal is a new période, never an extension, and touching périodes of one kind count together against the cap.

## Status labels

| Code | Shown as |
| --- | --- |
| Ordre `INPROGRESS` | En cours |
| Ordre `COMPLETED` | Validé |
| Décompte `PENDING` | En attente |
| Décompte `ACCEPTED` | Accepté |
| Décompte `REGECTED` | Rejeté |

Status labels live in `client/src/locales/*/enums.json` (`status.*`); the table above is the French wording.

## Interface languages

The UI is available in French (default) and Arabic (right-to-left), switched from the header and remembered per browser. PDFs stay in French.

- Every visible string comes from `client/src/locales/<fr|ar>/<namespace>.json`; both languages must have the same keys (checked by `locales.test.ts`, raw JSX text is rejected by ESLint).
- Layout uses logical sides only (`ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `border-s`/`border-e`, `text-start`/`text-end`); directional icons get `rtl:rotate-180`.
- Numbers keep Latin digits and French grouping (`1 500,50`) in both languages; amounts end with `DA` / `د.ج`.

| Term | Arabic |
| --- | --- |
| Ordre de mission | أمر بمهمة |
| Décompte | كشف المصاريف |
| Validation / Validé | المصادقة / مصادق عليه |
| En cours | قيد الإنجاز |
| En attente / Accepté / Rejeté | قيد الانتظار / مقبول / مرفوض |
| Commentaire | تعليق |
| Direction (Nord / Sud) | المديرية (الشمال / الجنوب) |
| Exercice | السنة المالية |
| Barème | سلّم التعويضات |
| Service | المصلحة |
| Période | فترة |
| Intérim | إنابة |
| Remplaçant | استخلاف |
| Catégorie effective | الفئة المعتمدة |
| Sous-structure | مصلحة فرعية |
| Responsable | المسؤول |
| Périmètre | النطاق |
| Lot d'ordres | مجموعة أوامر بمهمة |
| Agent | عون |
