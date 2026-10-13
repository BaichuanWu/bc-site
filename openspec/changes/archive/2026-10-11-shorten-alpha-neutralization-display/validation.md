# Validation

- Strict change validation passed before and after implementation.
- A temporary in-memory check compiled the actual Alpha column and WQB platform
  formatter with the installed TypeScript compiler. React server rendering and
  element inspection confirmed 10 display/title cases: the five abbreviations,
  MARKET, FAST, an unknown long value, null and undefined. Column width is 110px,
  header is Neutral and the query key remains settings.neutralization.
- Focused ESLint on src/lib/wqb-platform.ts and the Alpha page passed.
- `pnpm exec tsc --noEmit` passed.
- `pnpm run check:frontend-contracts` passed both dashboard and API casing checks.
- `git diff --check` passed.
- Incremental review with code-review-and-quality found no unresolved issues.
  Labels belong in the feature helper; cell presentation belongs in the Alpha
  column. React escapes both labels and native titles. Unknown settings remain
  visible with ellipsis; missing settings show an em dash. No backend or shared
  DataTable changes, dependencies or extra requests were introduced.

Existing working-tree changes were preserved. No server deployment was performed.
