# bc-site SDD Agent Guide

## Scope
- Applies to `bc-site/sdd/` and its subdirectories.
- This is the default SDD area for frontend-only work in the `bc-site` GitHub project.

## Required Reading
- Before changing frontend implementation, read `bc-site/AGENT.md`.
- For SDD-driven work, read `problems.md` and linked files under `specs/` or `decisions/`.
- If work changes backend API expectations, also check `bc-core/sdd/` and workspace cross-repo `sdd/`.

## File Roles
- `README.md`: human-facing SDD usage guide.
- `problems.md`: active issue index only; do not put full designs here.
- `specs/`: one spec per UI behavior, API integration, workflow, or refactor.
- `decisions/`: long-lived frontend architecture and contract decisions.
- `archive/`: completed, deprecated, or migrated material that is no longer a default implementation source.

## Workflow
- New work starts in `problems.md`.
- Complex work gets a dedicated `specs/*.md` file.
- Move a spec to `Ready` before implementation starts.
- Update status and verification notes when implementation finishes.

## Frontend Contracts
- Frontend code uses `camelCase` for API request fields, response fields, local record types, and filter keys.
- Do not introduce page-level conversions for backend `snake_case`; fix the backend boundary or shared API helpers.
- UI specs should name the target page, user path, API dependencies, loading state, empty state, error state, and verification command.
