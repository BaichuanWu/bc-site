## Implementation

- [x] 1. Add focused regression verification for complete Diagnose counts, empty/unavailable diagnosis, and both table count columns.
- [x] 2. Restore separate check-count columns and correct the shared Diagnose summary and explanatory text.
- [x] 3. Run affected rendering checks, focused lint, TypeScript, dashboard standards, API casing, and code review.
- [x] 4. Record validation evidence, validate OpenSpec strictly, and archive the completed change.

## Validation evidence

- `node --test scripts/test-alpha-diagnose-cell.mjs`: 3 tests passed. The complete-count and unavailable-diagnosis cases failed against the previous component and passed after correction; empty-array zero counts also passed.
- Production-page browser verification with Playwright and installed Chrome, using mocked existing API responses: both Alpha routes rendered separate check counts 1/0 and complete Diagnose counts 2/3. Each dialog contained the corresponding 2 RA and 3 PPA issues, including margin, correlation, and simulation details. List sorting emitted `-raBlockCount` and `-ppaBlockCount`. No browser page errors were reported.
- Focused ESLint for all three affected frontend files and the regression script passed.
- `pnpm exec tsc --noEmit`, `pnpm run check:frontend-contracts`, and `pnpm run build` passed.
- Independent review under code-review-and-quality found no implementation defects across correctness, architecture, readability, security, and performance. Its suggested table/sorting coverage was exercised in the browser verification above.
- `git diff --check` passed. `openspec validate restore-alpha-check-count-columns --strict` passed before implementation and again before archive.
