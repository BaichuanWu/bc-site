# Validation evidence

- `pnpm exec eslint 'src/app/dashboard/wqb/exploration-receipts/[id]/page.tsx'`: passed.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm run check:dashboard-standards`: passed.
- `pnpm run check:api-casing`: passed.
- `openspec validate render-wqb-success-studies --strict`: valid.

The backend already returns `stage=SUCCESS_STUDY`, `details.format=text/markdown`, `details.markdown`, `details.alphaId`, and optional `details.evidenceReceiptIds`. This frontend change uses that existing contract; no backend migration or API change is needed. Other receipt stages and malformed study payloads keep their raw-details fallback.
