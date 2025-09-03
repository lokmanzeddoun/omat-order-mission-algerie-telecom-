# OMAT – Order & Mission Management (Algérie Télécom)

A structured report-style overview of the application, derived from the existing codebase and the internship report context. This serves as living documentation to guide completion of missing features.

## 1. Executive Summary

OMAT streamlines mission orders (ordres de mission) across hierarchical services within an organization (Algérie Télécom). Admins create and manage orders for users (employees). For each issued order, the system supports a “décompte” phase to validate expenses and compute the payable amount based on a “barème” (per-diem rates) including meals (lunch/dinner) and lodging by employee grade. The application enforces role-based access, service hierarchy, and a review/validation workflow, culminating in payment readiness.

## 2. Goals & Objectives

- Digitize the end-to-end lifecycle: request → order issuance → execution → expense/decompte → validation → payment.
- Apply barème rules consistently (meals, nights, grade-based rates, transport categories).
- Provide transparency and auditability with clear statuses and history.
- Fit AT’s service hierarchy and user roles (Admin, Validateur, Employé, etc.).

## 3. Scope & Actors

- Actors
  - Admin: manages users, services, barème, issues orders, oversees validation and archives.
  - Validator/Manager: reviews and validates decompte.
  - Employee/User: views orders, submits decompte evidence, tracks status.
- In Scope
  - User & role management
  - Service structure with hierarchical relationships
  - Order creation, assignment, tracking
  - Décompte entry, calculation, and validation flow
  - Archive and reporting views
- Out of Scope (initial)
  - Payroll disbursement integration
  - Advanced analytics/BI

## 4. Functional Workflow

1) Setup & Master Data
- Define services (direction, department) forming a hierarchy.
- Maintain barème: rates per grade, per day/night, meal allowances, transport.
- Create users and assign roles + service.

2) Order Lifecycle (Ordre de Mission)
- Admin creates an order: employee, destination, mission dates, transport, objectives.
- Order status: Draft → Issued → In Progress → Completed.

3) Décompte & Validation
- On completion, employee/admin inputs decompte: number of lunches, dinners, nights, transport costs.
- System computes payable amount from barème and mission duration + grade.
- Validation chain: Submitted → Reviewed → Approved/Rejected.

4) Archive & Reporting
- Approved orders with validated decompte are archived.
- Exports and summaries by period, service, user.

## 5. Data Model (conceptual)

- User { id, name, grade, role, serviceId, ... }
- Service { id, name, parentId?, level }
- Order { id, userId, serviceId, startDate, endDate, destination, transportType, status, ... }
- Decompte { id, orderId, lunches, dinners, nights, transportCost, total, status, validatorId, ... }
- BaremeRule { id, grade, perDiem, mealLunch, mealDinner, nightRate, transportCategory, effectiveFrom, effectiveTo }

Notes:
- Status enums: orderStatus (draft|issued|in_progress|completed|archived), decompteStatus (draft|submitted|approved|rejected).
- Keep history/audit: who validated, when, what changed.

## 6. Barème Calculation Logic (outline)

Inputs:
- Mission days (start/end), grade, counts for meals/nights, transport type.
Logic:
- Compute duration (days, nights). Adjust meals based on travel times.
- Apply grade-specific rates from barème.
- Total = meals + nights + transport + fixed per-diem adjustments.
Edge cases:
- Partial days, overlaps, public holidays (if policy-driven), min/max caps.

## 7. Roles & Permissions

- Admin: CRUD users/services/bareme, create orders, finalize/override decompte, archive.
- Validator: review/approve/reject decompte, request changes.
- User: view assigned orders, submit decompte inputs and attachments.
- Protected routes and redirects are already scaffolded in code (see `ProtectedRoute.tsx`, `RedirectBasedRole.tsx`).

## 8. UI Structure (from repository)

- Pages
  - Auth: login/register and role redirect
  - Dashboard (Admin, User)
  - Orders (`src/pages/ordres/`): list, details, creation
  - Bareme: view/edit rates
  - Structures: services hierarchy
  - Users: management and profiles
  - Archive: validated orders
- Components
  - Admin/order-overview, lists, forms, loaders, alerts, common UI
- Constants
  - Role, category, transport, direction enums
- Data
  - `barem.json` (seed of rates), mentors, task overview

## 9. Missing Parts to Implement

- Décompte module end-to-end
  - UI form tied to an order with fields: lunches, dinners, nights, transport cost, notes, attachments
  - Calculation service reading `barem.json` and user grade
  - Submission → review/approval UI and API endpoints
- Order detail page enhancements
  - Timeline/status transitions; ability to complete and open decompte
- Bareme maintenance UI
  - Admin editing and versioning of rates (effective dates)
- Service hierarchy management
  - CRUD with tree view, parent/child reassignment
- Reporting & exports
  - Period/service summaries, CSV/PDF export of decompte
- Audit trail
  - Who approved/when; immutable history entries

## 10. Non-Functional Requirements

- Security: RBAC, route guards, JWT/session handling.
- Performance: pagination and cached lists for orders/users.
- Reliability: validation on inputs, rate fallbacks when barème changes.
- Internationalization (optional): French/Arabic labels.

## 11. API Design (proposed)

- GET /api/orders?status=...&serviceId=...&userId=...
- GET /api/orders/:id
- POST /api/orders
- PATCH /api/orders/:id/status
- GET /api/orders/:id/decompte
- POST /api/orders/:id/decompte  // submit/update
- POST /api/orders/:id/decompte/submit
- POST /api/decomptes/:id/approve
- POST /api/decomptes/:id/reject
- GET /api/bareme
- PUT /api/bareme
- GET /api/services (tree)
- CRUD users/services

Responses should include computed totals and a breakdown for transparency.

## 12. Calculation Example

- Grade: B
- Mission: 3 days, 2 nights
- Meals: 4 lunches, 3 dinners
- Night rate: per barème for grade B
- Transport: category C capped at X
- Total = (4 × lunchB) + (3 × dinnerB) + (2 × nightB) + transportC

Provide a breakdown in UI: line-items with rates and quantities.

## 13. Testing Strategy

- Unit tests: calculation service (happy path + partial days + grade change)
- Integration: order → decompte → approval flow
- UI: form validations, role redirects, protected access

## 14. Roadmap

- M1: Order detail + decompte submission (read-only rates)
- M2: Validator workflow + approval history
- M3: Bareme admin UI + versioning
- M4: Reports/exports + archives

## 15. How to Contribute

- Branching: feature/<area>; PR to `enhancement` then `main`.
- Lint & typecheck before PR. Keep components typed and modular.

---

This document is a foundation. Update it as features solidify (especially barème rules and validator chains) and align it with organizational policy.
