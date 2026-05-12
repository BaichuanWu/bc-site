# bc-site SDD

This directory is the spec-driven development home for the `bc-site` frontend repository.

## Directory Layout
- `problems.md`: active index for Draft, Ready, and In Progress work.
- `specs/`: complete specifications for frontend changes.
- `decisions/`: long-lived UI, architecture, and contract decisions.
- `archive/`: completed, deprecated, or migrated design notes.

## Lifecycle
- `Draft`: problem is known, spec is incomplete.
- `Ready`: goal, boundaries, contracts, and acceptance signals are clear.
- `In Progress`: implementation is underway.
- `Done`: implementation and verification are complete.
- `Archived`: no longer active, preserved for history.

## Spec Template
```md
# Title

## Status
Draft | Ready | In Progress | Done | Archived

## Goal
What should be achieved.

## Current State
What is wrong or missing now.

## Desired Behavior
How the UI or frontend behavior should work after the change.

## Public Contracts
API fields, route behavior, URL params, local storage, events, or shared component contracts.

## Implementation Notes
Constraints and boundaries the implementation must preserve.

## Acceptance Signals
How completion is judged.

## Verification
Checks, lint commands, tests, or manual flows to run.
```

## Maintenance Rules
- Keep `problems.md` as an index, not a design document.
- Use one spec per page flow, API integration, refactor, or bug cluster.
- Archive old design documents when superseded.
- Cross-repo API changes must link to the corresponding backend or workspace SDD note.
