## ADDED Requirements

### Requirement: Direct page selection
The WQB Knowledge, exploration receipt, dataset classification and classification decision browsers SHALL provide numbered page controls that load the selected server-side page.

#### Scenario: Jump to page
- **WHEN** a user selects an available page number
- **THEN** the browser requests that page's offset and displays its records

#### Scenario: Filter resets page
- **WHEN** a user changes a list filter
- **THEN** the list returns to the first page
