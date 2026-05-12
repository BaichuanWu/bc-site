# bc-site Agent Guide

## Scope
- Applies to `bc-site/` and subdirectories.

## Frontend Contract Rule
- Frontend code must use `camelCase` for API request fields, response fields, local record types, and filter keys.
- Do not use backend `snake_case` names in page code, hooks, or UI models.
- If the backend still stores or computes values in `snake_case`, conversion belongs on the backend boundary, not in frontend pages.

## SDD
- `bc-site` is an independent GitHub project and must keep its own `AGENT.md`.
- Frontend SDD lives in `bc-site/sdd/`.
- Before SDD-driven implementation, read `bc-site/sdd/problems.md` and the linked files under `bc-site/sdd/specs/` or `bc-site/sdd/decisions/`.
- Keep `problems.md` as an index; put complete specs in `sdd/specs/` and long-lived decisions in `sdd/decisions/`.
- If a frontend change requires backend contract changes, link to the related `bc-core/sdd/` or workspace cross-repo SDD note.

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
