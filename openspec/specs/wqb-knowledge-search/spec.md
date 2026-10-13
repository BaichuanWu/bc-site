# wqb-knowledge-search Specification

## Purpose
Browse the current admitted knowledge corpus using shared search controls and independent semantic fields.

## Requirements

### Requirement: WQB Knowledge uses the shared search controls
The WQB Knowledge list SHALL present text, semantic kind, topic, document purpose and applicability searches using the shared search filter panel. Technical ingestion origin, batch and historic numeric state SHALL not be primary controls. Ordinary list retrieval SHALL select current versions.

#### Scenario: Search knowledge
- **WHEN** a user enters content text, chooses reusable knowledge or documents and searches
- **THEN** the list requests matching current knowledge with the semantic filters and pagination returns to its first page

#### Scenario: Reset knowledge search
- **WHEN** a user resets filters
- **THEN** the list requests both admitted semantic types without text or applicability restrictions and pagination returns to its first page

#### Scenario: Specific document purpose
- **WHEN** a user filters by a document purpose
- **THEN** the purpose is forwarded independently of topic and applicability
