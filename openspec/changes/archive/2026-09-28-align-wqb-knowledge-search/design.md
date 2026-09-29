# Design

Render `SearchFilterGroup` above the list with Content and State filters. Apply filters only on Search, reset to all records on Reset, and return to the first page on each filter change. Translate the shared filter clauses into the existing `text` and `state` query parameters. The backend accepts only one state; selecting both states means no state restriction. Text search uses the backend's existing lexical text parameter. No API contract or persistence migration is needed.
