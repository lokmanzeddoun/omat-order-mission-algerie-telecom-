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

**Barème**:
The per-category rates (meals, lodging, per-km) applied to a décompte, differing by Direction; each repas and nuitée is paid at the rate of the zone where it was spent.
_Avoid_: Barem, grille, tarif

## Status labels

| Code | Shown as |
| --- | --- |
| Ordre `INPROGRESS` | En cours |
| Ordre `COMPLETED` | Validé |
| Décompte `PENDING` | En attente |
| Décompte `ACCEPTED` | Accepté |
| Décompte `REGECTED` | Rejeté |
