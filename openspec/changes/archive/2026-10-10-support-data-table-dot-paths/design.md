# Design

Keep value resolution private to `src/components/common/data-table.tsx`. Resolve
an exact own property first; otherwise walk dot-separated own properties through
objects or arrays. Missing or non-object intermediate values return undefined.
Preserve null and falsy leaf values. Do not add bracket-path syntax or dependencies.

Resolve once per cell before either default display or `render(value, item,
onRefresh)`. Keep the original item and callback arguments. Sorting continues to
submit the configured key without changing backend behavior.

The Alpha page uses `wqbData.is.drawdown`, retains nested column keys, and displays
missing returns/drawdown as `-` rather than a fabricated zero. API fields remain
camelCase. No backend changes are needed.

Verify actual DataTable output with React server rendering using the installed
TypeScript compiler to load TSX, plus focused lint, TypeScript and contract checks.
