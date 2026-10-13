# wqb-knowledge-routing Specification

## Purpose
Preserve knowledge identities and exact version references when opening dashboard
detail links, constructing API requests and identifying workspace tabs.

## Requirements

### Requirement: Knowledge detail routes preserve reference identity

The detail page SHALL decode its URL segment exactly once before constructing a
knowledge API request or workspace tab path. It SHALL preserve opaque version
references and legacy numeric links without changing the backend contract.

#### Scenario: Open a batch knowledge version from the list

- **WHEN** a user opens a batch identity and fingerprint link from the list
- **THEN** the API receives the original identity and fingerprint
- **AND** the request and workspace tab path contain only one URL encoding layer

#### Scenario: Open a file with escaped characters

- **WHEN** a file identity contains slashes, Unicode or literal percent escapes
- **THEN** one URL decoding pass preserves the original authored identity

#### Scenario: Open an existing numeric link

- **WHEN** the route segment is a numeric ID with leading zeros
- **THEN** the API receives the existing normalized db:<id> identity

#### Scenario: Open a malformed escape

- **WHEN** the route segment contains an invalid percent escape
- **THEN** the detail page does not throw a decoding error during rendering
