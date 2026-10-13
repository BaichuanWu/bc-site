## Implementation

- [x] Render QUICK WQB IDs yellow in the Alpha list and analysis table, and remove QUICK badges beside State.
- [x] Verify focused lint, TypeScript, dashboard standards, API casing, and affected UI behavior.
- [x] Record validation evidence and pass strict OpenSpec validation.

## Validation evidence

- `pnpm exec eslint src/app/dashboard/wqb/alpha/page.tsx src/app/dashboard/wqb/alpha/analysis/page.tsx` passed.
- `pnpm exec tsc --noEmit` passed.
- `pnpm run check:frontend-contracts` passed, including dashboard standards and API casing.
- `git diff --check` passed. Both routes condition the WQB ID link/plain text color on saved `settings.simulationMode`; State renders only its existing badge.
- `openspec validate color-quick-wqb-id --strict` passed.
