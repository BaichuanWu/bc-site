# bc-site Harness Docs

This directory is the canonical Harness Engineering record system for `bc-site`.

## Layout
- `product-specs/`: clear frontend feature, refactor, and behavior specs.
- `design-docs/`: accepted UI, architecture, and contract decisions.
- `standards/`: dashboard implementation standards and checklists.
- `exec-plans/active/`: current implementation plans.
- `exec-plans/completed/`: completed execution plans with verification notes.
- `exec-plans/tech-debt-tracker.md`: active problem and cleanup index.
- `references/`: curated external or framework references.
- `generated/`: generated API, schema, or inspection output.

## Writing Rules
- Record stable facts only: goal, current state, desired behavior, public contracts, acceptance signals, verification, and confirmed decisions.
- Do not record chat transcripts, temporary reasoning, or raw session notes.
- New canonical specs and decisions belong here.

## Current Core Docs
- `design-docs/api-casing-contract.md`: frontend API field casing and boundary expectations.
- `standards/dashboard-architecture.md`: dashboard shell, layout, table, detail, and workspace tab architecture.
- `standards/dashboard-ui.md`: dashboard UI standards.
- `standards/dashboard-tdd.md`: frontend test-driven workflow.

## Spec Shape
Product specs should include `Status`, `Goal`, `Current State`, `Desired Behavior`, `Public Contracts`, `Implementation Notes`, `Acceptance Signals`, and `Verification`.

Design docs should include `Status`, `Context`, `Decision`, `Consequences`, and `Enforcement`.
