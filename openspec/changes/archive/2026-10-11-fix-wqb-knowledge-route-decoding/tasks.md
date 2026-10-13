## Ordered tasks

- [x] 1. Complete proposal, design and observable routing specs; strict change validation passed before implementation.
- [x] 2. Add regression tests for the reported reference, route encoding and legacy numeric compatibility; baseline failed 3 of 4 cases because encoded identity/version segments reached the API unchanged.
- [x] 3. Decode the route at the frontend boundary and construct the canonical workspace tab path.
- [x] 4. Regression tests (4/4), focused ESLint, TypeScript, frontend contract checks, production build and diff whitespace validation passed. Reviewed correctness, readability, ownership, encoding safety and constant-time routing work; no unresolved findings. See validation.md.
- [x] 5. Strict OpenSpec validation passed after implementation; archive the completed change with the routing spec.
