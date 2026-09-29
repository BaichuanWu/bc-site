## Context

The backend stores study bodies in `details.markdown` with `details.format=text/markdown`; the detail page currently prints `details` as JSON. bc-site already uses `react-markdown` and `remark-gfm` for WQB Knowledge.

## Goals / Non-Goals

**Goals:** Make the case readable in the receipt detail view and retain evidence access.

**Non-Goals:** Change backend payloads, render Markdown from an untyped receipt, or alter other receipt stages.

## Decisions

- Add a narrow frontend type guard for `stage=SUCCESS_STUDY`, `details.format=text/markdown` and a string body. This uses the existing backend contract and avoids restructuring all receipt data.
- Reuse the Knowledge page's Markdown dependencies and prose styling. Keep raw JSON in a collapsible section so readers can inspect Alpha IDs and evidence receipt references.
- Continue to use the existing `DetailPageLayout` shell and scope side card.

## Risks / Trade-offs

- Markdown links can point off site → use the existing sanitized `react-markdown` behavior, with no raw HTML plugin.
- Long studies add page length → raw JSON is collapsed by default; the rendered case is the main content.

## Migration Plan

Deploy frontend only. Existing backend payloads and other receipt pages remain readable; rollback restores generic JSON display.
