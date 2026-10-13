# Verification

- Before implementation, `node --test scripts/test-data-table.mjs` failed 3 of 5
  tests: nested cells, nested renderer values and null leaves.
- After implementation all 5 tests passed using the actual DataTable, table and
  tooltip components with React server rendering. Coverage includes arrays,
  exact-key precedence, missing/primitive intermediates, inherited properties,
  null/falsy leaves, and original row/refresh callback identity.
- Focused ESLint passed for DataTable, the Alpha page and the regression script.
- `pnpm exec tsc --noEmit`, `pnpm run check:frontend-contracts`, `pnpm build` and
  `git diff --check` passed.
- Review confirmed generic resolution belongs in the common table, performs no
  mutation or inherited-property traversal, and preserves existing row/render
  contracts. No API or sorting behavior changed. The user's existing Alpha
  column additions were retained, with the drawdown typo corrected.
