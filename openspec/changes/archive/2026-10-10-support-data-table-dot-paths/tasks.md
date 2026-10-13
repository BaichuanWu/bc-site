## Ordered tasks

- [x] 1. Complete the proposal, design and observable specs; `openspec validate support-data-table-dot-paths --strict` passed.
- [x] 2. Add rendering regression coverage; the baseline fails 3 of 5 tests on nested display, callback values and null leaves.
- [x] 3. Resolve dotted keys centrally and correct the Alpha performance columns; document the shared table contract.
- [x] 4. All 5 rendering tests passed; focused ESLint, `pnpm exec tsc --noEmit`, `pnpm run check:frontend-contracts`, `pnpm build` and `git diff --check` passed. Reviewed the table resolver and Alpha columns for correctness, simplicity, ownership, own-property traversal and per-cell work; no unresolved findings.
- [x] 5. Recorded verification evidence; strict validation passed and the completed change was archived.
