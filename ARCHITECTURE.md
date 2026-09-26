# bc-site Architecture

## Overview
`bc-site` is the frontend dashboard application. It owns browser routes, dashboard layout, frontend API integration, UI state, shared components, and visual interaction patterns.

## Main Areas
- `src/app/`: Next.js route pages.
- `src/components/`: shared UI, dashboard shells, table/list/detail components.
- `src/hooks/`: reusable client data and interaction hooks.
- `src/lib/`: API clients, contract helpers, workspace tabs, and frontend utilities.
- `docs/standards/`: dashboard architecture, UI, TDD, and review standards.
- `docs/product-specs/`: frontend product and behavior specs.
- `docs/design-docs/`: frontend decisions and long-lived engineering rules.

## Stable Contracts
- API request and response fields are `camelCase` in frontend code.
- Page components should stay thin and compose shared shells/content components.
- Dashboard page spacing, headers, tabs, and close behavior are platform concerns.
- Public component props should express generic UI capability, not resource-specific routing hacks.

## Documentation Map
- Specs: `docs/product-specs/`
- Decisions: `docs/design-docs/`
- Standards: `docs/standards/`
- Active work and trackers: `docs/exec-plans/`
- Generated/reference material: `docs/generated/`, `docs/references/`
