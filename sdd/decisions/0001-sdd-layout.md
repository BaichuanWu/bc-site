# 0001: Project-Local SDD Layout

## Status
Accepted

## Context
`bc-site` is an independent GitHub project. Frontend specs should be committed and reviewed with frontend changes instead of living only in a workspace-level directory.

## Decision
Use `bc-site/sdd/` as the default frontend SDD area.

The standard layout is:

```text
sdd/
  AGENT.md
  README.md
  problems.md
  specs/
  decisions/
  archive/
```

`problems.md` is an index. Full specs live in `specs/`. Long-lived decisions live in `decisions/`. Historical material lives in `archive/`.

## Consequences
- Frontend-only work should not add specs to workspace-level `sdd/`.
- Cross-repo API contract work may still use workspace-level `sdd/` when backend and frontend must coordinate.
