# bc-site Agent Guide

## Purpose
- This repository is the frontend/dashboard application.
- `AGENTS.md` is the short agent entrypoint. Durable product and engineering knowledge lives in `docs/`.
- Do not add durable guidance outside the Harness docs structure.

## Reading Map
- Start with `ARCHITECTURE.md` for the frontend map.
- Use `docs/README.md` to choose specs, design docs, and execution plans.
- Product specs live in `docs/product-specs/`.
- Design decisions live in `docs/design-docs/`.
- Dashboard standards live in `docs/standards/`.

## Frontend Contract Rules
- Frontend code uses `camelCase` for API request fields, response fields, local record types, and filter keys.
- Do not use backend `snake_case` names in pages, hooks, or UI models.
- If backend values are still stored or computed in `snake_case`, conversion belongs at the backend boundary.
- Workflow DSL JSON is the narrow exception: fields such as `run_defaults`, `agent_id`, and mappings may remain `snake_case` inside DSL editor/model helpers.
- Shared workflow editing logic belongs in `src/lib/workflow-studio.ts`; pages and hooks should not duplicate form hydration, template application, task kwargs merging, or agent option filtering.
- Reusable UI behavior belongs in `src/components/common`; feature `src/lib/*` files should hold domain data transforms and payload helpers, not component event plumbing.

## Dashboard Rules
- Read `docs/standards/dashboard-architecture.md` before changing dashboard structure.
- Keep list/detail pages aligned with shared shell, layout, table, and workspace tab standards.
- Prefer shared helpers such as `useCrud`, `normalizeCrudListResponse`, and common API utilities.

## Verification
- For touched frontend files, run focused lint checks.
- For dashboard architecture, use `pnpm run check:dashboard-standards`.
- For API casing, use `pnpm run check:api-casing` or the current frontend contract check.
