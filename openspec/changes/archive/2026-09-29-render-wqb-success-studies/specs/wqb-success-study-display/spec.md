## Purpose

Let users read the Chinese economic explanation stored in a successful WQB Alpha study receipt directly in the dashboard, while preserving access to the underlying receipt evidence and original data.

## ADDED Requirements

### Requirement: Successful study displays readable Markdown
The WQB exploration receipt detail page SHALL render a `SUCCESS_STUDY` receipt's `details.markdown` as Markdown when `details.format` is `text/markdown`, and SHALL retain the receipt summary, scope, evidence references and access to raw details. Other receipt stages SHALL retain their existing display. If the typed payload is missing or invalid, the page SHALL show the raw details without interpreting them as Markdown.

#### Scenario: Valid study is opened
- **WHEN** a user opens a `SUCCESS_STUDY` receipt with a Markdown body
- **THEN** headings, paragraphs, lists and links are readable as formatted content and raw details remain accessible

#### Scenario: Legacy receipt is opened
- **WHEN** a user opens any other receipt stage
- **THEN** the existing note and evidence presentation remain available

#### Scenario: Study payload is malformed
- **WHEN** a study receipt lacks a string Markdown body or the expected format
- **THEN** the page displays its raw details without rendering arbitrary objects as Markdown
