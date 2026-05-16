# API Casing Contract

## Status
Accepted

## Context
Frontend code should consume JavaScript-shaped data consistently. Backend internals may use Python and database naming conventions.

## Decision
Frontend request fields, response fields, local record types, route params, and filter keys use `camelCase`.

If backend data appears in `snake_case`, the fix belongs at the backend API boundary or shared API helper layer, not in page-level workaround code.

## Consequences
- API integration specs must name frontend-facing fields in `camelCase`.
- Page, hook, and UI model code should not normalize backend casing locally.
- Shared API utilities should absorb contract-level conversions when needed.

## Enforcement
- Contract-sensitive changes should run the local API casing check.
- New hand-written response types should use `camelCase`.
- Backend API leaks should be fixed at the boundary rather than hidden in page code.
