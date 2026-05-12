# 0002: API Casing Contract

## Status
Accepted

## Context
Frontend code should consume JavaScript-shaped data consistently, while backend internals may use Python and database naming conventions.

## Decision
Frontend request fields, response fields, local record types, and filter keys use `camelCase`.

If backend data appears in `snake_case`, the fix belongs at the backend API boundary or shared API helper layer, not in page-level workaround code.

## Consequences
- Specs that add API integrations must name frontend-facing fields in `camelCase`.
- Frontend pages should not normalize backend casing locally.
- Cross-repo contract changes should link to the corresponding backend SDD note.
