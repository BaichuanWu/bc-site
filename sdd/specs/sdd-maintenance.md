# SDD Maintenance

## Status
Ready

## Goal
Make `bc-site/sdd/` the default home for frontend specifications.

## Current State
The workspace has root-level SDD guidance, but `bc-site` is an independent GitHub project and needs its own committed spec structure.

## Desired Behavior
Frontend-only specs are created under `bc-site/sdd/specs/`. Long-lived frontend decisions live under `bc-site/sdd/decisions/`. `problems.md` remains a short active index.

## Public Contracts
No runtime API, route, UI, or component contract changes.

## Implementation Notes
- Keep cross-repo API migrations linked to backend or workspace SDD notes.
- Keep frontend fields in `camelCase`.
- Keep `problems.md` brief and use dedicated specs for implementation guidance.

## Acceptance Signals
- `bc-site/sdd/AGENT.md`, `README.md`, `problems.md`, `specs/`, `decisions/`, and `archive/` exist.
- `bc-site/AGENT.md` points agents to `bc-site/sdd/`.
- Workspace SDD rules no longer claim frontend-only ownership.

## Verification
- Run `rg "bc-site/sdd|cross-repo|project-local" AGENT.md sdd/AGENT.md bc-site/AGENT.md bc-site/sdd`.
