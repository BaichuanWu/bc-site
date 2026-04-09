# bc-site Agent Guide

## Scope
- Applies to `bc-site/` and subdirectories.

## Frontend Contract Rule
- Frontend code must use `camelCase` for API request fields, response fields, local record types, and filter keys.
- Do not use backend `snake_case` names in page code, hooks, or UI models.
- If the backend still stores or computes values in `snake_case`, conversion belongs on the backend boundary, not in frontend pages.

## Dashboard Work
- Read relevant docs under `docs/standards/` before changing dashboard architecture or page layout.
- Keep list/detail patterns aligned with the existing dashboard system.
- Respect the local checks:
- `pnpm run check:dashboard-standards`
- `pnpm run check:api-casing`

## Data Fetching
- Prefer shared helpers like `useCrud`, `normalizeCrudListResponse`, and shared API utilities.
- When adding new hand-written response types, define them in `camelCase`.

## Editing Guidance
- Preserve existing visual patterns unless the task is explicitly a redesign.
- Avoid page-level workaround code when a shared component or helper can solve the problem.

## Validation
- For touched frontend files, run focused `eslint`.
- For contract-sensitive changes, also run `pnpm run check:frontend-contracts`.
