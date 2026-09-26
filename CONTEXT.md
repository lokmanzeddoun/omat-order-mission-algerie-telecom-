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
An organisational unit of Algérie Télécom (Nord or Sud).
_Avoid_: confusing it with text direction (LTR/RTL)
