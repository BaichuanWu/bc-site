## Why

The WQB receipt detail page displays all `details` as JSON, so a stored `SUCCESS_STUDY` Markdown learning case cannot be read comfortably in bc-site. The backend already supplies an explicit stage, format and Markdown body.

## What Changes

- Render `SUCCESS_STUDY` Markdown as the main readable receipt content using the existing site Markdown renderer.
- Keep scope, summary, evidence references and raw details accessible; malformed or non-Markdown study payloads retain a safe raw fallback.

## Capabilities

### New Capabilities

- `wqb-success-study-display`: Readable rendering of typed successful-Alpha study receipts in the WQB dashboard.

### Modified Capabilities

None.

## Impact

bc-site WQB receipt detail page and frontend receipt type guard. No backend schema, API or persisted data change; ordinary receipt display remains compatible.
