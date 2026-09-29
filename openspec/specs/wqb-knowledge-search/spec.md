# wqb-knowledge-search Specification

## Purpose
TBD - created by archiving change align-wqb-knowledge-search. Update Purpose after archive.

## Requirements

### Requirement: WQB Knowledge uses the shared search controls

The WQB Knowledge list SHALL present text and state searches using the shared search filter panel.

#### Scenario: Search knowledge

- **WHEN** a user enters Content text, selects Draft or Final, and clicks Search
- **THEN** the list requests matching knowledge using the text and state query parameters
- **AND** pagination returns to its first page

#### Scenario: Reset knowledge search

- **WHEN** a user resets the filters
- **THEN** the list requests all knowledge states without text restriction
- **AND** pagination returns to its first page

#### Scenario: Select both states

- **WHEN** a user selects both Draft and Final
- **THEN** the list does not restrict results by state
